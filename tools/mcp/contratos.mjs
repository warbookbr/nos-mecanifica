/* contratos.mjs — schemas e respostas públicas do perfil MCP somente leitura. */
import { z } from 'zod';

export const VERSAO_CONTRATO_MCP = 'mecanifica.mcp.revisao.v1';
export const PERFIL = 'revisao';
export const TRANSPORTE = 'stdio';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const identificador = z.string().min(1);
const revisao = z.string().regex(/^r[0-9]+$/);
const erro = z.object({
  codigo: z.string(),
  mensagem: z.string(),
  acao: z.string(),
});
const respostaBase = {
  ok: z.boolean(),
  codigo: z.number().int(),
  erro: erro.optional(),
};
const objetoEstruturado = z.record(z.string(), z.unknown());

export const descreverEntrada = z.object({
  peca: z.string().min(1),
  partes: z.array(z.string()).optional(),
  subarvore: z.string().min(1).optional(),
  casas: z.number().int().min(0).max(12).optional(),
  estrito: z.boolean().optional(),
}).strict();

export const validarEntrada = z.object({ id: identificador }).strict();

export const compararEntrada = z.object({
  id: identificador,
  anterior: revisao,
  posterior: revisao,
}).strict();

export const descreverSaida = z.object({
  ...respostaBase,
  resultado: z.object({
    peca: z.string(),
    descricao: objetoEstruturado,
  }).optional(),
}).strict();

export const validarSaida = z.object({
  ...respostaBase,
  resultado: z.object({
    id: slug,
    modo: z.string(),
    peca: z.string(),
    partes: z.array(z.string()),
    bytes: z.number().int(),
    alvo: z.object({
      peca: z.string(),
      partes: z.array(z.string()),
      totais: objetoEstruturado.optional(),
    }).nullable(),
  }).optional(),
}).strict();

export const compararSaida = z.object({
  ...respostaBase,
  resultado: z.object({
    id: slug,
    anterior: revisao,
    posterior: revisao,
    comparacao: objetoEstruturado,
  }).optional(),
}).strict();

export function respostaOk(codigo, resultado) {
  return { ok: true, codigo, resultado };
}

export function respostaErro(codigo, erroDetalhe) {
  return { ok: false, codigo, erro: erroDetalhe };
}

export function erroAcionavel(codigo, mensagem, acao) {
  return { codigo, mensagem, acao };
}
