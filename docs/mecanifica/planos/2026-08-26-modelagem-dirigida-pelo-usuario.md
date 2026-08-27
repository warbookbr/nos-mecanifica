# Modelagem dirigida pelo usuário

**Estado:** ativo
**Responsável:** Claude · **Base:** `bb2e79a`
**Substitui:** [`congelados/2026-08-25-modelador-inverso-priors-familia.md`](congelados/2026-08-25-modelador-inverso-priors-familia.md)
**Skill do laço:** [`../../../.claude/skills/modelar-dirigido/SKILL.md`](../../../.claude/skills/modelar-dirigido/SKILL.md)

## Objetivo verificável

Um cupê completo que o usuário aceite, produzido por um laço em que ele corrige
em linguagem comum e a IA executa a correção. O aceite é dele, dito por escrito,
sobre vistas individuais grandes. Não existe métrica que aprove forma neste
plano.

## Por onde começar

[`GOTCHAS-AUTORIA-VISUAL.md`](../GOTCHAS-AUTORIA-VISUAL.md), depois este plano,
depois a skill do laço. Código que não se reescreve:
`autoria-assistida/experimentos/prova-cage-quarto-dianteiro/` (cage, compilação,
subdivisão, alteração por nome, render), `tools/mecanifica/olhar.mjs`,
`tools/mecanifica/comparar-alvo.mjs`, `tools/mecanifica/recortar-regioes-n6.mjs`
e `src/autoria/qualificacao-alvo.js`.

## A mudança de divisão de trabalho

Seis tentativas anteriores pediram que a IA produzisse **e** julgasse a forma.
Produzir ela faz de modo aceitável quando tem onde encostar; julgar, não — e o
plano anterior gastava sua primeira fase inteira tentando provar o contrário.

Aqui as duas tarefas são separadas por dono:

| tarefa | dono | evidência de que funciona |
| --- | --- | --- |
| decidir se está bom | usuário | ele diz, por escrito, na rodada |
| executar a correção pedida | IA | a vista seguinte mostra o que ele pediu |

Consequência direta: a calibração cega de crítico sai do caminho crítico. Ela
fica congelada junto com o plano anterior, com condição de retorno escrita lá.

## O que este plano herdou do plano congelado

- classificação de alvo em `direcao-estetica`, `alvo-geometrico` e
  `indeterminado`, para não tentar encaixe milimétrico num desenho que não
  sustenta isso;
- julgar **cada vista separada e grande**; mosaico só indexa;
- os recortes regionais N6, já construídos e ainda não usados.

## Invariantes do laço

- **A IA nunca declara a forma boa.** Ela relata o que mudou e devolve vistas.
  Aprovar é ato do usuário.
- **Proporção se julga na lateral e na superior.** A isométrica não vale como
  prova de proporção: ela sombreia o flanco e a leitura preenche volume que não
  existe. Foi assim que a Ferrari livre passou por boa numa auditoria.
- **Toda alteração é por nome**, nunca por vértice ou coordenada solta. Se o
  usuário pede algo que não tem nome no modelo, o nome é criado antes da
  alteração — e isso é a entrega da rodada, não um detalhe.
- **A malha vai junto quando a forma surpreender.** O fio conta como o objeto
  foi construído e prevê o defeito antes de ele aparecer.
- **Contorno é reta, arco e filete**, não ponto solto. Onde uma reta encontra um
  arco é resolvido, nunca digitado. Acrescentar mais um ponto para tirar um
  sintoma é remendo, e foi o que consumiu as primeiras rodadas de D0.
- **Uma rodada muda uma coisa.** Duas mudanças juntas escondem qual delas
  estragou o resto.
- Determinismo, identidade semântica, núcleo sem Three.js e gates do INDEX
  continuam valendo; nada aqui afrouxa contrato existente.

## Base de partida

`prova-cage-quarto-dianteiro` é a base, e por um motivo verificado: sua seção já
é feita de grandezas com nome — `centro`, `crista`, `bojoDoCapo`, `larguraMax`,
`alturaDaLarguraMax`, `soleira` — e não de coordenadas digitadas. Foi a única
peça da investigação que o usuário classificou como aceitável, e a razão
provável é exatamente essa: as correções dele tinham onde encostar.

Ela saiu de `rascunhos-defeituosos/` nesta abertura. Enquanto estava lá, o README
daquela pasta a declarava explicitamente inelegível como base de nova autoria —
o que teria bloqueado este plano em silêncio.

A Ferrari livre **não** é base: é um perfil arrastado ao longo de um caminho, e
uma cabine exige a seção mudar de natureza no meio. "Eleve o para-brisa" não tem
onde pegar naquela malha.

## Fatias

Cada fatia termina com uma frase do usuário, não com um número.

### D0 — vocabulário do carro inteiro

Estender as grandezas com nome do quarto dianteiro para o corpo completo:
entre-eixos, balanço dianteiro e traseiro, altura e recuo do para-brisa, altura e
comprimento do teto, queda da traseira, centro e raio dos arcos, altura da
soleira. Gerar a primeira lateral e a primeira superior.

**Fecha quando:** o usuário consegue pedir uma correção qualquer e a IA sabe em
qual grandeza mexer, sem inventar.

**Para se:** aparecer correção pedida em português que não tem grandeza
correspondente e não dá para criar uma sem refazer a estrutura.

### D1 — proporção pela silhueta

Iterar só a silhueta, sem detalhe de superfície, até o carro inteiro ler como
carro em lateral e superior. Sem arco redondo, sem vinco, sem fáscia.

**Fecha quando:** o usuário diz que a proporção está certa.

**Para se:** dez rodadas sem o usuário reconhecer avanço na proporção. Isso
significa que o vocabulário de D0 está errado, não que a forma é difícil.

### D1.5 — o contorno migra para reta-arco-filete

A parte de baixo — saia, arco de roda, soleira — vira cadeia de retas, arcos e
filetes. A parte de cima permanece curva livre até haver prova de que a mesma
construção a serve; enquanto isso, ela é o trecho suspeito na inspeção.

**Fecha quando:** o roteiro passa nas estações dos dois arcos e do fundo sem
achar laço, degrau nem barriga.

**Para se:** a construção por arcos não conseguir representar uma correção que o
usuário pediu. Isso significaria que o vocabulário e a representação brigam, e a
decisão volta para ele.

### D2 — arcos e volume

Arco de roda redondo, para-lama com volume, ombro, recolhimento da soleira.
Entram aqui porque dependem da proporção já resolvida: o arco cai onde a roda
está, e a roda está onde a proporção pôs.

**Fecha quando:** o usuário aceita a lateral e a frontal.

### D3 — regiões

Só agora os recortes regionais N6 entram. Cada região é refinada contra seu
próprio recorte, sobre a mesma carroceria contínua — a região não vira peça
independente.

**Fecha quando:** o usuário aceita cada região e o conjunto continua o mesmo
carro.

### D4 — entrega editável

O carro sai com suas grandezas com nome preservadas, reexecutável e alterável
pela mesma linguagem que o construiu. Registro do que foi pedido e do que foi
mexido, rodada a rodada.

**Fecha quando:** uma alteração nova, pedida em português, é aplicada sem tocar
em coordenada.

## Condição de parada do plano inteiro

Se D1 não fechar, este plano para e a decisão volta ao usuário — com o plano
congelado como alternativa já escrita. Parar em D1 é resultado, não fracasso:
significa que proporção não se resolve por vocabulário, e isso é informação que
nenhuma das seis tentativas anteriores produziu.

## Registro

Cada rodada anexa: o que o usuário pediu, qual grandeza mudou, as vistas
devolvidas e o veredito dele. Sem veredito, a rodada fica aberta; ela não
avança por decurso nem por medida.
