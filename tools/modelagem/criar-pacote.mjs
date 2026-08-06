/* criar-pacote.mjs — aplicação atômica e confinada do plano de
   `planejar-pacote.mjs`. Recalcula o plano pelo mesmo serviço, exige a
   confirmação exata dele, escreve em diretório temporário irmão com criação
   exclusiva, confere byte a byte, e só então publica por rename atômico.
   Qualquer falha limpa a temporária e nunca deixa pacote parcial visível. */
import { randomBytes } from 'node:crypto';
import {
  lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  ErroDePacote, RAIZ_PACOTES, RAIZ_REPOSITORIO, algoExisteEm, caminhoPacote,
} from './formato-pacote.mjs';
import { planejarPacote } from './planejar-pacote.mjs';

function falhar(codigo, mensagem) {
  const erro = new ErroDePacote(mensagem);
  erro.codigo = codigo;
  throw erro;
}

/* Ponto único de I/O real, substituível em teste para injetar falha antes ou
   depois da primeira gravação, ou uma corrida em que o destino aparece entre
   a última checagem e o rename — sem tocar disco de verdade nesses testes. */
export const escritaPadrao = Object.freeze({
  mkdirSync, writeFileSync, renameSync, rmSync, readFileSync, algoExisteEm, lstatSync,
});

export async function criarPacoteAtomico({
  id, peca, modo = 'refinamento', partesEsperadas = null, confirmacao,
  raizPacotes = RAIZ_PACOTES, raizRepositorio = RAIZ_REPOSITORIO,
  escrita = escritaPadrao,
} = {}) {
  if (typeof confirmacao !== 'string' || confirmacao.trim() === '') {
    falhar('confirmacao_ausente', 'confirmacao é obrigatória; obtenha uma com planejar_pacote.');
  }

  /* Recalcula o plano pelo mesmo serviço que planejar_pacote usa — inclusive
     a mesma `precondicoesDeEscrita` (raiz/pai por symlink, destino já
     ocupado). Não duplicamos essas checagens aqui: rodar exatamente a mesma
     função é o que garante que dry-run e aplicação nunca divirjam. */
  const plano = await planejarPacote({ id, peca, modo, partesEsperadas, raizPacotes, raizRepositorio });
  if (plano.confirmacao !== confirmacao) {
    falhar('confirmacao_invalida', 'a confirmação não corresponde ao plano recalculado; peça um novo planejar_pacote.');
  }

  const destinoAbsoluto = caminhoPacote(id, { raizPacotes });
  escrita.mkdirSync(raizPacotes, { recursive: true });
  const temporaria = join(raizPacotes, `.tmp-${id}-${randomBytes(8).toString('hex')}`);
  /* `mkdirSync` sem `recursive` recusa qualquer coisa já existente nesse
     caminho exato — arquivo, pasta ou symlink — então a temporária nasce
     garantidamente exclusiva. */
  escrita.mkdirSync(temporaria);
  if (escrita.lstatSync(temporaria).isSymbolicLink()) {
    escrita.rmSync(temporaria, { recursive: true, force: true });
    falhar('escrita_invalida', 'a pasta temporária de escrita não pode ser um link simbólico.');
  }

  /* Fase 1 — gravação na temporária. Qualquer falha aqui (falha injetada,
     symlink plantado num dos dois caminhos, disco cheio, byte divergente na
     conferência) é um problema de escrita, não uma corrida no destino — as
     duas fases não podem compartilhar o mesmo catch, senão um EEXIST de
     symlink em `briefing.json` seria mal-rotulado como "pacote já existe". */
  try {
    for (const [nome, texto] of [
      ['briefing.json', plano.briefingTexto],
      ['referencias.json', plano.referenciasTexto],
    ]) {
      const caminho = join(temporaria, nome);
      /* `wx` é criação exclusiva: recusa qualquer coisa (arquivo ou symlink)
         já existente nesse caminho e nunca segue um symlink pra escrever
         através dele. */
      escrita.writeFileSync(caminho, texto, { encoding: 'utf8', flag: 'wx' });
      const conferido = escrita.readFileSync(caminho, 'utf8');
      if (conferido !== texto) {
        falhar('gravacao_divergente', `${nome} gravado não confere byte a byte com o planejado.`);
      }
    }
  } catch (erro) {
    escrita.rmSync(temporaria, { recursive: true, force: true });
    if (erro instanceof ErroDePacote) throw erro;
    process.stderr.write(`mecanifica-mcp: criar_pacote: falha de escrita (${erro?.code ?? erro?.name ?? 'Error'}).\n`);
    falhar('escrita_invalida', 'Não foi possível gravar os arquivos planejados; a pasta temporária pode estar obstruída.');
  }

  /* Fase 2 — publicação. `rename(pastaOrigem, pastaDestino)` do POSIX NÃO é
     exclusivo quando o destino já existe como diretório vazio — ele
     silenciosamente o substitui, sem erro. Só `mkdir` é de fato exclusivo
     contra qualquer coisa já existente nesse caminho, vazia ou não. Por isso
     a publicação cria o destino com `mkdir` puro e só então move os dois
     arquivos pra dentro — cada `rename` de arquivo é atômico e, como
     acabamos de criar `destinoAbsoluto` com exclusividade garantida, nada
     mais pode estar competindo pelos dois nomes de arquivo dentro dele. */
  try {
    escrita.mkdirSync(destinoAbsoluto);
  } catch (erro) {
    escrita.rmSync(temporaria, { recursive: true, force: true });
    if (erro && erro.code === 'EEXIST') {
      falhar('pacote_existente', `pacote '${id}' já existe; criar nunca sobrescreve.`);
    }
    throw erro;
  }
  try {
    escrita.renameSync(join(temporaria, 'briefing.json'), join(destinoAbsoluto, 'briefing.json'));
    escrita.renameSync(join(temporaria, 'referencias.json'), join(destinoAbsoluto, 'referencias.json'));
  } catch (erro) {
    /* `destinoAbsoluto` é nosso — acabamos de criá-lo com exclusividade —
       então é seguro desfazê-lo por completo: nenhuma falha aqui pode deixar
       um pacote parcial visível. */
    escrita.rmSync(destinoAbsoluto, { recursive: true, force: true });
    escrita.rmSync(temporaria, { recursive: true, force: true });
    throw erro;
  }
  escrita.rmSync(temporaria, { recursive: true, force: true });

  return {
    id,
    peca: plano.peca,
    modo: plano.modo,
    partesEsperadas: plano.partesEsperadas,
    destino: plano.destino,
    arquivos: plano.arquivos,
  };
}
