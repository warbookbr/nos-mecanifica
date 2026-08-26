# Modelagem dirigida — D0, o vocabulário do carro inteiro

Fatia D0 do plano
[`modelagem dirigida pelo usuário`](../../../docs/mecanifica/planos/2026-08-26-modelagem-dirigida-pelo-usuario.md).
O laço está na skill `.claude/skills/modelar-dirigido/SKILL.md`.

Aqui não há superfície nem malha. Há o vocabulário do carro inteiro e as duas
silhuetas que decidem proporção: a lateral e a planta.

## Por que só silhueta

Porque proporção e superfície são problemas diferentes, e testar superfície num
objeto de proporção errada não informa nada. Das quatro carrocerias inteiras
produzidas nesta investigação, três erram proporção e a quarta erra construção;
nenhuma passa no teste de "aperte os olhos até virar mancha e veja se ainda lê
como carro".

## Por que não tem isométrica

A isométrica sombreia o flanco e dá profundidade, e a leitura preenche volume
que não existe. Nesta mesma investigação, uma tábua plana com dois entalhes
quadrados foi lida como tendo nariz, para-brisa e traseira — a partir da
isométrica. A lateral não deixa preencher nada.

## Uma rodada

```bash
node autoria-assistida/experimentos/modelagem-dirigida/ver.mjs \
  teto.altura=1380 --saida=/tmp/rodada.png
```

Sai um PNG com as duas vistas e um JSON com as grandezas daquela rodada, para
que a rodada possa ser refeita.

## O contrato do vocabulário

`VOCABULARIO` liga cada grandeza à frase em português que a aciona. Um teste
falha quando alguma grandeza fica órfã de frase — e essa falha é o sinal de que
o usuário poderia pedir algo sem a IA saber onde mexer, que é como todas as
tentativas anteriores voltaram a digitar coordenada.

`alterar(carro, 'teto.altura', 1380)` devolve um carro novo e **recusa** um
caminho que não existe, em vez de criar a grandeza em silêncio. Criar grandeza
nova é decisão de rodada, não efeito colateral.

## Os dois erros já cometidos aqui

Ambos têm teste que impede a volta:

- **meia largura misturada com largura cheia.** O nariz entrava como largura
  total no meio de meias larguras e a planta saía com cara de pé.
- **topo do arco abaixo do topo da roda.** O arco era posto em `raio + folga`
  medido do solo, mas a roda toca o solo e seu topo está em `2·raio`; a roda
  saía para fora da carroceria. O arco também virou um arco amostrado sobre o
  círculo da roda, porque com um ponto só no topo a interpolação fazia uma
  barraca pontuda.

## Estado

D0 entregue: vocabulário fechado e primeira silhueta gerada. Nenhuma proporção
foi aprovada — isso é da fatia D1, e o veredito é do usuário.
