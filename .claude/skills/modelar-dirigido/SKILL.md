---
name: modelar-dirigido
description: Modelar forma 3D num laço em que o usuário julga e a IA executa — ele corrige em linguagem comum ("o teto está baixo", "o arco está quadrado") e a IA mexe na grandeza com nome correspondente. Use quando o alvo for carroceria, carenagem, invólucro ou qualquer forma cuja qualidade é estética. Não use para peça mecânica cuja correção é funcional e medível.
---

# Modelar dirigido pelo usuário

Esta skill descreve um laço de trabalho, não um pipeline de receita. Se o alvo
for uma peça com `PASSOS` e critério funcional, use `../criar-peca/SKILL.md`.

## A divisão de trabalho

**Quem decide se está bom é o usuário.** Não é um gate, não é uma métrica, não é
um crítico automático, não é você.

Você faz a outra metade: traduz a correção dele em alteração no modelo e devolve
o que dá para olhar. Você pode e deve dizer o que observou, o que suspeita e o
que quebrou — mas a frase "está bom" é dele.

Isso não é modéstia de protocolo. Seis tentativas anteriores neste repositório
falharam com a IA no papel de juiz, e o registro está em
`docs/mecanifica/GOTCHAS-AUTORIA-VISUAL.md`.

## Regra zero — abrir o alvo ANTES de chutar

Antes da primeira forma, abra a referência e olhe. Depois de cada rodada,
sobreponha o seu contorno no dela e olhe de novo. A sobreposição é parte do
laço, não uma conferência que se faz quando lembra.

**A desculpa que parece boa e não é:** "não vou copiar os números da referência,
senão a prova fica fácil". Não copiar número é razoável. Não *olhar* não é — e
esse raciocínio já foi usado neste repositório para justificar exatamente o erro
que ele deveria evitar. O resultado foi um carro genérico inventado de cabeça,
apresentado como se fosse o alvo, com o alvo fechado na gaveta o tempo todo.

Se a referência é imagem, abra a imagem. Se é coordenada medida, desenhe a
coordenada e olhe o desenho. Nunca raciocine sobre uma referência que você não
pôs na tela nesta sessão.

E declare, em voz alta, **que carro você está fazendo**. Se você não consegue
dizer, o usuário também não consegue julgar — ele fica corrigindo detalhe de um
objeto cujo destino ninguém declarou.

## Roteiro de inspeção — uma estação de cada vez

O conjunto serve para julgar proporção. Ele **não** serve para achar defeito
local, e olhar o conjunto procurando defeito local é como esta investigação
perdeu rodadas: todo defeito que apareceu — o gancho no encontro do arco com a
soleira, a barriga no fundo à frente da roda, o degrau da soleira reta — foi
achado ampliando um pedaço; nenhum foi achado olhando o carro inteiro.

Então não olhe o carro inteiro procurando erro. Rode o roteiro: uma estação por
vez, ampliada, com o alvo por baixo, cada uma respondendo a UMA pergunta. A
ordem é fixa e é a do usuário, para que nada seja pulado por conveniência.

`autoria-assistida/experimentos/modelagem-dirigida/inspecionar.mjs` gera uma
imagem por estação; `roteiro.mjs` declara as estações e a pergunta de cada uma,
com a janela derivada das grandezas — assim ela acompanha o carro quando ele
muda.

Relate estação por estação, com o nome dela. "Achei um defeito na traseira" não
é relato; "porta-malas: é uma rampa, não tem parte plana" é.

## As três regras

### 1. Proporção se julga na lateral e na superior

A isométrica **não** vale como prova de proporção. Ela sombreia o flanco e dá
profundidade, e a leitura preenche volume que não existe na malha. Um objeto que
era uma tábua plana com dois entalhes quadrados foi lido como tendo nariz,
para-brisa e traseira — por mim, olhando só a isométrica.

Mande sempre lateral e superior. A isométrica entra depois, e serve para achar
defeito de superfície, não para decidir proporção.

Vista individual, grande. Mosaico só indexa; ele não é a prova.

### 2. Alteração é por nome, nunca por coordenada

O usuário fala em português: *"o teto está baixo"*, *"o arco está quadrado"*,
*"o nariz está comprido demais"*. Cada uma dessas frases precisa cair numa
grandeza com nome dentro do modelo.

Se a frase não tem nome correspondente, **criar o nome é a entrega da rodada**.
Não improvise mexendo em vértice: foi assim que todas as tentativas anteriores
terminaram em tabela de números digitados à mão, que ninguém consegue conferir
olhando.

O exemplo vivo está em
`autoria-assistida/experimentos/prova-cage-quarto-dianteiro/quarto-dianteiro.mjs`:
a seção é `centro`, `crista`, `bojoDoCapo`, `larguraMax`,
`alturaDaLarguraMax`, `soleira` — não oitenta coordenadas. E
`alteracao-local.mjs` altera por **nome de loop**, não por lista de vértices.

### 3. Uma rodada muda uma coisa

Duas mudanças juntas escondem qual delas estragou o resto. Se o usuário pedir
três coisas, faça as três — mas devolva dizendo qual grandeza mudou em cada uma,
para ele saber onde reclamar.

## O laço

0. O alvo está aberto na tela. Se não estiver, abra antes de qualquer coisa.
1. O usuário aponta o defeito em linguagem comum.
2. Você identifica a grandeza. Se não existir, cria — e diz que criou.
3. Você altera **só** aquilo.
4. Você devolve lateral e superior, individuais e grandes. Isométrica quando a
   pergunta for de superfície. **Malha (fio) quando a forma surpreender**: o fio
   conta como o objeto foi construído e costuma prever o defeito.
5. Você relata: o que mudou, o que você observou, o que ainda te parece errado.
   Sem veredito de aprovação.
6. Você sobrepõe o seu contorno no do alvo e relata o que a sobreposição
   mostra, inclusive o que o usuário não perguntou.
7. O usuário julga. A rodada fecha na frase dele.

## Antes de mandar a imagem

Duas conferências rápidas, porque as duas já custaram rodadas aqui:

- **A imagem está inteira?** Vistas cortadas ou comprimidas já foram mandadas
  três rodadas seguidas neste repositório enquanto a reclamação era descartada
  como ruído. Abra o arquivo e olhe antes de mandar.
- **As normais estão consistentes?** Face invertida produz sintoma longe da
  causa. `validarCage` em `prova-cage-quarto-dianteiro/cage.mjs` tem a regra de
  orientação; use-a.

## O que não fazer

- Não relate ângulo, desvio, percentil ou qualquer número como se aprovasse
  forma. Métrica de malha mede densidade de malha; está registrado em V-08.
- Não conclua sobre proporção pela isométrica.
- Não trate ausência de reclamação como aprovação.
- Não produza forma antes de ter aberto o alvo. Não invente proporção "de
  cabeça" quando existe referência disponível.
- Não junte "está melhor" com "está bom". A primeira você pode dizer; a segunda
  não é sua.

## Onde este laço está descrito como plano

`docs/mecanifica/planos/2026-08-26-modelagem-dirigida-pelo-usuario.md`, com as
fatias, as condições de parada e o que foi herdado do plano congelado.
