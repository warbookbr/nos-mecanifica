#!/usr/bin/env node
/* sobrepor.mjs — o contorno do carro em cima do contorno do alvo.

   Isto é a regra zero da skill `modelar-dirigido` virada em ferramenta. Ela
   existe porque a primeira rodada desta fatia foi inventada de cabeça, com o
   alvo fechado na gaveta, sob a desculpa de que copiar os números tornaria a
   prova fácil. Não copiar número é razoável; não olhar não é.

   O alvo é o fastback medido em `docs/mecanifica/referencias/`. A imagem de
   origem não está no repositório — só as coordenadas derivadas dela. Elas não
   são levantamento perfeito: o próprio arquivo declara o resíduo de escala e
   avisa que curvatura tirada daquele raster é ruído. Serve para proporção e
   posição, que é exatamente o que se julga aqui.

   Uso: node sobrepor.mjs --saida=/caminho/sobreposicao.png */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { CARRO, linhaDeCima, linhaDeBaixo } from './carro.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ALVO = path.join(RAIZ, 'docs/mecanifica/referencias/fastback-1965-silhueta.json');

export function contornoDoAlvo() {
  const r = JSON.parse(readFileSync(ALVO, 'utf8'));
  return {
    entreEixos: r.calibracao.entreEixosDeclarado,
    pontos: [...r.silhuetaLateral.topo, ...[...r.silhuetaLateral.base].reverse()].map(([z, y]) => ({ z, y })),
    topo: r.silhuetaLateral.topo.map(([z, y]) => ({ z, y })),
  };
}

export function contornoDoCarro(c = CARRO) {
  return [...linhaDeCima(c), ...linhaDeBaixo(c).slice().reverse()];
}

/* Altura do alvo na estação z, para relatar diferença por ponto NOMEADO em vez
   de por um número agregado que esconde onde está o erro. */
export function alturaDoAlvoEm(topo, z) {
  let melhor = topo[0];
  for (const q of topo) if (Math.abs(q.z - z) < Math.abs(melhor.z - z)) melhor = q;
  return melhor.y;
}

function suave(p) {
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export function desenharSobreposicao(c = CARRO, { largura = 1300 } = {}) {
  const alvo = contornoDoAlvo();
  const meu = contornoDoCarro(c);
  const todos = [...alvo.pontos, ...meu];
  const mnz = Math.min(...todos.map((q) => q.z)), mxz = Math.max(...todos.map((q) => q.z));
  const mxy = Math.max(...todos.map((q) => q.y));
  const esc = (largura - 80) / (mxz - mnz);
  const altura = Math.round(mxy * esc) + 90;
  const X = (z) => largura - 40 - (z - mnz) * esc;
  const Y = (y) => altura - 40 - y * esc;
  const poli = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + X(q.z).toFixed(1) + ' ' + Y(q.y).toFixed(1)).join(' ') + ' Z';
  const roda = (z) => `<circle cx="${X(z).toFixed(1)}" cy="${Y(c.roda.raio).toFixed(1)}" r="${(c.roda.raio * esc).toFixed(1)}" fill="none" stroke="#c9c9c6" stroke-width="1.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
<rect width="100%" height="100%" fill="#fbfbfa"/>
<text x="40" y="24" font-family="ui-sans-serif,system-ui" font-size="14" fill="#4a5260">CINZA = fastback medido &#183; AZUL = o meu &#183; alinhados pelo meio do entre-eixos</text>
<line x1="30" y1="${Y(0)}" x2="${largura - 30}" y2="${Y(0)}" stroke="#e0e0dc"/>
${roda(alvo.entreEixos / 2)}${roda(-alvo.entreEixos / 2)}
<path d="${poli(alvo.pontos)}" fill="#9aa0a6" fill-opacity="0.55" stroke="#6b7075" stroke-width="1.5"/>
<path d="${suave(meu.map((q) => [X(q.z), Y(q.y)]))}" fill="none" stroke="#2f5bd0" stroke-width="2.6"/>
</svg>`;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const saida = (process.argv.slice(2).find((a) => a.startsWith('--saida=')) ?? '').slice(8) || 'sobreposicao.png';
  const alvo = contornoDoAlvo();
  console.log('estação            alvo    meu   diferença');
  for (const q of linhaDeCima(CARRO)) {
    const a = alturaDoAlvoEm(alvo.topo, q.z);
    console.log(q.nome.padEnd(22), String(Math.round(a)).padStart(5), String(Math.round(q.y)).padStart(6), String(Math.round(q.y - a)).padStart(8));
  }
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1340, height: 700 }, deviceScaleFactor: 2 });
  await pagina.setContent(`<body style="margin:0">${desenharSobreposicao()}</body>`, { waitUntil: 'load' });
  await pagina.locator('svg').screenshot({ path: saida });
  await navegador.close();
  console.log(`sobreposição em ${saida}`);
}
