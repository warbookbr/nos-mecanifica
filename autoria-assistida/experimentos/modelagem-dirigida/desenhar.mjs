/* desenhar.mjs — as duas vistas que decidem proporção: lateral e planta.

   Não há isométrica aqui, e a ausência é deliberada. A isométrica sombreia o
   flanco e a leitura preenche volume que não existe: foi assim que uma tábua
   plana com dois entalhes quadrados passou por carro numa auditoria desta
   investigação. Superfície vem depois, em D2, com outra ferramenta. */

import { linhaDeCima, linhaDeBaixo, meiaLargura, rodas, pontas, comprimentoOcupado } from './carro.mjs';

const MARGEM = 44;

/* Catmull-Rom para bézier. As grandezas dão os pontos de comando; a curva entre
   eles é interpolada, não digitada. */
function suave(pts, fechar = false) {
  if (pts.length < 2) return '';
  const p = pts;
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return fechar ? d + ' Z' : d;
}

function moldura(largura, altura, titulo, corpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
<rect width="100%" height="100%" fill="#fbfbfa"/>
<text x="${MARGEM}" y="26" font-family="ui-sans-serif,system-ui" font-size="15" fill="#4a5260">${titulo}</text>
${corpo}
</svg>`;
}

/* Vista lateral. Frente à esquerda, como na referência — vistas em sentidos
   opostos fazem o olho comparar errado. */
export function lateral(c, { largura = 1100, mostrarNomes = false } = {}) {
  const p = pontas(c);
  const compr = comprimentoOcupado(c);
  const esc = (largura - MARGEM * 2) / compr;
  const alturaMax = Math.max(...linhaDeCima(c).map((q) => q.y), c.roda.raio * 2);
  const altura = Math.round(alturaMax * esc) + MARGEM * 2 + 20;
  const X = (z) => MARGEM + (p.frente - z) * esc;
  const Y = (y) => altura - MARGEM - y * esc;

  const cima = linhaDeCima(c);
  const baixo = linhaDeBaixo(c);
  const contorno = [...cima.map((q) => [X(q.z), Y(q.y)]), ...baixo.slice().reverse().map((q) => [X(q.z), Y(q.y)])];

  const roda = rodas(c).map((r) => `<circle cx="${X(r.z).toFixed(1)}" cy="${Y(r.y).toFixed(1)}" r="${(r.raio * esc).toFixed(1)}" fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="7 5"/>`).join('');

  const nomes = mostrarNomes
    ? [...cima, ...baixo].map((q) => `<circle cx="${X(q.z).toFixed(1)}" cy="${Y(q.y).toFixed(1)}" r="3" fill="#c0392b"/><text x="${(X(q.z) + 6).toFixed(1)}" y="${(Y(q.y) - 6).toFixed(1)}" font-family="ui-sans-serif,system-ui" font-size="10" fill="#8a5a52">${q.nome}</text>`).join('')
    : '';

  const corpo = `<line x1="${MARGEM - 10}" y1="${Y(0)}" x2="${largura - MARGEM + 10}" y2="${Y(0)}" stroke="#d8d8d4"/>
${roda}
<path d="${suave(contorno, true)}" fill="#5b6b8a" fill-opacity="0.85" stroke="#33405a" stroke-width="2"/>
${nomes}`;
  return moldura(largura, altura, 'lateral — frente à esquerda · rodas em vermelho são apoio de leitura, não carroceria', corpo);
}

/* Planta. Meia largura espelhada no eixo de simetria. */
export function planta(c, { largura = 1100 } = {}) {
  const p = pontas(c);
  const esc = (largura - MARGEM * 2) / comprimentoOcupado(c);
  const meia = meiaLargura(c);
  const xMax = Math.max(...meia.map((q) => q.x));
  const altura = Math.round(xMax * 2 * esc) + MARGEM * 2 + 20;
  const X = (z) => MARGEM + (p.frente - z) * esc;
  const Y = (x) => altura / 2 + 10 - x * esc;

  const cima = meia.map((q) => [X(q.z), Y(q.x)]);
  const baixo = meia.slice().reverse().map((q) => [X(q.z), Y(-q.x)]);
  const eixo = `<line x1="${MARGEM - 10}" y1="${Y(0)}" x2="${largura - MARGEM + 10}" y2="${Y(0)}" stroke="#d8d8d4" stroke-dasharray="8 6"/>`;
  const corpo = `${eixo}<path d="${suave([...cima, ...baixo], true)}" fill="#5b6b8a" fill-opacity="0.85" stroke="#33405a" stroke-width="2"/>`;
  return moldura(largura, altura, 'planta — frente à esquerda · a cintura no meio é o que faltava em tudo que tentamos antes', corpo);
}
