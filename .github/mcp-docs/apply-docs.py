#!/usr/bin/env python3
"""Aplica a reorganização documental do programa MCP sem publicar nada."""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: trecho esperado ocorreu {count} vez(es), esperado 1")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def run(repo: Path, *cmd: str) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=repo, check=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("repo", type=Path, help="checkout de warbookbr/nos-mecanifica")
    parser.add_argument("--no-gates", action="store_true", help="aplica sem executar os gates")
    args = parser.parse_args()

    repo = args.repo.resolve()
    here = Path(__file__).resolve().parent
    source = here / "files"
    required = [
        repo / "README.md",
        repo / "package.json",
        repo / "docs/mecanifica/INDEX.md",
        repo / "docs/mecanifica/ATRITOS-AUTORIA.md",
        repo / "docs/mecanifica/planos/README.md",
        repo / "docs/mecanifica/planos/BACKLOG.md",
        repo / "docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md",
    ]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        raise RuntimeError("checkout incompatível; ausentes:\n  " + "\n  ".join(missing))

    for rel in [
        Path("docs/mecanifica/planos/mcp/INDEX.md"),
        Path("docs/mecanifica/planos/mcp/concluidos/01-fatia-1a-piloto-leitura.md"),
        Path("docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md"),
        Path("docs/mecanifica/planos/README.md"),
    ]:
        target = repo / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / rel, target)

    old_plan = repo / "docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md"
    replace_once(old_plan, "**Estado:** ativo", "**Estado:** concluído")
    replace_once(
        old_plan,
        """## Encerramento\n\nO plano está ativo somente para esta Fatia 1A, com escopo e arquivos\nreservados acima. O próximo degrau só começa após evidências do piloto local,\nredução mensurável e decisão registrada; ao concluir ou cancelar, registrar\nresultado, gates, medições e candidatos devolvidos ao backlog.\n""",
        """## Encerramento\n\nA Fatia 1A foi aprovada e encerrada em 2026-08-05. O registro canônico das\nmedições e limites está em\n`docs/mecanifica/planos/mcp/concluidos/01-fatia-1a-piloto-leitura.md`. A única\ncontinuação autorizada é o plano ativo\n`docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md`; autoria, materiais,\nGit e servidor remoto permanecem candidatos sem autorização de implementação.\n""",
    )

    readme = repo / "README.md"
    replace_once(
        readme,
        """Casos 1 e 2 estão homologados. O Caso 3 ainda não começou. Não há plano ativo.\nO núcleo, as receitas, o visor compatível, a bancada e as ferramentas continuam\nativos. O contrato genérico de materiais ainda não existe. O servidor estático\nlocal ainda falha ao resolver o import bare `earcut`.\n""",
        """Casos 1 e 2 estão homologados e a Fatia 1A do MCP foi aprovada e\nencerrada. A Fatia 1B visual é o único plano ativo; o Caso 3 ainda não começou.\nO núcleo, as receitas, o visor compatível, a bancada e as ferramentas continuam\nativos. O contrato genérico de materiais ainda não existe. O servidor estático\nlocal ainda falha ao resolver o import bare `earcut`.\n""",
    )

    index = repo / "docs/mecanifica/INDEX.md"
    replace_once(
        index,
        """- Casos 1 e 2 da homologação estão concluídos; Caso 3 não foi iniciado.\n- Não há plano ativo.\n- A ponte `adaptarThree` e a bancada publicada existem e são usadas pelos gates.\n""",
        """- Casos 1 e 2 da homologação estão concluídos; Caso 3 não foi iniciado.\n- A Fatia 1A do MCP foi aprovada e encerrada.\n- O único plano ativo é a Fatia 1B visual somente leitura.\n- A ponte `adaptarThree` e a bancada publicada existem e são usadas pelos gates.\n""",
    )
    replace_once(
        index,
        """5. `docs/mecanifica/planos/README.md` e `BACKLOG.md` para planejamento.\n""",
        """5. `docs/mecanifica/planos/README.md`,\n   `docs/mecanifica/planos/mcp/INDEX.md` e o plano ativo para planejamento.\n""",
    )
    replace_once(
        index,
        """- Produto e escopo: `VISAO.md`, este índice e `planos/README.md`.\n""",
        """- Produto e escopo: `VISAO.md`, este índice e `planos/README.md`.\n- Programa MCP: `docs/mecanifica/planos/mcp/INDEX.md`, o encerramento da Fatia\n  1A e `docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md`.\n""",
    )
    replace_once(
        index,
        """- Reduzir o custo de onboarding e contexto para autoria assistida.\n""",
        """- Executar a Fatia 1B visual do programa MCP e medir contexto, payload e fallback.\n""",
    )
    replace_once(
        index,
        """Planejamento: [planos/README](planos/README.md), [BACKLOG](planos/BACKLOG.md),\n[MODELO](planos/MODELO.md) e [concluídos](planos/concluidos/ENCERRAMENTO-PLANO-MESTRE-2026-08-02.md).\n""",
        """Planejamento: [planos/README](planos/README.md), [programa MCP](planos/mcp/INDEX.md),\n[Fatia 1B visual](planos/2026-08-05-mcp-fatia-1b-visual.md),\n[encerramento da Fatia 1A](planos/mcp/concluidos/01-fatia-1a-piloto-leitura.md),\n[BACKLOG](planos/BACKLOG.md), [MODELO](planos/MODELO.md) e\n[concluídos](planos/concluidos/ENCERRAMENTO-PLANO-MESTRE-2026-08-02.md).\n""",
    )
    replace_once(
        index,
        "docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md ",
        "docs/mecanifica/planos/2026-08-04-mcp-para-agentes.md docs/mecanifica/planos/2026-08-05-mcp-fatia-1b-visual.md docs/mecanifica/planos/mcp/INDEX.md docs/mecanifica/planos/mcp/concluidos/01-fatia-1a-piloto-leitura.md ",
    )

    backlog = repo / "docs/mecanifica/planos/BACKLOG.md"
    replace_once(
        backlog,
        "| Onboarding e custo de contexto | medir antes de propor contrato novo |",
        "| Onboarding e custo de contexto | programa MCP ativo; Fatia 1B mede o recorte visual sem autoria ou materiais |",
    )

    atritos = repo / "docs/mecanifica/ATRITOS-AUTORIA.md"
    replace_once(
        atritos,
        "para grupo linear, abertura oblonga, materiais genéricos, Caso 3 e onboarding.",
        "para grupo linear, abertura oblonga, materiais genéricos e Caso 3. O onboarding está em medição pelo programa MCP.",
    )

    if not args.no_gates:
        run(repo, "npm", "run", "mapa")
        run(repo, "npm", "run", "docs:toc")
        run(repo, "npm", "run", "mapa:check")
        run(repo, "npm", "run", "docs:toc:check")
        run(repo, "npm", "run", "docs:links:check")
        run(repo, "npm", "run", "planos:check")
        run(repo, "git", "diff", "--check")
        run(repo, "git", "status", "--short")

    print("Mudanças aplicadas sem commit, push ou PR.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        raise SystemExit(1)
