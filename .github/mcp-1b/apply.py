from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]


def replace_once(rel, old, new):
    path = ROOT / rel
    text = path.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{rel}: trecho esperado ocorreu {count} vez(es), esperado 1')
    path.write_text(text.replace(old, new), encoding='utf-8')


def append_before(rel, marker, addition):
    replace_once(rel, marker, addition + marker)


# tools/mecanifica/olhar-bancada.mjs
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "function urlPublicadaDa(url) {\n  return `https://warbookbr.github.io/nos-mecanifica/bancada.html${new URL(url).search}`;\n}\n",
    "function urlPublicadaDa(url) {\n  return `https://warbookbr.github.io/nos-mecanifica/bancada.html${new URL(url).search}`;\n}\n\nfunction erroDeTempo(timeoutMs) {\n  const erro = new Error(`A bancada excedeu o limite de ${timeoutMs} ms.`);\n  erro.codigo = 'tempo_esgotado';\n  return erro;\n}\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "  revisar = false,\n  logger = null,\n  dependencias = {},\n",
    "  revisar = false,\n  capturarEmMemoria = false,\n  timeoutMs = null,\n  logger = null,\n  dependencias = {},\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "  let browser = null;\n  let resposta = null;\n  try {\n",
    "  let browser = null;\n  let resposta = null;\n  let temporizador = null;\n  let encerramentoForcado = null;\n  let expirou = false;\n  try {\n    if (capturarEmMemoria && (saidaDeclarada !== null || relatorioDeclarado !== null)) {\n      erroDeUso('captura em memória não aceita --saida ou --relatorio.');\n    }\n    if (timeoutMs !== null && (!Number.isFinite(Number(timeoutMs)) || Number(timeoutMs) <= 0)) {\n      erroDeUso('timeoutMs precisa ser um número positivo.');\n    }\n    if (timeoutMs !== null) {\n      temporizador = setTimeout(() => {\n        expirou = true;\n        encerramentoForcado = fecharRecursos({ browser, vite });\n      }, Number(timeoutMs));\n    }\n    const garantirPrazo = () => {\n      if (expirou) throw erroDeTempo(Number(timeoutMs));\n    };\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "    const saida = caminhoInterno(saidaDeclarada, 'saida') ?? OUT;\n    const relatorio = caminhoInterno(relatorioDeclarado, 'relatorio');\n",
    "    const saida = capturarEmMemoria ? null : (caminhoInterno(saidaDeclarada, 'saida') ?? OUT);\n    const relatorio = capturarEmMemoria ? null : caminhoInterno(relatorioDeclarado, 'relatorio');\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "    criarDiretorioConfinado(saida, { raiz: REPO });\n    const arquivosPlanejados = peca\n      ? vistas.map((vista) => join(saida, `bancada-${peca}-${vista}${sufixo}.png`))\n      : [];\n",
    "    if (!capturarEmMemoria) criarDiretorioConfinado(saida, { raiz: REPO });\n    const arquivosPlanejados = !capturarEmMemoria && peca\n      ? vistas.map((vista) => join(saida, `bancada-${peca}-${vista}${sufixo}.png`))\n      : [];\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "    await vite.listen();\n    const { port } = vite.httpServer.address();\n",
    "    await vite.listen();\n    garantirPrazo();\n    const { port } = vite.httpServer.address();\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "    browser = await pw.chromium.launch({\n      args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],\n    });\n    const page = await browser.newPage({ viewport: { width: largura, height: altura } });\n",
    "    browser = await pw.chromium.launch({\n      args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],\n    });\n    garantirPrazo();\n    const page = await browser.newPage({ viewport: { width: largura, height: altura } });\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "    let falhou = false;\n    const vistasRelatadas = [];\n    let pecaRelatada = null;\n",
    "    let falhou = false;\n    const vistasRelatadas = [];\n    const capturas = [];\n    let pecaRelatada = null;\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "      const tentativaDeAbertura = await abrirComRepeticao(url);\n      if (tentativaDeAbertura > 1)",
    "      const tentativaDeAbertura = await abrirComRepeticao(url);\n      garantirPrazo();\n      if (tentativaDeAbertura > 1)",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "      await page.waitForTimeout(espera);\n      const urlReproduzivel = await page.evaluate(() => window.__mecanificaBancada.url());\n",
    "      await page.waitForTimeout(espera);\n      garantirPrazo();\n      const urlReproduzivel = await page.evaluate(() => window.__mecanificaBancada.url());\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "      pecaRelatada = dado.peca;\n      const arquivo = join(saida, `bancada-${dado.peca}-${vista}${sufixo}.png`);\n      verificarCaminhoConfinado(arquivo, { raiz: REPO });\n      await page.screenshot({ path: arquivo });\n      registrar(relato, logger, 'stdout', `${vistaRelatada.padEnd(11)} ${arquivo}`);\n      registrar(relato, logger, 'stdout', `            local: ${urlReproduzivel}`);\n      registrar(relato, logger, 'stdout', `            Pages após publicar este commit: ${urlPublicadaDa(urlReproduzivel)}`);\n",
    "      pecaRelatada = dado.peca;\n      if (capturarEmMemoria) {\n        const dados = await page.screenshot({ type: 'png' });\n        garantirPrazo();\n        capturas.push({ nome: vistaRelatada, mimeType: 'image/png', largura, altura, dados });\n        registrar(relato, logger, 'stdout', `${vistaRelatada.padEnd(11)} memória: ${dados.byteLength} bytes`);\n      } else {\n        const arquivo = join(saida, `bancada-${dado.peca}-${vista}${sufixo}.png`);\n        verificarCaminhoConfinado(arquivo, { raiz: REPO });\n        await page.screenshot({ path: arquivo });\n        registrar(relato, logger, 'stdout', `${vistaRelatada.padEnd(11)} ${arquivo}`);\n        registrar(relato, logger, 'stdout', `            local: ${urlReproduzivel}`);\n        registrar(relato, logger, 'stdout', `            Pages após publicar este commit: ${urlPublicadaDa(urlReproduzivel)}`);\n      }\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "    const resultado = { peca: pecaRelatada, falhas: falhasRelatadas, vistas: vistasRelatadas, arquivos: arquivosPlanejados };\n",
    "    const resultado = {\n      peca: pecaRelatada, falhas: falhasRelatadas, vistas: vistasRelatadas, arquivos: arquivosPlanejados,\n      ...(capturarEmMemoria ? { capturas } : {}),\n    };\n",
)
replace_once(
    'tools/mecanifica/olhar-bancada.mjs',
    "  } catch (erro) {\n    resposta = erroEstruturado({ relato, erro, resultado: { falhas: falhasRelatadas } });\n  } finally {\n    const limpeza = await fecharRecursos({ browser, vite });\n",
    "  } catch (erro) {\n    if (expirou || erro?.codigo === 'tempo_esgotado') {\n      resposta = erroEstruturado({ relato, erro: erroDeTempo(Number(timeoutMs)), resultado: { falhas: falhasRelatadas } });\n      resposta.erro.codigo = 'tempo_esgotado';\n    } else {\n      resposta = erroEstruturado({ relato, erro, resultado: { falhas: falhasRelatadas } });\n    }\n  } finally {\n    if (temporizador) clearTimeout(temporizador);\n    const limpezaForcada = encerramentoForcado ? await encerramentoForcado : [];\n    const limpeza = [...limpezaForcada, ...await fecharRecursos({ browser, vite })];\n",
)

# tools/mcp/contratos.mjs
replace_once(
    'tools/mcp/contratos.mjs',
    "export const VERSAO_CONTRATO_MCP = 'mecanifica.mcp.revisao.v1';",
    "export const VERSAO_CONTRATO_MCP = 'mecanifica.mcp.revisao.v2';",
)
replace_once(
    'tools/mcp/contratos.mjs',
    "export const compararEntrada = z.object({\n  id: slug,\n  anterior: revisao,\n  posterior: revisao,\n}).strict();\n",
    "export const compararEntrada = z.object({\n  id: slug,\n  anterior: revisao,\n  posterior: revisao,\n}).strict();\n\nexport const renderizarEntrada = z.object({ peca }).strict();\n",
)
append_before(
    'tools/mcp/contratos.mjs',
    "\nexport function respostaOk(codigo, resultado) {",
    "\nconst enquadramentoPublico = z.object({\n  valida: z.boolean(),\n  area: z.number(),\n  largura: z.number(),\n  altura: z.number(),\n  cortado: z.boolean(),\n}).strict();\n\nexport const renderizarSaida = z.object({\n  ...respostaBase,\n  resultado: z.object({\n    formato: z.literal('mecanifica.vistas-oficiais'),\n    versao: z.literal(1),\n    peca: z.string(),\n    duracaoMs: z.number().int().nonnegative(),\n    bytes: z.number().int().nonnegative(),\n    vistas: z.array(z.object({\n      nome: z.enum(['isometrica', 'frontal', 'direita', 'superior']),\n      mimeType: z.literal('image/png'),\n      largura: z.number().int().positive(),\n      altura: z.number().int().positive(),\n      bytes: z.number().int().nonnegative(),\n      sha256: z.string().regex(/^sha256:[a-f0-9]{64}$/),\n      enquadramento: enquadramentoPublico,\n    }).strict()).length(4),\n  }).optional(),\n}).strict();\n",
)

# tools/mcp/perfis/revisao.mjs
replace_once(
    'tools/mcp/perfis/revisao.mjs',
    "import { readFileSync } from 'node:fs';\n",
    "import { createHash } from 'node:crypto';\nimport { readFileSync } from 'node:fs';\n",
)
replace_once(
    'tools/mcp/perfis/revisao.mjs',
    "import { descreverPecaReutilizavel } from '../../mecanifica/descrever-peca.mjs';\n",
    "import { descreverPecaReutilizavel } from '../../mecanifica/descrever-peca.mjs';\nimport { olharBancada } from '../../mecanifica/olhar-bancada.mjs';\n",
)
replace_once(
    'tools/mcp/perfis/revisao.mjs',
    "  compararEntrada, compararSaida, descreverEntrada, descreverSaida,\n  erroAcionavel, respostaErro, respostaOk, validarEntrada, validarSaida,\n",
    "  compararEntrada, compararSaida, descreverEntrada, descreverSaida,\n  erroAcionavel, renderizarEntrada, renderizarSaida, respostaErro, respostaOk,\n  validarEntrada, validarSaida,\n",
)
replace_once(
    'tools/mcp/perfis/revisao.mjs',
    "const REVISOES = 'revisoes';\n",
    "const REVISOES = 'revisoes';\nconst VISTAS_OFICIAIS = Object.freeze(['isometrica', 'frontal', 'direita', 'superior']);\nexport const LIMITES_VISTAS = Object.freeze({\n  imagemBytes: 2 * 1024 * 1024,\n  totalBytes: 8 * 1024 * 1024,\n  respostaBytes: 11 * 1024 * 1024,\n  timeoutMs: 45_000,\n});\n",
)
append_before(
    'tools/mcp/perfis/revisao.mjs',
    "\nexport const ferramentasRevisao = Object.freeze([",
    "\nfunction pacoteVisual(resposta, imagens = []) {\n  return { resposta, imagens };\n}\n\nexport function conteudoRenderizacao({ resposta, imagens }) {\n  if (!resposta.ok) {\n    return [{ type: 'text', text: `renderizar_vistas: ${resposta.erro?.mensagem ?? 'operação recusada.'}` }];\n  }\n  return [\n    { type: 'text', text: 'renderizar_vistas: quatro vistas oficiais produzidas.' },\n    ...imagens.map(({ data, mimeType }) => ({ type: 'image', data, mimeType })),\n  ];\n}\n\nfunction erroVisual(codigo, mensagem, acao) {\n  return pacoteVisual(respostaErro(1, erroAcionavel(codigo, mensagem, acao)));\n}\n\nexport async function renderizar(input, {\n  olhar = olharBancada,\n  limites = LIMITES_VISTAS,\n  agora = () => Date.now(),\n} = {}) {\n  let argumentos;\n  try { argumentos = renderizarEntrada.parse(input); } catch { return pacoteVisual(entradaRecusada()); }\n  const inicio = agora();\n  let capturado;\n  try {\n    capturado = await olhar({\n      peca: argumentos.peca,\n      revisar: true,\n      capturarEmMemoria: true,\n      timeoutMs: limites.timeoutMs,\n    });\n  } catch (erro) {\n    return pacoteVisual(falhaInterna('renderizar_vistas', erro));\n  }\n  if (!capturado.ok) {\n    const tempo = capturado.erro?.codigo === 'tempo_esgotado';\n    return erroVisual(\n      tempo ? 'tempo_esgotado' : (capturado.erro?.codigo ?? 'falha_bancada'),\n      textoCurto(capturado.erro?.mensagem ?? 'A bancada recusou a captura.'),\n      tempo\n        ? 'Reduza o custo da captura sem alterar as quatro vistas oficiais, ou pare a fatia.'\n        : 'Inspecione o diagnóstico da bancada antes de tentar novamente.',\n    );\n  }\n  const capturas = capturado.resultado?.capturas;\n  const vistasRelatadas = capturado.resultado?.vistas ?? [];\n  if (!Array.isArray(capturas) || capturas.length !== VISTAS_OFICIAIS.length\n    || capturas.some((captura, indice) => captura.nome !== VISTAS_OFICIAIS[indice])) {\n    return erroVisual(\n      'vistas_incompletas',\n      'A bancada não devolveu exatamente as quatro vistas oficiais na ordem contratada.',\n      'Corrija o serviço compartilhado; não complete a resposta com capturas sintéticas.',\n    );\n  }\n  const imagens = [];\n  const vistas = [];\n  let totalBytes = 0;\n  for (const captura of capturas) {\n    const dados = Buffer.isBuffer(captura.dados) ? captura.dados : Buffer.from(captura.dados ?? []);\n    if (dados.byteLength > limites.imagemBytes) {\n      return erroVisual(\n        'payload_excedido',\n        `A vista '${captura.nome}' excedeu o limite de ${limites.imagemBytes} bytes.`,\n        'Pare a fatia e decida outro transporte; não reduza a prova oficial silenciosamente.',\n      );\n    }\n    totalBytes += dados.byteLength;\n    const relato = vistasRelatadas.find(({ nome }) => nome === captura.nome);\n    if (!relato?.enquadramento) {\n      return erroVisual(\n        'vistas_incompletas',\n        `A vista '${captura.nome}' não trouxe métricas de enquadramento.`,\n        'Corrija a paridade com o serviço da bancada antes de publicar a ferramenta.',\n      );\n    }\n    const data = dados.toString('base64');\n    imagens.push({ nome: captura.nome, mimeType: 'image/png', data });\n    vistas.push({\n      nome: captura.nome,\n      mimeType: 'image/png',\n      largura: captura.largura,\n      altura: captura.altura,\n      bytes: dados.byteLength,\n      sha256: `sha256:${createHash('sha256').update(dados).digest('hex')}`,\n      enquadramento: relato.enquadramento,\n    });\n  }\n  if (totalBytes > limites.totalBytes) {\n    return erroVisual(\n      'payload_excedido',\n      `As quatro vistas somaram ${totalBytes} bytes; o limite é ${limites.totalBytes}.`,\n      'Pare a fatia e decida outro transporte; não omita nem recomprima vistas silenciosamente.',\n    );\n  }\n  const resposta = respostaOk(0, {\n    formato: 'mecanifica.vistas-oficiais',\n    versao: 1,\n    peca: capturado.resultado.peca,\n    duracaoMs: Math.max(0, Math.round(agora() - inicio)),\n    bytes: totalBytes,\n    vistas,\n  });\n  const pacote = pacoteVisual(resposta, imagens);\n  const respostaBytes = Buffer.byteLength(JSON.stringify({\n    content: conteudoRenderizacao(pacote),\n    structuredContent: resposta,\n  }), 'utf8');\n  if (respostaBytes > limites.respostaBytes) {\n    return erroVisual(\n      'payload_excedido',\n      `A resposta MCP serializada teria ${respostaBytes} bytes; o limite é ${limites.respostaBytes}.`,\n      'Pare a fatia e decida outro transporte; não altere as quatro vistas oficiais silenciosamente.',\n    );\n  }\n  return pacote;\n}\n",
)
replace_once(
    'tools/mcp/perfis/revisao.mjs',
    "  {\n    nome: 'comparar_revisoes',\n    descricao: 'Compara duas revisões oficiais do mesmo pacote.',\n    inputSchema: compararEntrada,\n    outputSchema: compararSaida,\n    executar: comparar,\n  },\n]);\n",
    "  {\n    nome: 'comparar_revisoes',\n    descricao: 'Compara duas revisões oficiais do mesmo pacote.',\n    inputSchema: compararEntrada,\n    outputSchema: compararSaida,\n    executar: comparar,\n  },\n  {\n    nome: 'renderizar_vistas',\n    descricao: 'Produz e transporta as quatro vistas oficiais sem escrever artefatos.',\n    inputSchema: renderizarEntrada,\n    outputSchema: renderizarSaida,\n    executar: renderizar,\n    estruturar: ({ resposta }) => resposta,\n    conteudo: conteudoRenderizacao,\n  },\n]);\n",
)

# tools/mcp/servidor.mjs
replace_once(
    'tools/mcp/servidor.mjs',
    "const IDENTIDADE = Object.freeze({ name: 'mecanifica-mcp', version: '0.1.0' });",
    "const IDENTIDADE = Object.freeze({ name: 'mecanifica-mcp', version: '0.2.0' });",
)
replace_once(
    'tools/mcp/servidor.mjs',
    "  capacidadesAusentes: [\n    'renderizar_vistas',\n    'promover_revisao',",
    "  capacidadesAusentes: [\n    'promover_revisao',",
)
replace_once(
    'tools/mcp/servidor.mjs',
    "    'comparar duas revisões oficiais do mesmo pacote',\n  ],\n  aindaNaoConsegue: [\n    'renderizar ou capturar vistas',\n",
    "    'comparar duas revisões oficiais do mesmo pacote',\n    'produzir e transportar as quatro vistas oficiais sem escrita',\n  ],\n  aindaNaoConsegue: [\n",
)
replace_once(
    'tools/mcp/servidor.mjs',
    "          const resposta = await ferramenta.executar(entrada);\n          return {\n            isError: !resposta.ok,\n            content: [{ type: 'text', text: textoDaResposta(ferramenta.nome, resposta) }],\n            structuredContent: resposta,\n          };\n",
    "          const executado = await ferramenta.executar(entrada);\n          const resposta = ferramenta.estruturar ? ferramenta.estruturar(executado) : executado;\n          const content = ferramenta.conteudo\n            ? ferramenta.conteudo(executado)\n            : [{ type: 'text', text: textoDaResposta(ferramenta.nome, resposta) }];\n          return {\n            isError: !resposta.ok,\n            content,\n            structuredContent: resposta,\n          };\n",
)

# tools/mcp/mcp.test.mjs
replace_once(
    'tools/mcp/mcp.test.mjs',
    "import { existsSync, readFileSync } from 'node:fs';\n",
    "import { existsSync, readFileSync } from 'node:fs';\n",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "import { descreverPecaReutilizavel, PECAS_DISPONIVEIS } from '../mecanifica/descrever-peca.mjs';\n",
    "import { descreverPecaReutilizavel, PECAS_DISPONIVEIS } from '../mecanifica/descrever-peca.mjs';\nimport { olharBancada } from '../mecanifica/olhar-bancada.mjs';\n",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "  comparar, descrever, resumoComparacao, resumoDescricao, resumoTotais, validar,\n} from './perfis/revisao.mjs';\nimport { compararSaida, descreverSaida, validarSaida } from './contratos.mjs';\n",
    "  comparar, conteudoRenderizacao, descrever, LIMITES_VISTAS, renderizar,\n  resumoComparacao, resumoDescricao, resumoTotais, validar,\n} from './perfis/revisao.mjs';\nimport { compararSaida, descreverSaida, renderizarSaida, validarSaida } from './contratos.mjs';\n",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "expect(client.getServerVersion()).toEqual({ name: 'mecanifica-mcp', version: '0.1.0' });",
    "expect(client.getServerVersion()).toEqual({ name: 'mecanifica-mcp', version: '0.2.0' });",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "  it('faz handshake bruto, anuncia exatamente três tools e dois resources', async () => {",
    "  it('faz handshake bruto, anuncia exatamente quatro tools e dois resources', async () => {",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "expect(inicializacao.result.serverInfo).toEqual({ name: 'mecanifica-mcp', version: '0.1.0' });",
    "expect(inicializacao.result.serverInfo).toEqual({ name: 'mecanifica-mcp', version: '0.2.0' });",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "        'descrever_peca', 'validar_pacote', 'comparar_revisoes',\n      ]);\n      expect(ferramentas.result.tools).toHaveLength(3);",
    "        'descrever_peca', 'validar_pacote', 'comparar_revisoes', 'renderizar_vistas',\n      ]);\n      expect(ferramentas.result.tools).toHaveLength(4);",
)
replace_once(
    'tools/mcp/mcp.test.mjs',
    "expect(estadoValor).toMatchObject({ perfil: 'revisao', transporte: 'stdio', contrato: 'mecanifica.mcp.revisao.v1' });\n      expect(estadoValor.ferramentas).toEqual(['descrever_peca', 'validar_pacote', 'comparar_revisoes']);",
    "expect(estadoValor).toMatchObject({ perfil: 'revisao', transporte: 'stdio', contrato: 'mecanifica.mcp.revisao.v2' });\n      expect(estadoValor.ferramentas).toEqual(['descrever_peca', 'validar_pacote', 'comparar_revisoes', 'renderizar_vistas']);",
)
append_before(
    'tools/mcp/mcp.test.mjs',
    "\n  it('registra a linha-base de bytes das três respostas estruturadas', () => {",
    "\n  it('captura quatro PNGs em memória e fecha navegador e Vite sem criar saída', async () => {\n    const fechamentos = { browser: 0, vite: 0 };\n    const png = Buffer.from('89504e470d0a1a0a', 'hex');\n    const page = {\n      on() {},\n      async goto() {},\n      async waitForFunction() {},\n      async waitForTimeout() {},\n      async evaluate(fn) {\n        const fonte = String(fn);\n        if (fonte.includes('const b =')) return {\n          ready: true, erro: null, peca: '_jardineira', partes: ['corpo'],\n          selecaoIgnorada: [], diagnosticos: { facesSemParte: [] },\n          estatisticas: { facesNeutras: 12, triangulos: 12 }, estado: {},\n        };\n        if (fonte.includes('.url()')) return 'http://127.0.0.1:4173/nos-mecanifica/bancada.html';\n        if (fonte.includes('.enquadramento()')) return { valida: true, area: 0.5, largura: 0.7, altura: 0.7, cortado: false };\n        throw new Error(`evaluate inesperado: ${fonte}`);\n      },\n      async screenshot(opcoes) {\n        expect(opcoes).toEqual({ type: 'png' });\n        return png;\n      },\n    };\n    const browser = {\n      async newPage() { return page; },\n      async close() { fechamentos.browser += 1; },\n    };\n    const vite = {\n      httpServer: { address: () => ({ port: 4173 }) },\n      async listen() {},\n      async close() { fechamentos.vite += 1; },\n    };\n    const resultado = await olharBancada({\n      peca: '_jardineira', revisar: true, capturarEmMemoria: true, espera: 1,\n      dependencias: {\n        createServer: async () => vite,\n        carregarPlaywright: async () => ({ chromium: { launch: async () => browser } }),\n      },\n    });\n    expect(resultado.ok).toBe(true);\n    expect(resultado.resultado.arquivos).toEqual([]);\n    expect(resultado.resultado.capturas).toHaveLength(4);\n    expect(resultado.resultado.capturas.map(({ nome }) => nome)).toEqual(['isometrica', 'frontal', 'direita', 'superior']);\n    expect(fechamentos).toEqual({ browser: 1, vite: 1 });\n  });\n\n  it('estrutura manifesto e imagens sem repetir base64 no structuredContent', async () => {\n    const png = Buffer.from('89504e470d0a1a0a', 'hex');\n    let instante = 100;\n    const executado = await renderizar({ peca: '_jardineira' }, {\n      agora: () => (instante += 10),\n      olhar: async ({ capturarEmMemoria, revisar, timeoutMs }) => {\n        expect({ capturarEmMemoria, revisar, timeoutMs }).toEqual({\n          capturarEmMemoria: true, revisar: true, timeoutMs: LIMITES_VISTAS.timeoutMs,\n        });\n        return {\n          ok: true, codigo: 0,\n          resultado: {\n            peca: '_jardineira',\n            capturas: ['isometrica', 'frontal', 'direita', 'superior'].map((nome) => ({\n              nome, mimeType: 'image/png', largura: 1280, altura: 720, dados: png,\n            })),\n            vistas: ['isometrica', 'frontal', 'direita', 'superior'].map((nome) => ({\n              nome, enquadramento: { valida: true, area: 0.5, largura: 0.7, altura: 0.7, cortado: false },\n            })),\n          },\n        };\n      },\n    });\n    renderizarSaida.parse(executado.resposta);\n    expect(executado.resposta.resultado.vistas).toHaveLength(4);\n    expect(JSON.stringify(executado.resposta)).not.toContain(png.toString('base64'));\n    const content = conteudoRenderizacao(executado);\n    expect(content.filter(({ type }) => type === 'image')).toHaveLength(4);\n    for (const imagem of content.slice(1)) {\n      expect(Buffer.from(imagem.data, 'base64').subarray(0, 8)).toEqual(png);\n    }\n  });\n\n  it('recusa payload e timeout sem devolver resultado parcial', async () => {\n    const nomes = ['isometrica', 'frontal', 'direita', 'superior'];\n    const enquadramento = { valida: true, area: 0.5, largura: 0.7, altura: 0.7, cortado: false };\n    const excedido = await renderizar({ peca: '_jardineira' }, {\n      limites: { ...LIMITES_VISTAS, imagemBytes: 4 },\n      olhar: async () => ({\n        ok: true, codigo: 0, resultado: { peca: '_jardineira',\n          capturas: nomes.map((nome) => ({ nome, largura: 1280, altura: 720, dados: Buffer.alloc(5) })),\n          vistas: nomes.map((nome) => ({ nome, enquadramento })),\n        },\n      }),\n    });\n    expect(excedido.resposta).toMatchObject({ ok: false, erro: { codigo: 'payload_excedido' } });\n    expect(excedido.imagens).toEqual([]);\n    const expirado = await renderizar({ peca: '_jardineira' }, {\n      olhar: async () => ({ ok: false, codigo: 1, erro: { codigo: 'tempo_esgotado', mensagem: 'tempo' } }),\n    });\n    expect(expirado.resposta).toMatchObject({ ok: false, erro: { codigo: 'tempo_esgotado' } });\n    expect(expirado.imagens).toEqual([]);\n  });\n\n  const testeVisualReal = process.env.MCP_VISUAL_REAL === '1' ? it : it.skip;\n  testeVisualReal('consumidor zerado conclui os Casos 1 e 2 com quatro vistas e zero escrita', async () => {\n    const antes = spawnSync('git', ['status', '--porcelain'], { cwd: RAIZ, encoding: 'utf8' }).stdout;\n    const client = new Client({ name: 'consumidor-visual-mecanifica', version: '1' });\n    const transport = new StdioClientTransport({\n      command: process.execPath, args: [SERVIDOR], cwd: RAIZ, stderr: 'pipe',\n    });\n    const metricas = { recursos: 0, ferramentas: 0, casos: [] };\n    try {\n      await client.connect(transport);\n      for (const uri of ['mecanifica://estado', 'mecanifica://capacidades/modelagem']) {\n        await client.readResource({ uri });\n        metricas.recursos += 1;\n      }\n      for (const id of ['homologacao-mancal', 'homologacao-placa']) {\n        const validado = await client.callTool({ name: 'validar_pacote', arguments: { id } });\n        metricas.ferramentas += 1;\n        const peca = validado.structuredContent.resultado.peca;\n        await client.callTool({ name: 'descrever_peca', arguments: { peca } });\n        metricas.ferramentas += 1;\n        const inicio = Date.now();\n        const vistas = await client.callTool({ name: 'renderizar_vistas', arguments: { peca } });\n        metricas.ferramentas += 1;\n        renderizarSaida.parse(vistas.structuredContent);\n        const imagens = vistas.content.filter(({ type }) => type === 'image');\n        expect(imagens).toHaveLength(4);\n        for (const imagem of imagens) {\n          expect(Buffer.from(imagem.data, 'base64').subarray(0, 8)).toEqual(Buffer.from('89504e470d0a1a0a', 'hex'));\n        }\n        metricas.casos.push({\n          id, peca, duracaoMs: Date.now() - inicio,\n          bytes: vistas.structuredContent.resultado.bytes,\n          vistas: vistas.structuredContent.resultado.vistas.map(({ nome, bytes }) => ({ nome, bytes })),\n          respostaBytes: Buffer.byteLength(JSON.stringify(vistas), 'utf8'),\n        });\n      }\n    } finally {\n      await client.close();\n    }\n    const depois = spawnSync('git', ['status', '--porcelain'], { cwd: RAIZ, encoding: 'utf8' }).stdout;\n    expect(depois).toBe(antes);\n    expect(metricas).toMatchObject({ recursos: 2, ferramentas: 6 });\n    console.log(`MCP_VISUAL_METRICAS ${JSON.stringify(metricas)}`);\n  }, 180_000);\n",
)

# .github/workflows/ci.yml
replace_once(
    '.github/workflows/ci.yml',
    "      - name: Navegador para a prova de interface\n        run: npx playwright install --with-deps chromium\n\n      # O painel de portas",
    "      - name: Navegador para a prova de interface\n        run: npx playwright install --with-deps chromium\n\n      - name: MCP transporta as quatro vistas oficiais\n        env:\n          MCP_VISUAL_REAL: '1'\n        run: npm run mcp:check\n\n      # O painel de portas",
)

# Plano: registra a base e o gate de CI necessário.
replace_once(
    'docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md',
    "**Repositório e base:** `warbookbr/nos-mecanifica`; registrar o `HEAD` ao iniciar a implementação",
    "**Repositório e base:** `warbookbr/nos-mecanifica`, `5e1d402acb7951fd78091122d3d38d4cb22061db`",
)
replace_once(
    'docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md',
    "`tools/mcp/servidor.mjs`, `tools/mcp/mcp.test.mjs` e este plano.",
    "`tools/mcp/servidor.mjs`, `tools/mcp/mcp.test.mjs`, `.github/workflows/ci.yml` e este plano.",
)

print('Fatia 1B aplicada com sucesso.')
