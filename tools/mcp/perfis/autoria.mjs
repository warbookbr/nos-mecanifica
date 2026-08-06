/* autoria.mjs — adaptador MCP fino do perfil de escrita confinada e atômica.
   Não duplica regra de negócio: planejar_pacote e criar_pacote só traduzem
   entrada/saída em cima de planejar-pacote.mjs e criar-pacote.mjs. */
import { planejarPacote } from '../../modelagem/planejar-pacote.mjs';
import { criarPacoteAtomico } from '../../modelagem/criar-pacote.mjs';
import { ErroDePacote } from '../../modelagem/formato-pacote.mjs';
import {
  criarEntrada, criarSaida, erroAcionavel, planejarEntrada, planejarSaida, respostaErro, respostaOk,
} from '../contratos.mjs';

function textoCurto(valor, limite = 320) {
  const texto = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

function entradaRecusada() {
  return respostaErro(1, erroAcionavel(
    'entrada_recusada',
    'A entrada não atende ao schema da ferramenta.',
    'Corrija os campos conforme o schema anunciado em tools/list.',
  ));
}

function falhaInterna(nome, erro) {
  const tipo = erro?.name ?? 'Error';
  process.stderr.write(`mecanifica-mcp: ${nome}: falha interna (${tipo}).\n`);
  return respostaErro(1, erroAcionavel(
    'falha_interna',
    'A ferramenta não conseguiu concluir a operação.',
    'Tente novamente; não altere os argumentos com base neste erro.',
  ));
}

const ACAO_POR_CODIGO = {
  pacote_existente: 'Escolha outro id; planejar_pacote/criar_pacote nunca sobrescrevem um pacote existente.',
  alvo_ja_existe: 'Use modo refinamento para a peça existente, ou escolha outro nome de peça para a criação.',
  alvo_nao_encontrado: 'Confirme o nome da peça ou use modo criacao para começar do zero.',
  alvo_invalido: 'Corrija a fonte da peça antes de planejar o refinamento.',
  entrada_invalida: 'Corrija os campos conforme o contrato de pacote de modelagem.',
  confirmacao_ausente: 'Chame planejar_pacote e reenvie a confirmação exata no criar_pacote.',
  confirmacao_invalida: 'A entrada mudou desde o planejamento; chame planejar_pacote de novo antes de criar_pacote.',
  raiz_invalida: 'Não é possível aplicar; reporte esta condição sem tentar novamente.',
  escrita_invalida: 'Não é possível aplicar; reporte esta condição sem tentar novamente.',
  gravacao_divergente: 'Não repita automaticamente; reporte esta condição.',
};

function erroDePacoteParaResposta(erro) {
  const codigo = erro.codigo ?? 'entrada_invalida';
  return respostaErro(1, erroAcionavel(
    codigo,
    textoCurto(erro.message),
    ACAO_POR_CODIGO[codigo] ?? 'Corrija os argumentos conforme o schema da ferramenta.',
  ));
}

export async function planejar(input) {
  let argumentos;
  try { argumentos = planejarEntrada.parse(input); } catch { return entradaRecusada(); }
  try {
    const plano = await planejarPacote(argumentos);
    return respostaOk(0, {
      id: plano.id,
      peca: plano.peca,
      modo: plano.modo,
      partesEsperadas: plano.partesEsperadas,
      destino: plano.destino,
      arquivos: plano.arquivos,
      briefing: plano.briefing,
      referencias: plano.referencias,
      confirmacao: plano.confirmacao,
    });
  } catch (erro) {
    if (erro instanceof ErroDePacote) return erroDePacoteParaResposta(erro);
    return falhaInterna('planejar_pacote', erro);
  }
}

export async function criar(input) {
  let argumentos;
  try { argumentos = criarEntrada.parse(input); } catch { return entradaRecusada(); }
  try {
    const criado = await criarPacoteAtomico(argumentos);
    return respostaOk(0, {
      id: criado.id,
      peca: criado.peca,
      modo: criado.modo,
      partesEsperadas: criado.partesEsperadas,
      destino: criado.destino,
      arquivos: criado.arquivos,
    });
  } catch (erro) {
    if (erro instanceof ErroDePacote) return erroDePacoteParaResposta(erro);
    return falhaInterna('criar_pacote', erro);
  }
}

export const ferramentasAutoria = Object.freeze([
  {
    nome: 'planejar_pacote',
    descricao: 'Planeja um pacote canônico novo sem escrever, e devolve uma confirmação vinculada ao plano.',
    inputSchema: planejarEntrada,
    outputSchema: planejarSaida,
    executar: planejar,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    nome: 'criar_pacote',
    descricao: 'Aplica de forma atômica e confinada um pacote já planejado, mediante a confirmação exata.',
    inputSchema: criarEntrada,
    outputSchema: criarSaida,
    executar: criar,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
]);
