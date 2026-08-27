#!/usr/bin/env node
/* inspecionar.mjs — roda o roteiro e grava uma imagem POR ESTAÇÃO.

   Cada imagem mostra só aquele pedaço, ampliado, com o contorno do alvo por
   baixo e a roda quando ela entra na janela. Nunca o carro inteiro: o carro
   inteiro é outra pergunta, e é a pergunta que esconde defeito local.

   Uso:
     node inspecionar.mjs --saida=/pasta
     node inspecionar.mjs --saida=/pasta --so=arco-traseiro

   Ele não aprova nada. A imagem é para ser olhada, uma de cada vez. */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { CARRO, linhaDeCima, linhaDeBaixo } from './carro.mjs';
import { contornoDoAlvo } from './sobrepor.mjs';
import { estacoes, recortar, rodaNaJanela } from './roteiro.mjs';

const LARGURA = 900;

function caminhoSuave(p) {
  if (p.length < 2) return '';
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d;
}

export function desenharEstacao(c, estacao, alvo) {
  const cima = recortar(linhaDeCima(c), estacao.de, estacao.ate);
  const baixo = recortar(linhaDeBaixo(c), estacao.de, estacao.ate);
  const alvoCima = recortar(alvo.topo, estacao.de, estacao.ate);
  const roda = rodaNaJanela(c, estacao.de, estacao.ate);

  const meus = [...cima, ...baixo];
  if (meus.length === 0) return null;
  const ys = [...meus, ...alvoCima].map((q) => q.y);
  if (roda) ys.push(0, roda.raio * 2);
  const margem = 90;
  const yMin = Math.min(...ys) - margem, yMax = Math.max(...ys) + margem;
  const esc = (LARGURA - 60) / (estacao.de - estacao.ate);
  const altura = Math.round((yMax - yMin) * esc) + 90;
  const X = (z) => 30 + (estacao.de - z) * esc;
  const Y = (y) => altura - 30 - (y - yMin) * esc;
  const traco = (pts) => caminhoSuave(pts.map((q) => [X(q.z), Y(q.y)]));

  const alvoTraco = alvoCima.length > 1
    ? `<path d="${traco(alvoCima)}" fill="none" stroke="#9aa0a6" stroke-width="6" stroke-linecap="round"/>` : '';
  const rodaTraco = roda
    ? `<circle cx="${X(roda.z).toFixed(1)}" cy="${Y(roda.y).toFixed(1)}" r="${(roda.raio * esc).toFixed(1)}" fill="none" stroke="#c0392b" stroke-width="2.5" stroke-dasharray="9 7"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${altura}" viewBox="0 0 ${LARGURA} ${altura}">
<rect width="100%" height="100%" fill="#fbfbfa"/>
<text x="30" y="26" font-family="ui-sans-serif,system-ui" font-size="16" font-weight="600" fill="#333">${estacao.nome}</text>
<text x="30" y="48" font-family="ui-sans-serif,system-ui" font-size="13" fill="#6b7280">${estacao.pergunta}</text>
${yMin <= 0 ? `<line x1="20" y1="${Y(0)}" x2="${LARGURA - 20}" y2="${Y(0)}" stroke="#e2e2de"/>` : ''}
${alvoTraco}${rodaTraco}
<path d="${traco(cima)}" fill="none" stroke="#2f5bd0" stroke-width="3"/>
<path d="${traco(baixo)}" fill="none" stroke="#2f5bd0" stroke-width="3"/>
</svg>`;
}

const args = process.argv.slice(2);
const saida = (args.find((a) => a.startsWith('--saida=')) ?? '').slice(8) || 'inspecao';
const so = (args.find((a) => a.startsWith('--so=')) ?? '').slice(5);

mkdirSync(saida, { recursive: true });
const alvo = contornoDoAlvo();
const lista = estacoes(CARRO).filter((x) => !so || x.nome === so);
if (lista.length === 0) {
  console.error(`estação '${so}' não existe. Há: ${estacoes(CARRO).map((x) => x.nome).join(', ')}`);
  process.exit(1);
}

const navegador = await chromium.launch();
for (const estacao of lista) {
  const svg = desenharEstacao(CARRO, estacao, alvo);
  if (!svg) { console.log(`${estacao.nome}: janela vazia`); continue; }
  const arquivo = path.join(saida, `${estacao.nome}.png`);
  writeFileSync(path.join(saida, `${estacao.nome}.svg`), svg);
  const pagina = await navegador.newPage({ viewport: { width: LARGURA + 20, height: 700 }, deviceScaleFactor: 2 });
  await pagina.setContent(`<body style="margin:0">${svg}</body>`, { waitUntil: 'load' });
  await pagina.locator('svg').screenshot({ path: arquivo });
  await pagina.close();
  console.log(`${estacao.nome.padEnd(20)} ${arquivo}`);
}
await navegador.close();
console.log('\ncinza = alvo · azul = o meu · vermelho tracejado = a roda, quando entra na janela');
