/* Provas do conferente topológico.

   Metade delas prova que ele ACEITA o que o núcleo produz. A outra metade prova
   que ele RECUSA malha quebrada — sem essa metade ele seria um carimbo, e um
   verificador que nunca diz não não é verificador. */

import { describe, it, expect } from 'vitest';
// @ts-expect-error — núcleo legado em JavaScript, exercitado pela API pública.
import { nucleo } from '../../prototipos/procedural/v3/motor/oficina.js';
import { conferirTopologia, triangularNeutro } from './conferente-topologico.mjs';

const LADOS_DO_FURO = 12;
const cilindro = ['cilindro', { id: 0, origemId: 1, raio: 0.060, altura: 0.012, lados: 24 }];
const furoPassante = (centros) => ['furo', {
  origemId: 9,
  de: { op: 'cilindro', id: 1, tampa: 'topo' },
  saida: { op: 'cilindro', id: 1, tampa: 'fundo' },
  raio: 0.0055, lados: LADOS_DO_FURO, orientacao: [1, 0, 0], centros,
}];
const furoCego = (centros) => ['furo', {
  origemId: 9,
  de: { op: 'cilindro', id: 1, tampa: 'topo' },
  profundidade: 0.006,
  raio: 0.0055, lados: LADOS_DO_FURO, orientacao: [1, 0, 0], centros,
}];

/* Um neutro montado à mão, para poder quebrá-lo de propósito. */
function neutroDeFaces(vertices, faces) {
  return {
    V: new Map(vertices.map((p, i) => [i, p])),
    F: new Map(faces.map((vs, i) => [i, { id: i, vs }])),
  };
}
const TETRA = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]];
const TETRA_FACES = [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]];

describe('aceita o que o núcleo produz', () => {
  it('cilindro sem furo é um sólido de um pedaço e sem buraco passante', async () => {
    const v = await conferirTopologia(nucleo([cilindro], {}, {}));
    expect(v.solido).toBe(true);
    expect(v.componentes).toBe(1);
    expect(v.buracosPassantes).toBe(0);
    expect(v.volume).toBeGreaterThan(0);
  });

  it('conta os buracos que ATRAVESSAM, um por furo passante', async () => {
    const um = await conferirTopologia(nucleo([cilindro, furoPassante([[0.03, 0, 0]])], {}, {}));
    expect(um.buracosPassantes).toBe(1);
    const quatro = await conferirTopologia(nucleo([cilindro, furoPassante(
      [[0.03, 0, 0], [0, 0, 0.03], [-0.03, 0, 0], [0, 0, -0.03]],
    )], {}, {}));
    expect(quatro.buracosPassantes).toBe(4);
  });

  it('furo CEGO não vira buraco passante, e ainda assim tira volume', async () => {
    /* Esta é a distinção que nenhuma conferência anterior fazia: um furo
       passante que não atravessou passa por "malha fechada" e é pego aqui. */
    const cheio = await conferirTopologia(nucleo([cilindro], {}, {}));
    const cego = await conferirTopologia(nucleo([cilindro, furoCego([[0.03, 0, 0]])], {}, {}));
    expect(cego.solido).toBe(true);
    expect(cego.buracosPassantes).toBe(0);
    expect(cego.volume).toBeLessThan(cheio.volume);
  });

  it('cada furo passante tira volume, e nenhum some no caminho', async () => {
    const cheio = await conferirTopologia(nucleo([cilindro], {}, {}));
    const um = await conferirTopologia(nucleo([cilindro, furoPassante([[0.03, 0, 0]])], {}, {}));
    const quatro = await conferirTopologia(nucleo([cilindro, furoPassante(
      [[0.03, 0, 0], [0, 0, 0.03], [-0.03, 0, 0], [0, 0, -0.03]],
    )], {}, {}));
    expect(um.volume).toBeLessThan(cheio.volume);
    expect(quatro.volume).toBeLessThan(um.volume);
  });
});

describe('recusa malha quebrada — senão seria carimbo', () => {
  it('recusa casca aberta', async () => {
    const v = await conferirTopologia(neutroDeFaces(TETRA, TETRA_FACES.slice(0, 3)));
    expect(v.solido).toBe(false);
    expect(v.motivo).toMatch(/manifold/i);
  });

  it('recusa face com orientação invertida', async () => {
    const faces = [...TETRA_FACES];
    faces[3] = [...faces[3]].reverse();
    const v = await conferirTopologia(neutroDeFaces(TETRA, faces));
    expect(v.solido).toBe(false);
  });

  it('aceita o mesmo tetraedro quando ele está inteiro', async () => {
    const v = await conferirTopologia(neutroDeFaces(TETRA, TETRA_FACES));
    expect(v.solido).toBe(true);
    expect(v.volume).toBeCloseTo(1 / 6, 6);
  });
});

describe('triangulação', () => {
  it('trata face côncava sem leque — uma tampa com furo é côncava', async () => {
    /* Leque a partir do primeiro vértice inventa triângulo fora do polígono
       quando há vértice reflexo. Aqui a tampa furada precisa fechar direito, e
       o veredito de sólido é o que prova que fechou. */
    const n = nucleo([cilindro, furoPassante([[0.03, 0, 0]])], {}, {});
    const { triangulos } = triangularNeutro(n);
    expect(triangulos.length % 3).toBe(0);
    expect((await conferirTopologia(n)).solido).toBe(true);
  });

  it('recusa entrada que não é estado neutro', async () => {
    expect(() => triangularNeutro({})).toThrow(/neutro inválido/);
  });
});
