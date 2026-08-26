/* carro.mjs — o carro inteiro como GRANDEZAS COM NOME.

   Este arquivo é a fatia D0 do plano de modelagem dirigida. Ele não desenha
   superfície e não compila malha: ele só declara o vocabulário e deriva as duas
   silhuetas que decidem proporção — a lateral e a planta.

   A regra que o sustenta: toda frase que o usuário disser precisa cair numa
   grandeza daqui. "O teto está baixo" é `teto.altura`. "O capô está comprido" é
   `capo.comprimento`. Se uma frase não tiver grandeza, criar a grandeza é a
   entrega da rodada — não se improvisa mexendo em ponto solto.

   Convenção da Mecanifica: milímetros, z para a frente, y a partir do solo,
   origem de z no meio do entre-eixos. */

/* Cada grandeza traz a frase que a aciona. Isso não é decoração: é o índice que
   liga linguagem comum a parâmetro, e é o que impede a tabela de virar oitenta
   números anônimos como em todas as tentativas anteriores. */
export const VOCABULARIO = {
  'comprimento': 'o carro está comprido / curto demais',
  'entreEixos': 'as rodas estão perto / longe uma da outra',
  'balancoDianteiro': 'sobra muito carro na frente da roda dianteira',
  'balancoTraseiro': 'sobra muito carro atrás da roda traseira',
  'alturaLivre': 'está alto / baixo do chão',
  'roda.raio': 'a roda está grande / pequena',
  'arco.folga': 'o arco está apertado / largo demais em volta da roda',
  'nariz.altura': 'o nariz está baixo / alto',
  'nariz.quedaDaPonta': 'a ponta da frente cai demais / é chata demais',
  'capo.comprimento': 'o capô está comprido / curto',
  'capo.alturaNaBase': 'o capô está alto / baixo junto ao para-brisa',
  'paraBrisa.recuo': 'o para-brisa está deitado / em pé demais',
  'teto.altura': 'o teto está alto / baixo',
  'teto.comprimento': 'a cabine está comprida / curta',
  'teto.recuo': 'a cabine está muito à frente / muito atrás',
  'traseira.altura': 'a traseira está alta / baixa',
  'traseira.queda': 'a traseira cai rápido demais / é comprida demais',
  'soleira.altura': 'a soleira está alta / baixa',
  'meiaLargura.nariz': 'a frente está larga / estreita',
  'meiaLargura.paraLamaDianteiro': 'o para-lama da frente incha pouco / demais',
  'meiaLargura.cintura': 'falta cintura no meio / está estrangulado demais',
  'meiaLargura.ombroTraseiro': 'os ombros de trás estão largos / estreitos',
  'meiaLargura.traseira': 'a traseira está larga / estreita',
};

/* O primeiro palpite. Ele é MEU, não foi lido do contorno da referência: se eu
   copiasse os números do fastback medido, a fatia D1 fecharia sozinha e não
   provaria nada sobre o laço. Está aqui para ser corrigido. */
export const CARRO = {
  comprimento: 4600,
  entreEixos: 2740,
  alturaLivre: 130,

  roda: { raio: 340, larguraDoArco: 250 },
  arco: { folga: 45 },

  balancoDianteiro: 930,
  balancoTraseiro: 930,

  nariz: { altura: 820, quedaDaPonta: 170 },
  capo: { comprimento: 1500, alturaNaBase: 950 },
  paraBrisa: { recuo: 700 },
  teto: { altura: 1300, comprimento: 900, recuo: 250 },
  traseira: { altura: 900, queda: 1900 },
  soleira: { altura: 300 },

  /* MEIA largura, sempre — a versão anterior misturava largura cheia no nariz
     com meia largura no para-lama e a planta saía com cara de pé. */
  meiaLargura: {
    nariz: 350,
    paraLamaDianteiro: 890,
    cintura: 830,
    ombroTraseiro: 960,
    traseira: 700,
  },
};

/* --- derivações: as grandezas viram posições, e nada mais é digitado --- */

export function eixos(c) {
  return { dianteiro: c.entreEixos / 2, traseiro: -c.entreEixos / 2 };
}

export function pontas(c) {
  const e = eixos(c);
  return { frente: e.dianteiro + c.balancoDianteiro, tras: e.traseiro - c.balancoTraseiro };
}

export function balancos(c) {
  return { dianteiro: c.balancoDianteiro, traseiro: c.balancoTraseiro };
}

/* Comprimento realmente ocupado. Divergir de `comprimento` não é erro: é o
   sinal de que balanço e entre-eixos não fecham com o total pedido, e quem
   decide qual dos três cede é o usuário. */
export function comprimentoOcupado(c) {
  const p = pontas(c);
  return p.frente - p.tras;
}

/* Linha de cima, da frente para trás. Cada ponto tem NOME. */
export function linhaDeCima(c) {
  const e = eixos(c);
  const p = pontas(c);
  const zBaseParaBrisa = e.dianteiro - c.capo.comprimento + c.balancoDianteiro;
  const zTopoParaBrisa = zBaseParaBrisa - c.paraBrisa.recuo;
  const zFimTeto = zTopoParaBrisa - c.teto.comprimento;
  return [
    { nome: 'ponta-do-nariz', z: p.frente, y: c.nariz.altura - c.nariz.quedaDaPonta },
    { nome: 'alto-do-nariz', z: p.frente - c.balancoDianteiro * 0.55, y: c.nariz.altura },
    { nome: 'capo-na-base', z: zBaseParaBrisa, y: c.capo.alturaNaBase },
    { nome: 'topo-do-para-brisa', z: zTopoParaBrisa, y: c.teto.altura },
    { nome: 'fim-do-teto', z: zFimTeto, y: c.teto.altura },
    { nome: 'traseira-em-queda', z: zFimTeto - c.traseira.queda * 0.55, y: c.traseira.altura + (c.teto.altura - c.traseira.altura) * 0.35 },
    { nome: 'ponta-da-traseira', z: p.tras, y: c.traseira.altura },
  ];
}

/* Linha de baixo, da frente para trás, com os dois arcos abertos. O arco não é
   um recorte decorativo: ele é onde a roda passa, e é por isso que raio e folga
   são grandezas e não desenho. */
export function linhaDeBaixo(c) {
  const e = eixos(c);
  const p = pontas(c);
  /* O arco é um círculo em volta do centro da roda, que está em y = raio. A
     versão anterior punha o topo do arco em raio+folga — abaixo do topo da
     roda — e a roda saía para fora da carroceria. */
  return [
    { nome: 'ponta-do-parachoque', z: p.frente, y: c.nariz.altura - c.nariz.quedaDaPonta - 420 },
    { nome: 'saia-dianteira', z: p.frente - 260, y: c.alturaLivre + 60 },
    ...arco(c, e.dianteiro, 'dianteiro'),
    { nome: 'soleira', z: 0, y: c.soleira.altura - 40 },
    ...arco(c, e.traseiro, 'traseiro'),
    { nome: 'saia-traseira', z: p.tras + 240, y: c.alturaLivre + 60 },
    { nome: 'ponta-do-parachoque-traseiro', z: p.tras, y: c.traseira.altura - 430 },
  ];
}

/* O arco é um ARCO, e por isso é amostrado sobre um círculo em volta do centro
   da roda — não um ponto de pico entre dois pontos de base. Com um ponto só no
   topo, a interpolação faz uma barraca pontuda, que foi exatamente a queixa
   registrada nas tentativas anteriores ("o arco está quadrado / pontudo"). */
function arco(c, zCentro, sufixo) {
  const raioDoArco = c.roda.raio + c.arco.folga;
  const yCentro = c.roda.raio;
  /* Onde o arco encontra a soleira: o ângulo em que o círculo cruza essa altura. */
  const cosLimite = Math.max(-1, Math.min(1, (c.soleira.altura - yCentro) / raioDoArco));
  const limite = Math.acos(cosLimite);
  const PASSOS = 8;
  const pontos = [];
  for (let i = 0; i <= PASSOS; i++) {
    const ang = limite - (2 * limite * i) / PASSOS;
    pontos.push({
      nome: i === 0 ? `entrada-do-arco-${sufixo}`
        : i === PASSOS ? `saida-do-arco-${sufixo}`
        : i === PASSOS / 2 ? `topo-do-arco-${sufixo}` : `arco-${sufixo}-${i}`,
      z: zCentro + raioDoArco * Math.sin(ang),
      y: yCentro + raioDoArco * Math.cos(ang),
    });
  }
  return pontos;
}

/* Planta: meia largura ao longo de z. A cintura entre os para-lamas é o que
   nenhuma tentativa anterior teve — todas saíram de largura constante. */
export function meiaLargura(c) {
  const e = eixos(c);
  const p = pontas(c);
  return [
    { nome: 'nariz', z: p.frente, x: c.meiaLargura.nariz },
    { nome: 'para-lama-dianteiro', z: e.dianteiro, x: c.meiaLargura.paraLamaDianteiro },
    { nome: 'cintura', z: (e.dianteiro + e.traseiro) / 2 + 200, x: c.meiaLargura.cintura },
    { nome: 'ombro-traseiro', z: e.traseiro, x: c.meiaLargura.ombroTraseiro },
    { nome: 'traseira', z: p.tras, x: c.meiaLargura.traseira },
  ];
}

/* Onde as rodas ficam, para desenhá-las como apoio de leitura. Elas não são
   carroceria; existem porque proporção sem roda não se julga. */
export function rodas(c) {
  const e = eixos(c);
  return [
    { nome: 'dianteira', z: e.dianteiro, y: c.roda.raio, raio: c.roda.raio },
    { nome: 'traseira', z: e.traseiro, y: c.roda.raio, raio: c.roda.raio },
  ];
}

/* Alterar por NOME. Aceita caminho pontuado ('teto.altura') e devolve um carro
   novo; nunca muta o original, para que uma rodada possa ser refeita. */
export function alterar(c, caminho, valor) {
  const partes = caminho.split('.');
  const copia = estruturaProfunda(c);
  let alvo = copia;
  for (const parte of partes.slice(0, -1)) {
    if (!(parte in alvo)) throw new Error(`grandeza '${caminho}' não existe em carro.mjs`);
    alvo = alvo[parte];
  }
  const folha = partes[partes.length - 1];
  if (!(folha in alvo)) throw new Error(`grandeza '${caminho}' não existe em carro.mjs`);
  if (!Number.isFinite(valor)) throw new Error(`valor de '${caminho}' precisa ser finito`);
  alvo[folha] = valor;
  return copia;
}

function estruturaProfunda(v) {
  if (Array.isArray(v)) return v.map(estruturaProfunda);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, estruturaProfunda(x)]));
  }
  return v;
}
