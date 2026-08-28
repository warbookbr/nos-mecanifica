/* roteiro.mjs — inspeção por estação, uma de cada vez.

   Por que existe: olhar o carro inteiro esconde defeito. Nesta investigação,
   TODO defeito que apareceu — o gancho no encontro do arco com a soleira, a
   barriga no fundo à frente da roda, o degrau que a soleira reta deixou — foi
   achado ampliando um pedaço. Nenhum foi achado olhando o conjunto. O conjunto
   serve para julgar proporção; ele não serve para achar defeito local.

   Cada estação declara a PERGUNTA que ela responde e a janela em z, derivada
   das grandezas com nome — assim a janela acompanha o carro quando ele muda, em
   vez de virar mais uma tabela de coordenadas a manter à mão.

   A ordem é a do usuário: traseira primeiro, frente por último. Ela não é
   alfabética nem geométrica; é a ordem em que ele quer olhar. */

import { eixos, pontas, linhaDeCima, rodas } from './carro.mjs';

/* Janela mínima em z. Estação muito estreita fica ilegível; muito larga volta a
   esconder defeito, que é o problema que este arquivo existe para resolver. */
const MINIMA = 700;

function porNome(c, nome) {
  const q = linhaDeCima(c).find((x) => x.nome === nome);
  if (!q) throw new Error(`estação pede o ponto '${nome}', que não existe na linha de cima`);
  return q;
}

export function estacoes(c) {
  const e = eixos(c);
  const p = pontas(c);
  const raioDoArco = c.roda.raio + c.arco.folga;
  const cima = Object.fromEntries(linhaDeCima(c).map((q) => [q.nome, q]));

  const bruto = [
    {
      nome: 'porta-malas',
      pergunta: 'o porta-malas tem altura e comprimento de porta-malas, ou é um rabo caindo?',
      de: cima['inicio-do-porta-malas'].z + 250, ate: p.tras - 150,
    },
    {
      nome: 'arco-traseiro',
      pergunta: 'o arco é redondo, cobre a roda e encontra a lateral sem gancho nem degrau?',
      de: e.traseiro + raioDoArco + c.arco.raioDoFilete + 250, ate: e.traseiro - raioDoArco - c.arco.raioDoFilete - 250,
    },
    {
      nome: 'arco-dianteiro',
      pergunta: 'o arco é redondo, cobre a roda e encontra a lateral sem gancho nem degrau?',
      de: e.dianteiro + raioDoArco + c.arco.raioDoFilete + 250, ate: e.dianteiro - raioDoArco - c.arco.raioDoFilete - 250,
    },
    {
      nome: 'fundo-no-meio',
      pergunta: 'a soleira entre as rodas é reta, ou afunda no meio?',
      de: e.dianteiro - raioDoArco, ate: e.traseiro + raioDoArco,
    },
    {
      nome: 'bico',
      pergunta: 'a frente acaba de cara, ou vira uma rampa fina pairando no ar?',
      de: p.frente + 150, ate: cima['alto-do-nariz'].z - 250,
    },
    {
      nome: 'capo',
      pergunta: 'o capô deita reto até o para-brisa, ou abaúla no meio?',
      de: cima['alto-do-nariz'].z + 150, ate: cima['capo-na-base'].z - 150,
    },
    {
      nome: 'para-brisa-e-teto',
      pergunta: 'o teto é um teto, ou um morro arredondado sem começo nem fim?',
      de: cima['capo-na-base'].z + 250, ate: cima['fim-do-teto'].z - 250,
    },
    {
      nome: 'vidro-traseiro',
      pergunta: 'a queda de trás é uma linha só, ou tem quebra e barriga onde não devia?',
      de: cima['fim-do-teto'].z + 150, ate: cima['inicio-do-porta-malas'].z - 150,
    },
    {
      nome: 'saia-dianteira',
      pergunta: 'o fundo entre o para-choque e o arco é reto?',
      de: p.frente + 150, ate: e.dianteiro + raioDoArco,
    },
    {
      nome: 'saia-traseira',
      pergunta: 'o fundo entre o arco e o para-choque de trás é reto?',
      de: e.traseiro - raioDoArco, ate: p.tras - 150,
    },
  ];

  return bruto.map((x) => {
    const centro = (x.de + x.ate) / 2;
    const largura = Math.max(MINIMA, x.de - x.ate);
    return { ...x, de: centro + largura / 2, ate: centro - largura / 2 };
  });
}

/* Recorte de um contorno na janela da estação, com um ponto de cada lado fora
   dela para a curva não terminar no ar. */
export function recortar(pontos, de, ate) {
  const dentro = pontos.map((q) => q.z <= de && q.z >= ate);
  const primeiro = dentro.indexOf(true);
  if (primeiro === -1) return [];
  const ultimo = dentro.lastIndexOf(true);
  return pontos.slice(Math.max(0, primeiro - 1), Math.min(pontos.length, ultimo + 2));
}

/* A roda que aparece nesta janela, quando aparece. Sem ela o arco não se julga:
   a pergunta é justamente se o arco cobre a roda. */
export function rodaNaJanela(c, de, ate) {
  return rodas(c).find((r) => r.z <= de && r.z >= ate) ?? null;
}
