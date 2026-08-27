#!/usr/bin/env node
/* independencia-catalogo.mjs — firewall pequeno entre o núcleo, a autoria
 * pura e as portas que resolvem arquivos. Importar uma peça pelo caminho é
 * permitido no adaptador que recebeu essa responsabilidade; não é permitido
 * no núcleo nem no serviço puro de execução.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function arquivosJs(pasta) {
  const saida = [];
  for (const nome of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, nome.name);
    if (nome.isDirectory()) saida.push(...arquivosJs(caminho));
    else if (nome.isFile() && caminho.endsWith('.js')) saida.push(caminho);
  }
  return saida;
}

function ocorrencias(arquivos, padrao, regra) {
  const problemas = [];
  for (const arquivo of arquivos) {
    const texto = readFileSync(arquivo, 'utf8');
    for (const [indice, linha] of texto.split('\n').entries()) {
      if (padrao.test(linha)) problemas.push(`${regra}: ${relative(REPO, arquivo)}:${indice + 1}: ${linha.trim()}`);
      padrao.lastIndex = 0;
    }
  }
  return problemas;
}

export function verificarIndependencia() {
  const motor = arquivosJs(join(REPO, 'prototipos/procedural/v3/motor'));
  const autoriaPura = [join(REPO, 'src/autoria/executar-receita.js')];
  return [
    ...ocorrencias(motor, /(?:from\s+['"]|import\s*\()([^'"]*)(?:three|pecas\/)/i, 'motor importa catálogo/renderizador'),
    ...ocorrencias(autoriaPura, /node:(?:fs|path|url)|prototipos\/procedural\/v3\/pecas|src\/bancada|tools\//i, 'serviço puro conhece porta ou disco'),
    /* A maker.js entrou em 2026-08-26 como construtor de contorno 2D no
       experimento de modelagem dirigida. Ela é ferramenta de desenho, não
       núcleo: se um dia aparecer importada aqui, o núcleo terá adquirido uma
       dependência de biblioteca externa sem ninguém decidir isso. */
    /* As duas dependências que entraram pelo critério de ARQUITETURA.md ficam
       FORA do núcleo: a makerjs desenha contorno 2D, a manifold-3d confere
       malha pronta. Nenhuma das duas pode produzir peça aqui dentro — a
       autoridade de nomear face não se delega. */
    ...ocorrencias([...motor, ...autoriaPura], /(?:from\s+['"]|import\s*\()['"]?(?:makerjs|manifold-3d)/i, 'núcleo importa biblioteca externa de geometria'),
  ];
}

const chamadoDireto = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (chamadoDireto) {
  const problemas = verificarIndependencia();
  if (problemas.length) {
    console.error(`arquitetura:check FALHOU — ${problemas.length} dependência(s):`);
    for (const problema of problemas) console.error(`  - ${problema}`);
    process.exit(1);
  }
  console.log('arquitetura:check ok — núcleo e serviço puro não dependem do catálogo nem de biblioteca externa de geometria');
}
