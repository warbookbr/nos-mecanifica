#!/usr/bin/env node
/* conferente-topologico.mjs — segunda opinião independente sobre uma malha que
   o núcleo produziu.

   POR QUE ELE EXISTE, E POR QUE ELE NÃO CONSTRÓI NADA

   O núcleo escreve as próprias operações à mão e tem uma dependência só, a
   `earcut`. Isso não é falta de biblioteca: é decisão registrada. A operação
   `furo` explica, no próprio código, por que ela não é uma booleana genérica —
   "uma booleana genérica destrói a identidade de dezenas de faces de uma vez,
   em silêncio". Toda face criada nasce endereçável; toda face destruída fica
   registrada para a citação seguinte gritar.

   Toda biblioteca de geometria que produz forma devolve sopa de triângulos
   anônima. Ela faria a conta certa e jogaria fora exatamente o que o núcleo
   existe para preservar. Por isso o critério desta arquitetura:

     cabe a biblioteca que recebe geometria e devolve NÚMERO ou VEREDITO;
     não cabe a que recebe geometria e devolve GEOMETRIA NOVA.

   A `manifold-3d` entra pelo primeiro. Ela nunca produz peça: recebe a malha
   pronta e responde se aquilo é um sólido de verdade, quanto volume tem,
   quantos buracos atravessam e em quantos pedaços está. Ela é ferramenta de
   conferência, mora em `tools/`, e `arquitetura:check` reprova se ela aparecer
   no núcleo ou no serviço puro.

   O QUE ELE ACRESCENTA sobre `tools/oficina/conferir-malha.ts`, que já existe:
   aquele confere polígono simples, órfão, casca fechada, triangulação do
   adaptador e triângulo de área nula. Ele NÃO responde se o sólido tem
   auto-interseção, quantos buracos atravessam, nem quanto volume sobrou. Um
   furo passante que não atravessa passa por lá e é pego aqui, pelo gênero. */

import earcut from 'earcut';

let cacheDoModulo = null;

/* A wasm carrega uma vez por processo. Ela é assíncrona, e por isso todo este
   arquivo é assíncrono — não vale esconder isso atrás de um wrapper síncrono. */
async function carregar() {
  if (!cacheDoModulo) {
    const { default: Module } = await import('manifold-3d');
    const wasm = await Module();
    wasm.setup();
    cacheDoModulo = wasm;
  }
  return cacheDoModulo;
}

/* Normal de face pelo método de Newell: funciona para polígono de n lados e não
   assume convexidade, ao contrário de pegar o produto vetorial dos três
   primeiros vértices — que devolve lixo num vértice reflexo. */
function normalDaFace(pontos) {
  const n = [0, 0, 0];
  for (let i = 0; i < pontos.length; i++) {
    const a = pontos[i], b = pontos[(i + 1) % pontos.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const c = Math.hypot(n[0], n[1], n[2]);
  return c === 0 ? null : [n[0] / c, n[1] / c, n[2] / c];
}

/* Triangulação por earcut no plano da face, não por leque. O leque erra em face
   côncava, e face côncava existe: uma tampa com furo é côncava por definição. */
function triangularFace(pontos) {
  if (pontos.length === 3) return [[0, 1, 2]];
  const n = normalDaFace(pontos);
  if (!n) return [];
  const eixo = Math.abs(n[0]) > Math.abs(n[1]) && Math.abs(n[0]) > Math.abs(n[2]) ? 0
    : Math.abs(n[1]) > Math.abs(n[2]) ? 1 : 2;
  /* O par de eixos que sobra tem de ser DESTRÓGIRO em relação ao eixo
     descartado: (y,z) para x, (z,x) para y, (x,y) para z. Escolher (x,z) para o
     eixo y — que é a escolha "óbvia" de pular o índice — inverte a orientação
     só naquele caso, e o resultado é uma peça com faces viradas ao contrário
     apenas onde a normal aponta mais para y. Foi o que aconteceu aqui. */
  const [u, v] = eixo === 0 ? [1, 2] : eixo === 1 ? [2, 0] : [0, 1];
  const plano = pontos.flatMap((p) => [p[u], p[v]]);
  const saida = earcut(plano);
  const inverte = n[eixo] < 0;
  const tris = [];
  for (let i = 0; i < saida.length; i += 3) {
    tris.push(inverte ? [saida[i], saida[i + 2], saida[i + 1]] : [saida[i], saida[i + 1], saida[i + 2]]);
  }
  return tris;
}

export function triangularNeutro(neutro) {
  if (!neutro?.V || !neutro?.F) throw new Error('conferente: estado neutro inválido');
  const ids = [...neutro.V.keys()];
  const indice = new Map(ids.map((id, i) => [id, i]));
  const vertices = new Float32Array(ids.length * 3);
  ids.forEach((id, i) => {
    const p = neutro.V.get(id);
    vertices[i * 3] = p[0]; vertices[i * 3 + 1] = p[1]; vertices[i * 3 + 2] = p[2];
  });
  const triangulos = [];
  for (const face of neutro.F.values()) {
    const pontos = face.vs.map((v) => neutro.V.get(v));
    for (const t of triangularFace(pontos)) {
      triangulos.push(indice.get(face.vs[t[0]]), indice.get(face.vs[t[1]]), indice.get(face.vs[t[2]]));
    }
  }
  return { vertices, triangulos: new Uint32Array(triangulos) };
}

/* O veredito. Ele devolve NÚMERO e MOTIVO, nunca malha — nem corrigida, nem
   simplificada, nem remontada. Se a conferência pudesse devolver geometria,
   alguém acabaria promovendo a saída dela a peça, e a identidade das faces
   morreria aí. */
export async function conferirTopologia(neutro) {
  const { Manifold, Mesh } = await carregar();
  const { vertices, triangulos } = triangularNeutro(neutro);
  const base = { vertices: vertices.length / 3, triangulos: triangulos.length / 3 };
  let solido;
  try {
    solido = new Manifold(new Mesh({ numProp: 3, vertProperties: vertices, triVerts: triangulos }));
  } catch (erro) {
    return { ...base, solido: false, motivo: erro?.message ?? String(erro) };
  }
  try {
    return {
      ...base,
      solido: true,
      volume: solido.volume(),
      area: solido.surfaceArea(),
      /* gênero = quantos buracos ATRAVESSAM a peça. Furo cego não conta, e é
         justamente por isso que ele distingue um furo passante de verdade de um
         furo que parou no meio do caminho. */
      buracosPassantes: solido.genus(),
      componentes: solido.decompose().length,
      motivo: null,
    };
  } finally {
    solido.delete();
  }
}
