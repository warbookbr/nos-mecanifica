#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name('apply-docs.py')
text = path.read_text(encoding='utf-8')
old = '''    replace_once(
        index,
        "docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md ",
        "docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md docs/mecanifica/planos/mcp/INDEX.md docs/mecanifica/planos/mcp/concluidos/01-fatia-1a-piloto-leitura.md ",
    )
'''
new = '''    replace_once(
        index,
        "docs/mecanifica/planos/MODELO.md docs/mecanifica/planos/concluidos/",
        "docs/mecanifica/planos/MODELO.md docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md docs/mecanifica/planos/mcp/INDEX.md docs/mecanifica/planos/mcp/concluidos/01-fatia-1a-piloto-leitura.md docs/mecanifica/planos/concluidos/",
    )
'''
if text.count(old) != 1:
    raise SystemExit('bloco esperado do aplicador não foi encontrado exatamente uma vez')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
