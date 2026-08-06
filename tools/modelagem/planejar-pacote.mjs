/* planejar-pacote.mjs — núcleo puro, sem escrita, do plano de autoria de um
   pacote canônico. `preparar-pacote.mjs` (CLI) e o perfil MCP `autoria`
   (`planejar_pacote`/`criar_pacote`) chamam exatamente esta função, para que
   plano e aplicação nunca possam divergir em regra ou default. */
import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import {
  ErroDePacote, RAIZ_PACOTES, RAIZ_REPOSITORIO, alvoExiste, caminhoPacote, descreverAlvo,
  precondicoesDeEscrita, serializarCanonico, validarPacote,
} from './formato-pacote.mjs';

export const VERSAO_CONTRATO_AUTORIA = 'mecanifica.mcp.autoria.v1';

function falhar(codigo, mensagem) {
  const erro = new ErroDePacote(mensagem);
  erro.codigo = codigo;
  throw erro;
}

function sha256(texto) {
  return `sha256:${createHash('sha256').update(texto, 'utf8').digest('hex')}`;
}

/**
 * Monta os dois documentos canônicos com os mesmos defaults de sempre, valida
 * pelo mesmo `validarPacote` e devolve um preview estruturado — id, peça,
 * modo, partes, destino e arquivos relativos, os dois documentos, seus bytes
 * canônicos e uma `confirmacao` determinística — sem escrever nada em disco.
 *
 * A confirmação amarra três coisas: a versão do contrato de autoria, a
 * entrada normalizada (id, peça, modo, partes) e os bytes canônicos exatos
 * dos dois JSONs. Mudar qualquer campo ou byte muda a confirmação.
 */
export async function planejarPacote({
  id, peca, modo = 'refinamento', partesEsperadas = null,
  raizPacotes = RAIZ_PACOTES, raizRepositorio = RAIZ_REPOSITORIO,
} = {}) {
  const destinoAbsoluto = caminhoPacote(id, { raizPacotes });
  const precondicao = precondicoesDeEscrita({ id, raizPacotes });
  if (!precondicao.ok) falhar(precondicao.codigo, precondicao.mensagem);
  if (!['refinamento', 'criacao'].includes(modo)) {
    falhar('entrada_invalida', 'modo precisa ser refinamento ou criacao.');
  }
  if (modo === 'refinamento' && partesEsperadas !== null) {
    falhar('entrada_invalida', 'partesEsperadas só pode ser declarada no modo criacao; refinamento confere a descrição atual.');
  }
  if (modo === 'criacao' && (!Array.isArray(partesEsperadas) || !partesEsperadas.length)) {
    falhar('entrada_invalida', 'modo criacao exige partesEsperadas semânticas e não vazias.');
  }
  if (modo === 'criacao' && alvoExiste(peca, { raizRepositorio })) {
    falhar('alvo_ja_existe', `alvo '${peca}' já existe; use modo refinamento para não mascarar partes existentes.`);
  }

  let alvo;
  if (modo === 'refinamento') {
    try {
      alvo = await descreverAlvo(peca, { raizRepositorio });
    } catch (erro) {
      if (erro instanceof ErroDePacote) {
        erro.codigo = /não existe/.test(erro.message) ? 'alvo_nao_encontrado' : 'alvo_invalido';
      }
      throw erro;
    }
  } else {
    alvo = { peca, partes: partesEsperadas };
  }

  const briefing = {
    formato: 'mecanifica.pacote-modelagem',
    versao: 1,
    id,
    alvo: { peca: alvo.peca, caminho: `prototipos/fps/v3/pecas/${alvo.peca}.js`, modo },
    objetivo: modo === 'criacao'
      ? `Criar a peça '${alvo.peca}' por evidência observável.`
      : `Revisar e refinar a peça '${alvo.peca}' por evidência observável.`,
    perfil: {
      visual: 'tecnicoDidatico',
      fidelidade: 'F2',
      precisao: 'mecanica',
      interacao: 'montagem',
      distanciaMinima: 0.5,
      orcamento: { faces: 2000 },
      /* Sem informação do pedido, PERFIS-DE-AUTORIA manda assumir este modo;
         a origem é determinística e não guarda data nem máquina. */
      origem: 'suposicao-canonica',
    },
    partesEsperadas: alvo.partes,
    guias: [
      'forma/silhueta-e-transicoes',
      'material/leitura-de-material',
      'processo/evidencia-e-iteracao',
    ],
    checklist: [
      { id: 'silhueta', prioridade: 1, estado: 'aberto', criterio: 'A silhueta permanece legível nas vistas ortogonais.' },
      { id: 'transicoes', prioridade: 2, estado: 'aberto', criterio: 'Transições relevantes têm intenção explícita, sem término seco involuntário.' },
      { id: 'material', prioridade: 3, estado: 'aberto', criterio: 'O material é distinguível pela forma, acabamento e leitura nas vistas canônicas.' },
      { id: 'semantica', prioridade: 4, estado: 'aberto', criterio: 'Cada parte esperada continua identificável e mensurável pela descrição headless.' },
    ],
    provas: ['descricao-headless', 'bancada-quatro-vistas'],
  };
  const referencias = {
    formato: 'mecanifica.referencias-modelagem',
    versao: 1,
    ausenciaDeclarada: true,
    referencias: [],
  };

  try {
    validarPacote(briefing, referencias, modo === 'refinamento' ? { partesDisponiveis: alvo.partes } : {});
  } catch (erro) {
    if (erro instanceof ErroDePacote && !erro.codigo) erro.codigo = 'entrada_invalida';
    throw erro;
  }

  const briefingTexto = serializarCanonico(briefing);
  const referenciasTexto = serializarCanonico(referencias);
  const entradaNormalizada = { id, peca: alvo.peca, modo, partesEsperadas: [...alvo.partes] };
  const confirmacao = sha256(JSON.stringify({
    contrato: VERSAO_CONTRATO_AUTORIA,
    entrada: entradaNormalizada,
    briefing: sha256(briefingTexto),
    referencias: sha256(referenciasTexto),
  }));
  const destino = relative(raizRepositorio, destinoAbsoluto);

  return {
    id,
    peca: alvo.peca,
    modo,
    partesEsperadas: [...alvo.partes],
    destino,
    arquivos: [
      { caminho: `${destino}/briefing.json`, bytes: Buffer.byteLength(briefingTexto, 'utf8'), sha256: sha256(briefingTexto) },
      { caminho: `${destino}/referencias.json`, bytes: Buffer.byteLength(referenciasTexto, 'utf8'), sha256: sha256(referenciasTexto) },
    ],
    briefing,
    referencias,
    briefingTexto,
    referenciasTexto,
    confirmacao,
  };
}
