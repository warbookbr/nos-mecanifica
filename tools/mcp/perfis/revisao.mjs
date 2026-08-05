/* revisao.mjs — adaptador MCP fino para os serviços existentes de modelagem. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { descreverPecaReutilizavel } from '../../mecanifica/descrever-peca.mjs';
import { validarPacoteNoDisco } from '../../modelagem/validar-pacote.mjs';
import { compararRevisoes } from '../../modelagem/revisao-modelagem.mjs';
import {
  RAIZ_PACOTES, caminhoDentro, caminhoPacote,
} from '../../modelagem/formato-pacote.mjs';
import {
  compararEntrada, compararSaida, descreverEntrada, descreverSaida,
  erroAcionavel, respostaErro, respostaOk, validarEntrada, validarSaida,
} from '../contratos.mjs';

const REVISOES = 'revisoes';

function textoCurto(valor, limite = 320) {
  const texto = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

function erroDeServico(resultado) {
  const categoria = resultado?.erro?.categoria;
  return respostaErro(resultado?.codigo ?? 1, erroAcionavel(
    resultado?.erro?.codigo ?? (categoria === 'uso' ? 'uso_invalido' : 'falha_servico'),
    textoCurto(resultado?.erro?.mensagem ?? 'O serviço recusou a operação.'),
    categoria === 'uso'
      ? 'Corrija os argumentos conforme o schema da ferramenta.'
      : 'Inspecione o diagnóstico estruturado antes de tentar novamente.',
  ));
}

function erroDeExcecao(codigo, erro, acao) {
  return respostaErro(1, erroAcionavel(codigo, textoCurto(erro?.message), acao));
}

function lerRevisaoOficial(id, nome) {
  const pasta = caminhoPacote(id, { raizPacotes: RAIZ_PACOTES });
  const arquivo = join(pasta, REVISOES, nome, 'revisao.json');
  if (!caminhoDentro(RAIZ_PACOTES, pasta) || !caminhoDentro(pasta, arquivo)) {
    throw new Error('revisão fora da raiz oficial.');
  }
  try {
    return JSON.parse(readFileSync(arquivo, 'utf8'));
  } catch {
    throw new Error(`a revisão oficial '${nome}' não foi encontrada ou não é JSON válido.`);
  }
}

export async function descrever(input) {
  const argumentos = descreverEntrada.parse(input);
  const resultado = await descreverPecaReutilizavel(argumentos);
  if (!resultado.ok) return erroDeServico(resultado);
  return respostaOk(resultado.codigo, {
    peca: resultado.resultado.peca,
    descricao: resultado.resultado.descricao,
  });
}

export async function validar(input) {
  const { id } = validarEntrada.parse(input);
  try {
    const validado = await validarPacoteNoDisco(id, { raizPacotes: RAIZ_PACOTES });
    return respostaOk(0, {
      id,
      modo: validado.modo,
      peca: validado.peca,
      partes: validado.partes,
      bytes: validado.bytes,
      alvo: validado.alvo
        ? {
          peca: validado.alvo.peca,
          partes: validado.alvo.partes,
          totais: validado.alvo.descricao.totais,
        }
        : null,
    });
  } catch (erro) {
    return erroDeExcecao('pacote_invalido', erro, 'Corrija o identificador ou o contrato do pacote e tente novamente.');
  }
}

export function comparar(input) {
  const { id, anterior, posterior } = compararEntrada.parse(input);
  try {
    return respostaOk(0, {
      id,
      anterior,
      posterior,
      comparacao: compararRevisoes(
        lerRevisaoOficial(id, anterior),
        lerRevisaoOficial(id, posterior),
      ),
    });
  } catch (erro) {
    return erroDeExcecao('revisoes_nao_comparadas', erro, 'Use duas revisões oficiais existentes do mesmo pacote.');
  }
}

export const ferramentasRevisao = Object.freeze([
  {
    nome: 'descrever_peca',
    descricao: 'Mede uma peça pela régua neutra existente, sem escrever no repositório.',
    inputSchema: descreverEntrada,
    outputSchema: descreverSaida,
    executar: descrever,
  },
  {
    nome: 'validar_pacote',
    descricao: 'Valida um pacote oficial somente leitura.',
    inputSchema: validarEntrada,
    outputSchema: validarSaida,
    executar: validar,
  },
  {
    nome: 'comparar_revisoes',
    descricao: 'Compara duas revisões oficiais do mesmo pacote.',
    inputSchema: compararEntrada,
    outputSchema: compararSaida,
    executar: comparar,
  },
]);
