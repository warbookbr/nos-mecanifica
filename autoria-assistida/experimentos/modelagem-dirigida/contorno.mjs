/* contorno.mjs — o contorno construído com RETA, ARCO e FILETE, não com pontos
   soltos entregues a um interpolador.

   Por que existe. Todos os defeitos desta fatia foram o MESMO defeito: eu
   entregava pontos e a interpolação adivinhava por onde passar entre eles.
   Ela adivinhou errado toda vez, de maneiras diferentes:

   - o fundo reto ganhou barriga, porque um ponto só no meio não faz reta;
   - a soleira afundou, pelo mesmo motivo;
   - o arco virou barraca pontuda, porque um ponto no topo não faz arco;
   - o encontro do arco com a soleira deu um laço enrolado sobre si mesmo;
   - e, quando afastei a soleira para tirar o laço, sobrou um degrau.

   Cada um desses eu "consertei" acrescentando mais um ponto — o que é tratar
   sintoma. A causa é a representação: pontos soltos não carregam tangente, e
   sem tangente a curva entre eles é palpite.

   Aqui reta é reta e arco é arco, então barriga e barraca não são
   representáveis. O encontro é um FILETE de raio, então quem calcula a tangente
   é a biblioteca, não eu — e laço e degrau também deixam de ser representáveis.

   A maker.js (Microsoft, Apache-2.0) é quem sustenta isso. Ela é ferramenta de
   CAD 2D: retas, arcos, cadeias e filete entre caminhos. Ela não é usada no
   núcleo nem no serviço puro, e o gate de arquitetura garante isso. */

import maker from 'makerjs';

/* Onde uma altura horizontal CRUZA o círculo do arco. Nenhum ponto de encontro
   é digitado: ele é resolvido. `sinal` escolhe o lado, +1 à frente do centro da
   roda e −1 atrás. */
export function cruzamentoNaAltura({ centro, raio }, altura, sinal) {
  const dentro = raio * raio - (altura - centro[1]) ** 2;
  if (dentro <= 0) throw new Error(`a altura ${altura} não cruza um arco de raio ${raio} em ${centro[1]}`);
  return centro[0] + sinal * Math.sqrt(dentro);
}

const emGraus = (centro, z, y) => (Math.atan2(y - centro[1], z - centro[0]) * 180) / Math.PI;

/* O arco de roda com as duas linhas que ele encontra, já filetadas.

   `alturaDaFrente` e `alturaDeTras` podem ser diferentes — no alvo medido a saia
   fica mais alta que a soleira — e é justamente por isso que o encontro precisa
   de filete e não de um ponto de transição escolhido no olho. */
export function arcoDeRoda({
  centroDaRoda, raioDoArco, alturaDaFrente, alturaDeTras,
  ateFrente, ateTras, raioDoFilete,
}) {
  const circulo = { centro: centroDaRoda, raio: raioDoArco };
  const zFrente = cruzamentoNaAltura(circulo, alturaDaFrente, +1);
  const zTras = cruzamentoNaAltura(circulo, alturaDeTras, -1);

  const linhaDaFrente = new maker.paths.Line([ateFrente, alturaDaFrente], [zFrente, alturaDaFrente]);
  const arco = new maker.paths.Arc(
    centroDaRoda, raioDoArco,
    emGraus(centroDaRoda, zFrente, alturaDaFrente),
    emGraus(centroDaRoda, zTras, alturaDeTras),
  );
  const linhaDeTras = new maker.paths.Line([zTras, alturaDeTras], [ateTras, alturaDeTras]);

  const fileteDaFrente = maker.path.fillet(linhaDaFrente, arco, raioDoFilete);
  const fileteDeTras = maker.path.fillet(arco, linhaDeTras, raioDoFilete);
  /* Filete que não fecha é erro de construção, não detalhe visual: significa que
     o raio pedido não cabe entre as duas geometrias. Falhar alto aqui é melhor
     que devolver um canto vivo e alguém achar que é escolha de desenho. */
  if (!fileteDaFrente || !fileteDeTras) {
    throw new Error(`filete de raio ${raioDoFilete} não cabe no encontro do arco com a lateral`);
  }

  return {
    paths: {
      linhaDaFrente, fileteDaFrente, arco, fileteDeTras, linhaDeTras,
    },
  };
}

/* Amostra um caminho da maker.js em pontos, para as ferramentas de vista e de
   sobreposição que ainda trabalham com polilinha. É via de mão única: o desenho
   sai daqui, e ninguém volta a editar os pontos amostrados. */
export function amostrar(caminho, passos = 24) {
  if (caminho.type === 'line') return [caminho.origin, caminho.end];
  const pontos = [];
  let volta = caminho.endAngle - caminho.startAngle;
  if (volta < 0) volta += 360;
  for (let i = 0; i <= passos; i++) {
    const ang = ((caminho.startAngle + (volta * i) / passos) * Math.PI) / 180;
    pontos.push([
      caminho.origin[0] + caminho.radius * Math.cos(ang),
      caminho.origin[1] + caminho.radius * Math.sin(ang),
    ]);
  }
  return pontos;
}

export function amostrarModelo(modelo, passos = 24) {
  return Object.values(modelo.paths).flatMap((p) => amostrar(p, passos));
}

/* --- a parte de baixo do carro inteira, como uma cadeia só --- */

/* Ela vai do para-choque dianteiro ao traseiro passando pelos dois arcos e pela
   soleira, e é montada com retas, arcos e filetes. Nada aqui é ponto solto.

   A ASSIMETRIA DOS ARCOS, que o usuário apontou no roteiro, tinha uma causa
   boba: um lado do arco encontrava a soleira e o outro encontrava a saia, que
   estão em alturas diferentes, e só um dos lados tinha transição. Agora os dois
   lados são filete, do mesmo raio, e a diferença de altura entre soleira e saia
   aparece onde ela é de verdade — no corpo, longe da boca do arco. */
export function parteDeBaixo(c) {
  const eixoDianteiro = c.entreEixos / 2, eixoTraseiro = -c.entreEixos / 2;
  const frente = eixoDianteiro + c.balancoDianteiro, tras = eixoTraseiro - c.balancoTraseiro;
  const raioDoArco = c.roda.raio + c.arco.folga;
  const centroDaSoleira = 0;

  const dianteiro = arcoDeRoda({
    centroDaRoda: [eixoDianteiro, c.roda.raio], raioDoArco,
    alturaDaFrente: c.saia.altura, alturaDeTras: c.soleira.altura,
    ateFrente: frente - c.saia.recuoDaPonta, ateTras: centroDaSoleira,
    raioDoFilete: c.arco.raioDoFilete,
  });
  const traseiro = arcoDeRoda({
    centroDaRoda: [eixoTraseiro, c.roda.raio], raioDoArco,
    alturaDaFrente: c.soleira.altura, alturaDeTras: c.saia.altura,
    ateFrente: centroDaSoleira, ateTras: tras + c.saia.recuoDaPonta,
    raioDoFilete: c.arco.raioDoFilete,
  });

  /* Amostrar e ordenar da frente para trás. A cadeia sai da maker.js sem
     direção garantida — arco anti-horário vem invertido — então a ordem é
     imposta aqui, uma vez, em vez de cada consumidor adivinhar. */
  const trechos = [
    ['parachoque-dianteiro', [[frente, c.nariz.alturaDoParachoque], [frente, c.saia.altura]]],
    ['saia-dianteira', amostrar(dianteiro.paths.linhaDaFrente)],
    ['filete-antes-do-arco-dianteiro', amostrar(dianteiro.paths.fileteDaFrente, 8)],
    ['arco-dianteiro', amostrar(dianteiro.paths.arco, 28)],
    ['filete-depois-do-arco-dianteiro', amostrar(dianteiro.paths.fileteDeTras, 8)],
    ['soleira-dianteira', amostrar(dianteiro.paths.linhaDeTras)],
    ['soleira-traseira', amostrar(traseiro.paths.linhaDaFrente)],
    ['filete-antes-do-arco-traseiro', amostrar(traseiro.paths.fileteDaFrente, 8)],
    ['arco-traseiro', amostrar(traseiro.paths.arco, 28)],
    ['filete-depois-do-arco-traseiro', amostrar(traseiro.paths.fileteDeTras, 8)],
    ['saia-traseira', amostrar(traseiro.paths.linhaDeTras)],
    ['parachoque-traseiro', [[tras, c.saia.altura], [tras, c.traseira.alturaDoParachoque]]],
  ];

  const saida = [];
  for (const [nome, pontos] of trechos) {
    const ordenado = pontos[0][0] >= pontos[pontos.length - 1][0] ? pontos : [...pontos].reverse();
    ordenado.forEach(([z, y], i) => {
      const ultimo = saida[saida.length - 1];
      if (ultimo && Math.hypot(ultimo.z - z, ultimo.y - y) < 1e-6) return;
      saida.push({ nome: i === 0 ? nome : `${nome}-${i}`, z, y });
    });
  }
  return saida;
}
