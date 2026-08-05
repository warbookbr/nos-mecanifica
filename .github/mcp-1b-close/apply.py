from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(rel, old, new):
    path = ROOT / rel
    text = path.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{rel}: trecho esperado ocorreu {count} vez(es), esperado 1')
    path.write_text(text.replace(old, new), encoding='utf-8')


# Prova traversal específica da ferramenta visual.
replace_once(
    'tools/mcp/mcp.test.mjs',
    "      expect(await descrever({ peca: '../segredo' })).toMatchObject({\n        ok: false, erro: { codigo: 'entrada_recusada' },\n      });\n      const traversal = await cliente.enviar('tools/call', { name: 'validar_pacote', arguments: { id: '../segredo' } });",
    "      expect(await descrever({ peca: '../segredo' })).toMatchObject({\n        ok: false, erro: { codigo: 'entrada_recusada' },\n      });\n      const visual = await cliente.enviar('tools/call', {\n        name: 'renderizar_vistas', arguments: { peca: '../segredo' },\n      });\n      expect(visual.result).toMatchObject({ isError: true });\n      expect(visual.result.structuredContent).toBeUndefined();\n      expect(visual.result.content[0].text).toMatch(/Input validation error/);\n      expect((await renderizar({ peca: '../segredo' })).resposta).toMatchObject({\n        ok: false, erro: { codigo: 'entrada_recusada' },\n      });\n      const traversal = await cliente.enviar('tools/call', { name: 'validar_pacote', arguments: { id: '../segredo' } });",
)

# Prova cleanup explícita no timeout forçado.
replace_once(
    'tools/mcp/mcp.test.mjs',
    "    expect(fechamentos).toEqual({ browser: 1, vite: 1 });\n  });\n\n  it('estrutura manifesto e imagens sem repetir base64 no structuredContent', async () => {",
    "    expect(fechamentos).toEqual({ browser: 1, vite: 1 });\n  });\n\n  it('fecha Browser e Vite quando o timeout é forçado', async () => {\n    const fechamentos = { browser: 0, vite: 0 };\n    let rejeitarEspera;\n    const espera = new Promise((_, reject) => { rejeitarEspera = reject; });\n    const page = {\n      on() {},\n      async goto() {},\n      async waitForFunction() {},\n      waitForTimeout() { return espera; },\n      async evaluate(fn) {\n        const fonte = String(fn);\n        if (fonte.includes('const b =')) return {\n          ready: true, erro: null, peca: '_jardineira', partes: ['corpo'],\n          selecaoIgnorada: [], diagnosticos: { facesSemParte: [] },\n          estatisticas: { facesNeutras: 12, triangulos: 12 }, estado: {},\n        };\n        throw new Error(`evaluate inesperado antes do timeout: ${fonte}`);\n      },\n    };\n    const browser = {\n      async newPage() { return page; },\n      async close() {\n        fechamentos.browser += 1;\n        rejeitarEspera?.(new Error('browser fechado'));\n      },\n    };\n    const vite = {\n      httpServer: { address: () => ({ port: 4173 }) },\n      async listen() {},\n      async close() { fechamentos.vite += 1; },\n    };\n    const resultado = await olharBancada({\n      peca: '_jardineira', revisar: true, capturarEmMemoria: true,\n      timeoutMs: 10, espera: 60_000,\n      dependencias: {\n        createServer: async () => vite,\n        carregarPlaywright: async () => ({ chromium: { launch: async () => browser } }),\n      },\n    });\n    expect(resultado).toMatchObject({ ok: false, erro: { codigo: 'tempo_esgotado' } });\n    expect(fechamentos.browser).toBeGreaterThanOrEqual(1);\n    expect(fechamentos.vite).toBeGreaterThanOrEqual(1);\n  });\n\n  it('estrutura manifesto e imagens sem repetir base64 no structuredContent', async () => {",
)

# Encerra o plano executivo com as métricas reais.
replace_once(
    'docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md',
    '**Estado:** ativo',
    '**Estado:** concluído',
)
replace_once(
    'docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md',
    "## Encerramento\n\nAo concluir ou cancelar, registrar métricas reais, resultados dos Casos 1 e 2,\nlimites observados, gates, decisão do programa e candidatos devolvidos ao\npainel. Nenhuma etapa posterior abre automaticamente.\n",
    "## Encerramento\n\n**Resultado:** concluído e aprovado no PR `#16`; implementação base\n`a72efcc749ab36a46aec228cbd15bafc8ae3a145`.\n\nO consumidor zerado leu 2 recursos, fez 6 chamadas de ferramentas, concluiu os\nCasos 1 e 2, não usou fallback, não produziu escrita e não teve falha inesperada.\n\n| Caso | Duração ponta a ponta | PNGs decodificados | Resposta MCP |\n|---|---:|---:|---:|\n| mancal (`_mancal-de-mesa`) | 18.093 ms | 569.117 B | 760.489 B |\n| placa (`_placa-adaptadora`) | 15.547 ms | 414.046 B | 553.725 B |\n\nO maior PNG teve 188.507 B. Todos os valores ficaram abaixo de 2 MiB por imagem,\n8 MiB decodificados, 11 MiB serializados e 45 s. As quatro vistas oficiais\nvieram na ordem contratada, com hashes, dimensões e enquadramento. Testes\ninjetados provaram payload, timeout, traversal e limpeza; CI, MCP, testes,\ntypecheck, build, mapa, TOC, links, planos e `git diff --check` passaram.\n\nA hipótese foi confirmada: a leitura visual entrou no MCP sem duplicar navegação,\npersistir artefatos ou abrir autoria, materiais, Git ou HTTP. Nenhuma etapa\nposterior foi ativada; a decisão seguinte permanece separada no painel.\n",
)

# Índice de planos: nenhum ativo e 1B concluída.
replace_once(
    'docs/mecanifica/planos/README.md',
    '**Plano ativo:** [MCP — Fatia 1B visual somente leitura](2026-08-05-mcp-fatia-1b-visual.md)',
    '**Plano ativo:** nenhum.',
)
replace_once(
    'docs/mecanifica/planos/README.md',
    '| MCP para agentes | [`mcp/INDEX.md`](mcp/INDEX.md) | Fatia 1B visual |',
    '| MCP para agentes | [`mcp/INDEX.md`](mcp/INDEX.md) | nenhuma; Fatia 1B concluída |',
)
replace_once(
    'docs/mecanifica/planos/README.md',
    '| MCP — Fatia 1A somente leitura | concluído |',
    '| MCP — Fatia 1A somente leitura | concluído |\n| MCP — Fatia 1B visual somente leitura | concluído |',
)
replace_once(
    'docs/mecanifica/planos/README.md',
    '[MCP Fatia 1A](mcp/concluidos/01-fatia-1a-piloto-leitura.md).',
    '[MCP Fatia 1A](mcp/concluidos/01-fatia-1a-piloto-leitura.md) e\n[MCP Fatia 1B](2026-08-05-mcp-fatia-1b-visual.md).',
)
replace_once(
    'docs/mecanifica/planos/README.md',
    "Referência curada do plano ativo:\n`docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md`.\n",
    "Não há plano executivo ativo. A próxima abertura exige decisão explícita e\num novo plano datado; o painel do programa não autoriza continuação automática.\n",
)

# Painel do programa: 1B concluída e próxima decisão separada.
replace_once(
    'docs/mecanifica/planos/mcp/INDEX.md',
    '| Fatia 1B — quatro vistas oficiais | ativo | Fatia 1A | plano em `docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md` |',
    '| Fatia 1B — quatro vistas oficiais | concluído | Fatia 1A | quatro PNGs oficiais por caso, 2 recursos, 6 tools, zero fallback e encerramento no plano datado |',
)
replace_once(
    'docs/mecanifica/planos/mcp/INDEX.md',
    "## Próxima decisão\n\nA Fatia 1B deve provar que uma única ferramenta MCP somente leitura consegue\nproduzir e transportar as quatro vistas oficiais sem duplicar a lógica da\nbancada, escrever artefatos ou deixar Playwright/Vite vivos. Qualquer ampliação\nfica bloqueada até a medição desse resultado.\n",
    "## Próxima decisão\n\nA Fatia 1B foi aprovada: uma única ferramenta transportou as quatro vistas\noficiais, sem escrita, fallback ou resíduo de Playwright/Vite. O programa agora\nnão tem plano ativo. A próxima decisão é abrir ou não uma avaliação consolidada\ndo piloto visual; autoria, materiais e distribuição continuam bloqueados até\nessa decisão separada.\n",
)

# Entradas de estado atual.
replace_once(
    'docs/mecanifica/INDEX.md',
    "- A Fatia 1A do MCP foi aprovada e encerrada.\n- O único plano ativo é a Fatia 1B visual somente leitura.",
    "- As Fatias 1A e 1B do MCP foram aprovadas e encerradas.\n- Não há plano executivo ativo.",
)
replace_once(
    'docs/mecanifica/INDEX.md',
    "5. `docs/mecanifica/planos/README.md`,\n   `docs/mecanifica/planos/mcp/INDEX.md` e o plano ativo para planejamento.",
    "5. `docs/mecanifica/planos/README.md`,\n   `docs/mecanifica/planos/mcp/INDEX.md` e qualquer futuro plano ativo para planejamento.",
)
replace_once(
    'README.md',
    "Casos 1 e 2 estão homologados e a Fatia 1A do MCP foi aprovada e\nencerrada. A Fatia 1B visual é o único plano ativo; o Caso 3 ainda não começou.",
    "Casos 1 e 2 estão homologados e as Fatias 1A e 1B do MCP foram aprovadas e\nencerradas. Não há plano ativo; o Caso 3 ainda não começou.",
)

print('Fechamento da Fatia 1B aplicado.')
