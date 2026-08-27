/* Provas de que a construção por reta-arco-filete elimina, POR CONSTRUÇÃO, a
   família de defeitos que consumiu esta fatia. Cada teste nomeia o defeito que
   ele impede de voltar. */

import { describe, it, expect } from 'vitest';
import { arcoDeRoda, cruzamentoNaAltura, amostrar } from './contorno.mjs';
import { CARRO } from './carro.mjs';

const centro = [1370, CARRO.roda.raio];
const raioDoArco = CARRO.roda.raio + CARRO.arco.folga;

const montar = (extra = {}) => arcoDeRoda({
  centroDaRoda: centro,
  raioDoArco,
  alturaDaFrente: CARRO.saia.altura,
  alturaDeTras: CARRO.soleira.altura,
  ateFrente: 2100,
  ateTras: 400,
  raioDoFilete: 70,
  ...extra,
});

describe('encontro resolvido, não digitado', () => {
  it('acha onde a altura cruza o arco em vez de receber o ponto pronto', () => {
    const z = cruzamentoNaAltura({ centro, raio: raioDoArco }, CARRO.saia.altura, +1);
    const dz = z - centro[0], dy = CARRO.saia.altura - centro[1];
    expect(Math.hypot(dz, dy)).toBeCloseTo(raioDoArco, 6);
  });

  it('recusa uma altura que não cruza o arco, em vez de devolver ponto inventado', () => {
    expect(() => cruzamentoNaAltura({ centro, raio: raioDoArco }, 5000, +1)).toThrow(/não cruza/);
  });
});

describe('a família de defeitos deixa de ser representável', () => {
  const modelo = montar();

  it('o fundo é RETA — barriga não cabe na representação', () => {
    for (const nome of ['linhaDaFrente', 'linhaDeTras']) {
      const p = modelo.paths[nome];
      expect(p.type).toBe('line');
      expect(p.origin[1]).toBe(p.end[1]);
    }
  });

  it('o arco é ARCO em volta da roda — barraca pontuda não cabe', () => {
    expect(modelo.paths.arco.type).toBe('arc');
    expect(modelo.paths.arco.origin).toEqual(centro);
    expect(modelo.paths.arco.radius).toBe(raioDoArco);
  });

  it('o arco cobre o topo da roda', () => {
    const alturas = amostrar(modelo.paths.arco).map((q) => q[1]);
    expect(Math.max(...alturas)).toBeGreaterThan(CARRO.roda.raio * 2);
  });

  it('os dois encontros são filetes de verdade — laço e degrau não cabem', () => {
    for (const nome of ['fileteDaFrente', 'fileteDeTras']) {
      expect(modelo.paths[nome].type).toBe('arc');
      expect(modelo.paths[nome].radius).toBeCloseTo(70, 6);
    }
  });

  it('a cadeia é contínua: trechos vizinhos compartilham um extremo', () => {
    /* A comparação é por EXTREMO COMPARTILHADO, não por "fim de um igual ao
       início do outro": arco amostrado no sentido anti-horário sai na ordem
       inversa da cadeia, e um teste que ignora isso reprova geometria correta.
       Foi o que aconteceu na primeira versão deste teste. */
    const ordem = ['linhaDaFrente', 'fileteDaFrente', 'arco', 'fileteDeTras', 'linhaDeTras'];
    const extremos = ordem.map((n) => {
      const a = amostrar(modelo.paths[n], 48);
      return [a[0], a[a.length - 1]];
    });
    const perto = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]) < 1;
    for (let i = 0; i < extremos.length - 1; i++) {
      const compartilham = extremos[i].some((u) => extremos[i + 1].some((v) => perto(u, v)));
      expect(compartilham, `${ordem[i]} não encosta em ${ordem[i + 1]}`).toBe(true);
    }
  });

  it('a cadeia vai de ponta a ponta sem buraco no meio', () => {
    const todos = ['linhaDaFrente', 'fileteDaFrente', 'arco', 'fileteDeTras', 'linhaDeTras']
      .flatMap((n) => amostrar(modelo.paths[n], 48));
    const zs = todos.map((q) => q[0]);
    expect(Math.max(...zs)).toBeCloseTo(2100, 6);
    expect(Math.min(...zs)).toBeCloseTo(400, 6);
  });
});

describe('erro de construção falha alto', () => {
  it('filete que não cabe entre as geometrias lança, em vez de devolver canto vivo', () => {
    expect(() => montar({ raioDoFilete: 4000 })).toThrow(/não cabe/);
  });
});
