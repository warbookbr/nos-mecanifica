# Visão da Mecanifica

## Duas camadas do projeto

A Mecanifica possui duas camadas relacionadas, mas com responsabilidades
diferentes:

- **autoria**, neste repositório: a IA cria, organiza, inspeciona, mede e evolui
  peças e sistemas mecânicos;
- **produto do cliente**, em
  [`warbookbr/mecanica`](https://github.com/warbookbr/mecanica): o conteúdo
  resolvido é apresentado de forma interativa para explicar um sistema ou um
  diagnóstico.

A autoria não deve ser limitada pelo formato da apresentação atual. O produto
não deve carregar toda a complexidade do núcleo de autoria.

## A frase do produto

Uma experiência 3D interativa que transforma um diagnóstico mecânico em algo
que o cliente consegue ver, explorar e compreender.

## A frase da autoria

Uma oficina procedural para que uma IA construa e mantenha máquinas complexas
como peças editáveis e montagens recursivas, com identidade, relações, medição e
inspeção reproduzível.

## O problema do produto

Explicar um defeito automotivo costuma depender de vocabulário técnico, peças
escondidas e confiança. Fotos isoladas e descrições verbais mostram o dano, mas
raramente mostram o sistema funcionando, a progressão da falha ou a razão do
reparo.

A Mecanifica deve permitir que a oficina apresente:

- como o sistema funciona em condição normal;
- qual componente apresentou problema;
- como o defeito altera o funcionamento;
- o que pode acontecer se o reparo for adiado;
- o que a substituição ou manutenção corrige.

## O problema da autoria

Uma IA pode produzir uma peça ou uma imagem 3D sem produzir um sistema que
continue compreensível e editável. Quanto maior o objeto, maior o risco de virar
uma massa única, difícil de localizar, alterar, reutilizar e validar.

A autoria deve permitir que a IA:

- crie a definição geométrica de uma peça;
- organize peças em montagens;
- componha montagens dentro de montagens maiores;
- trabalhe em um alvo reduzido sem esquecer dependências;
- escolha quais componentes precisa ver juntos;
- medir relações e encaixes;
- comparar revisões;
- corrigir uma alteração e revalidar os conjuntos afetados.

## Horizonte de autoria

A progressão desejada é:

1. peças automotivas isoladas;
2. pequenos conjuntos mecânicos;
3. sistemas automotivos completos;
4. um carro inteiro composto por sistemas e conjuntos;
5. depois que esse modelo estiver maduro, robôs e outras máquinas compostas.

Um carro não deve ser uma única receita. Um motor também não. A unidade
geométrica editável é a peça; a unidade de composição é a montagem. Montagens
podem conter outras montagens.

A IA deve conseguir isolar visualmente uma roda, um capô ou um pistão e também
mostrar pequenos conjuntos relacionados, como roda + eixo ou pistão + biela +
virabrequim. O isolamento reduz o ruído visual, mas não remove o contexto
estrutural nem as relações que precisam ser revalidadas.

O mapa de composição, relações e dependências deve ser dado estruturado do
sistema. Documentação e diagramas podem ser gerados a partir desse mapa, mas não
podem ser sua única fonte de verdade.

A definição detalhada está em [`AUTORIA-IA.md`](AUTORIA-IA.md) e
[`MONTAGENS-SEMANTICAS.md`](MONTAGENS-SEMANTICAS.md).

## Primeira experiência do produto

O primeiro módulo é um freio a disco dianteiro genérico e didático dentro de um
galpão de oficina. O conjunto inclui cubo, disco, pinça, suporte, pistão,
pastilhas, flexível e uma roda simplificada.

A experiência deve permitir caminhar pelo galpão, aproximar-se da bancada,
selecionar o conjunto e entrar em um modo de inspeção. Nesse modo, o usuário pode
girar a câmera, destacar partes, explodir o conjunto e comparar estados:

1. funcionamento normal;
2. desgaste progressivo da pastilha;
3. limite de segurança;
4. contato metal com metal;
5. risco ao disco e perda de eficiência;
6. resultado após o reparo.

Esse primeiro módulo prova uma fatia do produto. Ele não define o teto da
autoria e não exige construir um carro completo antes que as capacidades de
peça, montagem e validação estejam maduras.

## Princípios

- **Didático sem ser enganoso.** Simplificar a apresentação, não a causalidade.
- **Interativo.** A pessoa explora, compara e controla o ritmo da explicação.
- **Visual primeiro.** Texto apoia a demonstração; não tenta substituí-la.
- **Sem diagnóstico inventado.** A aplicação comunica um diagnóstico fornecido
  pela oficina; ela não diagnostica o veículo sozinha.
- **Genérico antes de específico.** O primeiro freio ensina o sistema. Versões de
  veículos reais exigirão medidas e fontes técnicas próprias.
- **Acessível.** O produto deve funcionar no navegador, em computador e celular,
  sem instalação.
- **Autoria nativa para IA.** A IA cria e refina conteúdo estruturado, legível e
  verificável, não apenas uma malha final.
- **Peça não é montagem.** Receitas geram peças; montagens organizam peças e
  outras montagens.
- **Trabalho local com contexto preservado.** A IA pode reduzir o que vê, mas não
  perder relações e dependências.
- **Mapa como dado.** Composição e relações não vivem apenas em prosa.
- **Validação em camadas.** Medição, contratos mecânicos e inspeção visual se
  complementam.
- **Controle amplo, escrita rigorosa.** A IA deve conseguir expressar a mudança,
  mas estado inválido ou parcial não pode ser publicado.
- **MCP é uma porta, não o projeto.** MCP, CLI ou API podem expor capacidades;
  nenhuma dessas opções substitui o núcleo ou o modelo de montagem.
- **Capacidade antes da peça.** Uma peça é evidência e bancada de prova; o
  produto deste repositório é a capacidade de uma IA criar, revisar e evoluir
  conteúdo com segurança.
- **Avanço comprovado, não inércia comprovada.** Homologar o que já existe serve
  para descobrir limites, regressões e próximos ganhos. Um resultado verde não
  encerra a busca por melhoria.

## Limites atuais

- Não é um manual oficial de reparação.
- Não substitui inspeção, medição ou responsabilidade do profissional.
- Não promete física de engenharia em tempo real.
- Não depende de servidor próprio; a experiência publicada roda no GitHub Pages.
- Não exige um carro completo para provar o primeiro sistema.
- Ainda não existe montagem recursiva persistida, mapa completo de dependências,
  solver geral de encaixe ou camada de escrita completa para IA.

## Sinal de que a primeira etapa do produto deu certo

Um mecânico consegue abrir um link no celular, mostrar o conjunto de freio ao
cliente e conduzir uma explicação clara de desgaste e consequência sem precisar
traduzir mentalmente uma imagem técnica estática.

## Sinal de que a direção de autoria está funcionando

Uma IA consegue criar uma peça, colocá-la em um pequeno conjunto, selecionar o
alvo e o contexto relevante, medir as relações, alterar a peça e descobrir com
clareza quais montagens continuaram válidas e quais precisam de correção.