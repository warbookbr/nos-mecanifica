/* Provas do vocabulário. Nenhuma delas julga se o carro está bonito — isso é do
   usuário. Elas garantem que o laço não minta: que toda grandeza tenha frase,
   que alterar por nome funcione e falhe alto, e que os dois erros já cometidos
   nesta fatia não voltem. */

import { describe, it, expect } from 'vitest';
import {
  CARRO, VOCABULARIO, alterar, linhaDeCima, linhaDeBaixo, meiaLargura,
  rodas, eixos, pontas, comprimentoOcupado,
} from './carro.mjs';

function folhas(obj, prefixo = '') {
  return Object.entries(obj).flatMap(([k, v]) => (
    v && typeof v === 'object' && !Array.isArray(v)
      ? folhas(v, `${prefixo}${k}.`)
      : [`${prefixo}${k}`]
  ));
}

describe('vocabulário', () => {
  it('toda grandeza do carro tem uma frase que a aciona', () => {
    const semFrase = folhas(CARRO).filter((c) => !(c in VOCABULARIO));
    /* Grandezas auxiliares que ainda não têm frase própria são declaradas aqui
       de propósito: uma grandeza órfã significa que o usuário pode pedir algo
       que a IA não sabe onde mexer, e é exatamente esse buraco que faz voltar a
       digitar coordenada. */
    expect(semFrase).toEqual(['roda.larguraDoArco']);
  });

  it('nenhuma frase aponta para grandeza inexistente', () => {
    const todas = new Set(folhas(CARRO));
    expect(Object.keys(VOCABULARIO).filter((c) => !todas.has(c))).toEqual([]);
  });
});

describe('alterar por nome', () => {
  it('devolve um carro novo e não muta o original', () => {
    const antes = CARRO.teto.altura;
    const novo = alterar(CARRO, 'teto.altura', 1400);
    expect(novo.teto.altura).toBe(1400);
    expect(CARRO.teto.altura).toBe(antes);
  });

  it('recusa grandeza que não existe, em vez de criar silenciosamente', () => {
    expect(() => alterar(CARRO, 'teto.inclinacao', 10)).toThrow(/não existe/);
    expect(() => alterar(CARRO, 'aerofolio.altura', 10)).toThrow(/não existe/);
  });

  it('recusa valor não finito', () => {
    expect(() => alterar(CARRO, 'teto.altura', Number.NaN)).toThrow(/finito/);
  });
});

describe('silhueta lateral', () => {
  it('o arco cobre a roda inteira — o topo do arco fica acima do topo da roda', () => {
    for (const r of rodas(CARRO)) {
      const topoDaRoda = r.y + r.raio;
      const topo = linhaDeBaixo(CARRO).find((q) => q.nome === `topo-do-arco-${r.nome === 'dianteira' ? 'dianteiro' : 'traseiro'}`);
      expect(topo.y).toBeGreaterThan(topoDaRoda);
    }
  });

  it('o arco é amostrado como arco, não como um pico entre duas bases', () => {
    const meio = linhaDeBaixo(CARRO).filter((q) => q.nome.startsWith('arco-dianteiro-'));
    expect(meio.length).toBeGreaterThanOrEqual(6);
  });

  it('a linha de cima anda sempre para trás, sem voltar sobre si mesma', () => {
    const zs = linhaDeCima(CARRO).map((q) => q.z);
    for (let i = 1; i < zs.length; i++) expect(zs[i]).toBeLessThan(zs[i - 1]);
  });

  it('o teto é o ponto mais alto do carro', () => {
    const alto = Math.max(...linhaDeCima(CARRO).map((q) => q.y));
    expect(alto).toBe(CARRO.teto.altura);
  });
});

describe('planta', () => {
  it('todas as larguras são MEIA largura, medidas do eixo de simetria', () => {
    /* O nariz já saiu uma vez como largura cheia no meio de meias larguras, e a
       planta ficou com cara de pé. */
    const xs = meiaLargura(CARRO).map((q) => q.x);
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(1200);
  });

  it('tem cintura: o meio é mais estreito que os dois para-lamas', () => {
    const por = Object.fromEntries(meiaLargura(CARRO).map((q) => [q.nome, q.x]));
    expect(por.cintura).toBeLessThan(por['para-lama-dianteiro']);
    expect(por.cintura).toBeLessThan(por['ombro-traseiro']);
  });
});

describe('geometria de apoio', () => {
  it('as rodas ficam nos eixos e tocam o solo', () => {
    const e = eixos(CARRO);
    const [d, t] = rodas(CARRO);
    expect(d.z).toBe(e.dianteiro);
    expect(t.z).toBe(e.traseiro);
    expect(d.y).toBe(d.raio);
  });

  it('comprimento ocupado é entre-eixos mais os dois balanços', () => {
    expect(comprimentoOcupado(CARRO)).toBe(CARRO.entreEixos + CARRO.balancoDianteiro + CARRO.balancoTraseiro);
    const p = pontas(CARRO);
    expect(p.frente).toBeGreaterThan(p.tras);
  });

  it('é determinístico: duas derivações dão o mesmo resultado', () => {
    expect(linhaDeCima(CARRO)).toEqual(linhaDeCima(CARRO));
    expect(linhaDeBaixo(CARRO)).toEqual(linhaDeBaixo(CARRO));
  });
});
