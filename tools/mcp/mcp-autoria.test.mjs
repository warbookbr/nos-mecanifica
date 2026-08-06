/* mcp-autoria.test.mjs — contrato real de stdio do perfil `autoria`: duas
   ferramentas, nenhum recurso, prova caixa-preta plano→confirmação→aplicação
   com workspace descartável, e prova de que `revisao` não muda em nada. */
import { existsSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Client, LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SERVIDOR = join(RAIZ, 'tools/mcp/servidor.mjs');

function clienteStdio({ perfil } = {}) {
  const processo = spawn(process.execPath, [SERVIDOR], {
    cwd: RAIZ,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: perfil ? { ...process.env, MECANIFICA_MCP_PERFIL: perfil } : process.env,
  });
  let buffer = '';
  let proximoId = 1;
  let stderr = '';
  const respostas = new Map();
  const stdoutNaoProtocolar = [];
  processo.stderr.setEncoding('utf8');
  processo.stderr.on('data', (chunk) => { stderr += chunk; });
  processo.stdout.setEncoding('utf8');
  processo.stdout.on('data', (chunk) => {
    buffer += chunk;
    let quebra;
    while ((quebra = buffer.indexOf('\n')) >= 0) {
      const linha = buffer.slice(0, quebra).trim();
      buffer = buffer.slice(quebra + 1);
      if (!linha) continue;
      let mensagem;
      try { mensagem = JSON.parse(linha); } catch { stdoutNaoProtocolar.push(linha); continue; }
      const pendente = respostas.get(mensagem.id);
      if (pendente) {
        respostas.delete(mensagem.id);
        pendente.resolve(mensagem);
      }
    }
  });
  processo.on('close', () => {
    for (const { reject } of respostas.values()) reject(new Error('servidor encerrou antes da resposta.'));
    respostas.clear();
  });
  function enviar(method, params = {}) {
    const id = proximoId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        respostas.delete(id);
        reject(new Error(`tempo esgotado para ${method}`));
      }, 20_000);
      respostas.set(id, {
        resolve: (mensagem) => { clearTimeout(timer); resolve(mensagem); },
        reject: (erro) => { clearTimeout(timer); reject(erro); },
      });
      processo.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }
  function notificar(method, params = {}) {
    processo.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
  }
  async function fechar() {
    processo.stdin.end();
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('servidor não encerrou')), 5_000);
      processo.once('close', (codigo, sinal) => {
        clearTimeout(timer);
        if (codigo !== 0 && sinal === null) reject(new Error(`servidor encerrou com código ${codigo}`));
        else resolve();
      });
    });
    return { stderr, stdoutNaoProtocolar };
  }
  return { enviar, notificar, fechar, processo };
}

async function conectado(perfil) {
  const cliente = clienteStdio({ perfil });
  const inicializacao = await cliente.enviar('initialize', {
    protocolVersion: LATEST_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'teste-mecanifica-autoria', version: '1' },
  });
  cliente.notificar('notifications/initialized');
  return { cliente, inicializacao };
}

/* Garante limpeza mesmo se o teste falhar no meio, sem deixar pacote piloto
   permanente em `main` — o workspace da prova é sempre descartável. */
function limparPacotePiloto(id) {
  rmSync(join(RAIZ, 'autoria-assistida/pacotes', id), { recursive: true, force: true });
}

describe('servidor MCP local — perfil autoria', () => {
  it('importa sem iniciar stdio nem escrever', () => {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', `import(${JSON.stringify(SERVIDOR)})`], {
      cwd: RAIZ, encoding: 'utf8', timeout: 5_000,
    });
    expect(resultado.status).toBe(0);
    expect(resultado.stdout).toBe('');
    expect(resultado.stderr).toBe('');
  });

  it('anuncia exatamente duas ferramentas e nenhum recurso', async () => {
    const { cliente, inicializacao } = await conectado('autoria');
    try {
      expect(inicializacao.result.capabilities).toEqual({ tools: { listChanged: true } });
      const ferramentas = await cliente.enviar('tools/list');
      expect(ferramentas.result.tools.map((t) => t.name)).toEqual(['planejar_pacote', 'criar_pacote']);
      expect(ferramentas.result.tools).toHaveLength(2);
      for (const tool of ferramentas.result.tools) expect(tool.outputSchema).toBeDefined();
      const planejar = ferramentas.result.tools.find((t) => t.name === 'planejar_pacote');
      const criar = ferramentas.result.tools.find((t) => t.name === 'criar_pacote');
      expect(planejar.annotations.readOnlyHint).toBe(true);
      expect(criar.annotations.readOnlyHint).toBe(false);
      /* sem capability de resources, resources/list não é um método suportado */
      const recursos = await cliente.enviar('resources/list');
      expect(recursos.error).toBeDefined();
    } finally {
      await cliente.fechar();
    }
  }, 20_000);

  it('perfil revisao permanece com exatamente quatro ferramentas e três recursos, mesmo com autoria.mjs no processo', async () => {
    const { cliente, inicializacao } = await conectado(); // sem perfil = default revisao
    try {
      expect(inicializacao.result.capabilities).toEqual({
        tools: { listChanged: true }, resources: { listChanged: true },
      });
      const ferramentas = await cliente.enviar('tools/list');
      expect(ferramentas.result.tools.map((t) => t.name)).toEqual([
        'descrever_peca', 'validar_pacote', 'comparar_revisoes', 'renderizar_vistas',
      ]);
      const recursos = await cliente.enviar('resources/list');
      expect(recursos.result.resources.map((r) => r.uri)).toEqual([
        'mecanifica://estado', 'mecanifica://capacidades/modelagem', 'mecanifica://pacotes',
      ]);
    } finally {
      await cliente.fechar();
    }
  }, 20_000);

  it('valor de MECANIFICA_MCP_PERFIL desconhecido cai em revisao (default seguro)', async () => {
    const { cliente } = await conectado('algo-que-nao-existe');
    try {
      const ferramentas = await cliente.enviar('tools/list');
      expect(ferramentas.result.tools.map((t) => t.name)).toEqual([
        'descrever_peca', 'validar_pacote', 'comparar_revisoes', 'renderizar_vistas',
      ]);
    } finally {
      await cliente.fechar();
    }
  }, 20_000);

  it('planejar_pacote recusa entrada fora do schema, sem escrever', async () => {
    const { cliente } = await conectado('autoria');
    try {
      const resposta = await cliente.enviar('tools/call', {
        name: 'planejar_pacote', arguments: { id: 'ID-MAIUSCULO', peca: '_jardineira', modo: 'refinamento' },
      });
      expect(resposta.result).toMatchObject({ isError: true });
      expect(resposta.result.structuredContent).toBeUndefined();
      expect(resposta.result.content[0].text).toMatch(/Input validation error/);
    } finally {
      await cliente.fechar();
    }
  }, 20_000);

  it('criar_pacote recusa confirmação ausente/malformada pelo schema, sem escrever', async () => {
    const { cliente } = await conectado('autoria');
    try {
      const semConfirmacao = await cliente.enviar('tools/call', {
        name: 'criar_pacote', arguments: { id: 'sem-confirmacao-mcp', peca: '_jardineira', modo: 'refinamento' },
      });
      expect(semConfirmacao.result).toMatchObject({ isError: true });
      expect(semConfirmacao.result.content[0].text).toMatch(/Input validation error/);

      const confirmacaoMalformada = await cliente.enviar('tools/call', {
        name: 'criar_pacote',
        arguments: {
          id: 'confirmacao-malformada-mcp', peca: '_jardineira', modo: 'refinamento', confirmacao: 'nao-e-sha256',
        },
      });
      expect(confirmacaoMalformada.result).toMatchObject({ isError: true });
      expect(confirmacaoMalformada.result.content[0].text).toMatch(/Input validation error/);
      expect(existsSync(join(RAIZ, 'autoria-assistida/pacotes/sem-confirmacao-mcp'))).toBe(false);
      expect(existsSync(join(RAIZ, 'autoria-assistida/pacotes/confirmacao-malformada-mcp'))).toBe(false);
    } finally {
      await cliente.fechar();
    }
  }, 20_000);

  it(
    'prova caixa-preta: planejar → confirmar → criar → validar pelo perfil revisao → recusa de repetição → workspace descartável',
    async () => {
      const id = 'prova-autoria-mancal-ci';
      limparPacotePiloto(id);
      const clienteAutoria = clienteStdio({ perfil: 'autoria' });
      try {
        await clienteAutoria.enviar('initialize', {
          protocolVersion: LATEST_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'prova-autoria', version: '1' },
        });
        clienteAutoria.notificar('notifications/initialized');

        const plano = await clienteAutoria.enviar('tools/call', {
          name: 'planejar_pacote', arguments: { id, peca: '_mancal-de-mesa', modo: 'refinamento' },
        });
        expect(plano.result.isError).toBe(false);
        const resultadoPlano = plano.result.structuredContent.resultado;
        expect(resultadoPlano.destino).toBe(`autoria-assistida/pacotes/${id}`);
        expect(resultadoPlano.arquivos).toHaveLength(2);
        expect(resultadoPlano.confirmacao).toMatch(/^sha256:[a-f0-9]{64}$/);
        expect(existsSync(join(RAIZ, 'autoria-assistida/pacotes', id))).toBe(false);

        const criado = await clienteAutoria.enviar('tools/call', {
          name: 'criar_pacote',
          arguments: { id, peca: '_mancal-de-mesa', modo: 'refinamento', confirmacao: resultadoPlano.confirmacao },
        });
        expect(criado.result.isError).toBe(false);
        expect(criado.result.structuredContent.resultado.destino).toBe(resultadoPlano.destino);
        expect(existsSync(join(RAIZ, 'autoria-assistida/pacotes', id, 'briefing.json'))).toBe(true);
        expect(existsSync(join(RAIZ, 'autoria-assistida/pacotes', id, 'referencias.json'))).toBe(true);

        const repeticao = await clienteAutoria.enviar('tools/call', {
          name: 'criar_pacote',
          arguments: { id, peca: '_mancal-de-mesa', modo: 'refinamento', confirmacao: resultadoPlano.confirmacao },
        });
        expect(repeticao.result.isError).toBe(true);
        expect(repeticao.result.structuredContent.erro.codigo).toBe('pacote_existente');
      } finally {
        await clienteAutoria.fechar();
      }

      const clienteRevisao = clienteStdio();
      try {
        await clienteRevisao.enviar('initialize', {
          protocolVersion: LATEST_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'prova-revisao', version: '1' },
        });
        clienteRevisao.notificar('notifications/initialized');
        const validado = await clienteRevisao.enviar('tools/call', {
          name: 'validar_pacote', arguments: { id },
        });
        expect(validado.result.isError).toBe(false);
        expect(validado.result.structuredContent.resultado).toMatchObject({ id, peca: '_mancal-de-mesa' });
      } finally {
        await clienteRevisao.fechar();
        limparPacotePiloto(id);
        expect(existsSync(join(RAIZ, 'autoria-assistida/pacotes', id))).toBe(false);
      }
    },
    30_000,
  );

  it('mantém stderr fora do protocolo e encerra o processo stdio limpo no perfil autoria', async () => {
    const { cliente } = await conectado('autoria');
    const encerramento = await cliente.fechar();
    expect(encerramento.stdoutNaoProtocolar).toEqual([]);
    expect(encerramento.stderr).toBe('');
  }, 20_000);
});
