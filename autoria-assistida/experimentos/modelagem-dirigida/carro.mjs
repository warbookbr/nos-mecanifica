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
  'arco.aberturaAbaixoDoCentro': 'o arco desce demais / de menos ao encontrar a lateral',
  'arco.transicao': 'o arco encontra a lateral de forma abrupta / arredondada demais',
  'nariz.altura': 'o nariz está baixo / alto',
  'nariz.quedaDaPonta': 'a ponta da frente cai demais / é chata demais',
  'capo.comprimento': 'o capô está comprido / curto',
  'capo.alturaNaBase': 'o capô está alto / baixo junto ao para-brisa',
  'paraBrisa.recuo': 'o para-brisa está deitado / em pé demais',
  'teto.altura': 'o teto está alto / baixo',
  'teto.comprimento': 'a cabine está comprida / curta',
  'teto.recuo': 'a cabine está muito à frente / muito atrás',
  'nariz.alturaDoParachoque': 'o para-choque da frente desce demais / de menos',
  'vidroTraseiro.barriga': 'o vidro de trás está arqueado / reto demais',
  'portaMalas.altura': 'a traseira está alta / baixa',
  'portaMalas.comprimento': 'o porta-malas está comprido / curto',
  'portaMalas.queda': 'a ponta da traseira cai demais / é chata demais',
  'traseira.alturaDoParachoque': 'o para-choque de trás desce demais / de menos',
  'soleira.altura': 'a soleira está alta / baixa',
  'soleira.recuoDoArco': 'a soleira reta começa muito perto / muito longe do arco',
  'saia.altura': 'o fundo do carro na frente e atrás das rodas está alto / baixo',
  'saia.recuoDaPonta': 'o para-choque desce muito perto / muito longe da ponta',
  'saia.encosto': 'o fundo reto vai até muito perto / muito longe do arco',
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
  arco: { folga: 45, aberturaAbaixoDoCentro: 0, transicao: 150 },

  balancoDianteiro: 750,
  balancoTraseiro: 1035,

  nariz: { altura: 900, quedaDaPonta: 350, alturaDoParachoque: 485 },
  capo: { comprimento: 1500, alturaNaBase: 950 },
  paraBrisa: { recuo: 700 },
  teto: { altura: 1315, comprimento: 350, recuo: 250 },
  /* A traseira deixou de ser 'altura + queda' e passou a ser o que o usuário
     nomeia quando olha: o vidro de trás, o porta-malas e o para-choque. A
     `barriga` é o quanto o vidro arqueia acima da reta entre o fim do teto e o
     começo do porta-malas — no fastback ele arqueia pouco e vai longe. */
  vidroTraseiro: { barriga: 70 },
  portaMalas: { altura: 910, comprimento: 670, queda: 260 },
  traseira: { alturaDoParachoque: 520 },
  /* Mesma lição da saia: um ponto só no meio não faz linha reta, faz barriga —
     aqui para baixo, com a soleira afundando entre as rodas. Dois pontos. */
  soleira: { altura: 250, recuoDoArco: 260 },
  /* O fundo do carro à frente e atrás das rodas. `encosto` é o quanto o trecho
     reto avança em direção ao arco antes de a curva começar a subir. */
  /* A saia fica ACIMA da soleira, não abaixo. No alvo medido o fundo à frente e
     atrás das rodas está mais alto que a soleira — o corpo levanta nas pontas.
     Eu tinha invertido isso, e era a causa do carro se arrastar na frente e
     atrás, inclusive do fundo traseiro que o usuário apontou. */
  saia: { altura: 335, recuoDaPonta: 260, encosto: 60 },

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
  const zPortaMalas = p.tras + c.portaMalas.comprimento;
  return [
    { nome: 'ponta-do-nariz', z: p.frente, y: c.nariz.altura - c.nariz.quedaDaPonta },
    { nome: 'alto-do-nariz', z: p.frente - c.balancoDianteiro * 0.55, y: c.nariz.altura },
    { nome: 'capo-na-base', z: zBaseParaBrisa, y: c.capo.alturaNaBase },
    { nome: 'topo-do-para-brisa', z: zTopoParaBrisa, y: c.teto.altura },
    { nome: 'fim-do-teto', z: zFimTeto, y: c.teto.altura },
    { nome: 'vidro-traseiro', z: (zFimTeto + zPortaMalas) / 2, y: (c.teto.altura + c.portaMalas.altura) / 2 + c.vidroTraseiro.barriga },
    { nome: 'inicio-do-porta-malas', z: zPortaMalas, y: c.portaMalas.altura },
    { nome: 'ponta-da-traseira', z: p.tras, y: c.portaMalas.altura - c.portaMalas.queda },
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
  /* A SAIA é um trecho RETO, e por isso tem dois pontos na mesma altura em vez
     de um só. Com um ponto só entre o para-choque e o arco, a interpolação
     passava por ele fazendo barriga — a linha descia depois do para-choque e
     subia de novo no arco, e o fundo do carro ficava abaulado. Dois pontos na
     mesma altura fixam o trecho reto e deixam a curva virar só nas pontas. */
  const raioDoArco = c.roda.raio + c.arco.folga;
  const encostoDianteiro = e.dianteiro + raioDoArco + c.saia.encosto;
  const encostoTraseiro = e.traseiro - raioDoArco - c.saia.encosto;
  /* A soleira reta começa DEPOIS da transição do arco. Ela ficava colada nela, e
     a curva não tinha espaço para descer do arco até a soleira sem dar um nó. */
  const inicioDaSoleira = e.dianteiro - raioDoArco - c.arco.transicao - c.soleira.recuoDoArco;
  return [
    { nome: 'ponta-do-parachoque', z: p.frente, y: c.nariz.alturaDoParachoque },
    { nome: 'saia-dianteira-na-ponta', z: p.frente - c.saia.recuoDaPonta, y: c.saia.altura },
    { nome: 'saia-dianteira-no-arco', z: encostoDianteiro, y: c.saia.altura },
    ...arco(c, e.dianteiro, 'dianteiro', 'saida'),
    { nome: 'soleira-na-frente', z: inicioDaSoleira, y: c.soleira.altura },
    { nome: 'soleira-atras', z: -inicioDaSoleira, y: c.soleira.altura },
    ...arco(c, e.traseiro, 'traseiro', 'entrada'),
    { nome: 'saia-traseira-no-arco', z: encostoTraseiro, y: c.saia.altura },
    { nome: 'saia-traseira-na-ponta', z: p.tras + c.saia.recuoDaPonta, y: c.saia.altura },
    { nome: 'ponta-do-parachoque-traseiro', z: p.tras, y: c.traseira.alturaDoParachoque },
  ];
}

/* O arco é um ARCO, e por isso é amostrado sobre um círculo em volta do centro
   da roda — não um ponto de pico entre dois pontos de base. Com um ponto só no
   topo, a interpolação faz uma barraca pontuda.

   ONDE O ARCO TERMINA é a segunda decisão, e foi a causa da farpa que o usuário
   marcou nos dois arcos, sempre do lado que encosta na soleira. O arco descia
   até cruzar a altura da soleira, que fica ABAIXO do centro da roda: passando
   do centro, o círculo começa a voltar para dentro, e essa parte reentrante
   vira um gancho preso na soleira.

   Carroceria de verdade não faz isso — a abertura do arco termina na altura do
   centro da roda ou pouco abaixo, e daí em diante quem desce é a saia. Então a
   parada do arco virou grandeza: `arco.aberturaAbaixoDoCentro`. */
function arco(c, zCentro, sufixo, ladoDaSoleira) {
  const raioDoArco = c.roda.raio + c.arco.folga;
  const yCentro = c.roda.raio;
  const yParada = yCentro - c.arco.aberturaAbaixoDoCentro;
  const cosLimite = Math.max(-1, Math.min(1, (yParada - yCentro) / raioDoArco));
  const limite = Math.acos(cosLimite);
  const PASSOS = 10;
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

  /* TRANSIÇÃO, só do lado que encosta na SOLEIRA. Ali o arco termina quase na
     vertical e o ponto seguinte é a soleira, quase na horizontal: a
     interpolação não tem espaço para virar e devolve um laço enrolado sobre si
     mesmo — o gancho que o usuário marcou nos dois arcos, sempre desse lado.
     Este ponto dá à curva o comprimento de que ela precisa para deitar.

     Do lado da saia não entra: lá a linha já desce, e forçar a transição criava
     uma ondinha no lugar de um gancho — troca de defeito, não conserto. */
  const primeiro = pontos[0], ultimo = pontos[pontos.length - 1];
  if (ladoDaSoleira === 'entrada') {
    return [{ nome: `antes-do-arco-${sufixo}`, z: primeiro.z + c.arco.transicao, y: primeiro.y }, ...pontos];
  }
  return [...pontos, { nome: `depois-do-arco-${sufixo}`, z: ultimo.z - c.arco.transicao, y: ultimo.y }];
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
