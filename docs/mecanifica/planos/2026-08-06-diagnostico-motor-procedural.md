# Diagnóstico do motor procedural atual

**Estado:** ativo

**Responsável:** IA revisora, com decisão final registrada pelo mantenedor

**Repositório e base:** `warbookbr/nos-mecanifica`, branch criada a partir de `main`

## Por que esta é a etapa atual

A direção de autoria já estabelece peça como unidade geométrica editável e
montagem como composição recursiva. Antes de definir o primeiro formato de
montagem, uma camada de escrita ou novas ferramentas para agentes, é necessário
compreender o contrato real do motor que hoje resolve as receitas de peças.

Projetar montagem ou autoria acima de uma leitura incompleta do motor pode:

- duplicar capacidades que já existem;
- apoiar-se em identidades ou saídas menos estáveis do que parecem;
- levar conceitos de montagem para dentro do núcleo geométrico sem necessidade;
- preservar acoplamentos que bloqueiam peças mais complexas;
- corrigir sintomas na bancada ou no MCP quando a limitação está no motor;
- refatorar partes sólidas sem evidência de ganho.

Este plano abre somente um diagnóstico técnico. Ele não autoriza implementar a
montagem mínima, reescrever o motor ou acrescentar escrita ao MCP.

## Pergunta central

> **Qual é o contrato real do motor procedural atual, qual é seu teto para a
autoria de peças mecânicas e o que precisa — ou não precisa — mudar antes da
primeira montagem persistida?**

## Resultado verificável

Produzir um diagnóstico sustentado por código, receitas, testes e execuções que
responda, sem depender apenas da documentação existente:

1. qual entrada o motor aceita de fato;
2. como parâmetros, passos, referências e estado percorrem a execução;
3. qual saída neutra ele produz e quais garantias essa saída oferece;
4. como identidade, partes, portas, materiais, origens e diagnósticos são
   preservados;
5. quais operações e combinações geométricas funcionam de forma sólida;
6. quais limites são locais e quais são estruturais;
7. quais suposições internas tratam a execução como uma única peça;
8. quais capacidades uma futura montagem pode consumir sem alterar o motor;
9. quais bloqueios precisam ser resolvidos antes da montagem mínima v1;
10. o que deve permanecer fora do motor e pertencer ao resolvedor de montagem,
    à bancada ou às portas de acesso da IA.

O encerramento deve classificar cada achado como:

- **PRESERVAR** — capacidade sólida que sustenta a arquitetura futura;
- **DOCUMENTAR** — comportamento válido cujo contrato ainda está implícito;
- **REFATORAR** — estrutura comprovadamente bloqueadora ou frágil;
- **ADIAR** — problema real que não impede o próximo recorte.

## Escopo de leitura

O diagnóstico deve cobrir, no mínimo:

### Núcleo e auxiliares

- `prototipos/fps/v3/motor/oficina.js`;
- módulos auxiliares importados pelo núcleo;
- resolução de expressões, parâmetros, topologia e referências;
- criação, transformação, combinação e finalização da malha neutra;
- emissão de identidade, partes, grupos, portas, materiais e diagnósticos.

### Receitas representativas

Selecionar poucas receitas que, juntas, exercitem capacidades diferentes:

- uma peça estrutural simples;
- uma peça com furos ou operações de remoção;
- uma peça de revolução ou perfil;
- uma peça com arranjo, espelho ou repetição;
- uma peça com partes e portas relevantes;
- uma das peças mais complexas atualmente publicadas.

A seleção deve ser justificada pelas capacidades exercitadas, não por preferência
visual.

### Consumidores da saída

- adaptadores da bancada;
- descritor de peça;
- exportação resolvida;
- revisão e comparação;
- gates de identidade, portas, câmera e inspeção;
- perfil MCP de leitura, somente para identificar quais dados ele consome.

O MCP não será tratado como arquitetura do motor.

## Eixos de análise

### 1. Contrato de entrada

Registrar:

- formatos de receita realmente aceitos;
- campos obrigatórios, opcionais e derivados;
- comportamento de `PARAMS`, `TOPO`, `PASSOS`, `MATERIAIS`, `ALIASES` e `meta`;
- referências entre passos e entidades;
- valores padrão e coerções;
- momento em que entradas inválidas falham;
- comportamentos aceitos pelo código, mas não declarados no contrato.

### 2. Fluxo interno

Reconstruir o percurso:

```text
receita
→ normalização e parâmetros
→ execução dos passos
→ criação e transformação da geometria
→ resolução de referências e seleções
→ identidade, partes, materiais e portas
→ validações e diagnósticos
→ malha neutra
```

Identificar:

- estado mutável compartilhado;
- dependência da ordem dos passos;
- mutações difíceis de rastrear;
- referências posicionais ou aliases frágeis;
- acoplamentos entre geometria, identidade e apresentação;
- tratamento de falhas parciais;
- pontos em que uma futura instância ou referencial externo seria confundido
  com geometria da peça.

### 3. Contrato de saída

Inventariar e provar o que a saída contém:

- vértices, faces e demais dados geométricos;
- coordenadas e origem local;
- identidades estáveis;
- partes, grupos e hierarquia;
- portas e interfaces;
- materiais declarados;
- medidas, caixas ou regiões ocupadas;
- diagnósticos e proveniência;
- dados usados apenas pelo renderizador;
- dados necessários para uma futura montagem, mas ainda ausentes.

### 4. Capacidade geométrica real

Separar operação existente de operação confiável. Para cada família relevante,
registrar:

- formas que expressa bem;
- combinações já cobertas por testes;
- limites conhecidos;
- necessidade de truques nas receitas;
- perda de identidade ou seleção;
- risco de faces inválidas, costuras, ambiguidade ou órfãos;
- custo de edição para a IA.

O objetivo não é criar um catálogo exaustivo de todas as funções, mas determinar
o teto atual para peças mecânicas progressivamente mais complexas.

### 5. Fronteira com montagem

Responder com evidência:

- se a peça resolvida já está corretamente em coordenadas locais;
- se origem, portas e identidade bastam para instanciá-la externamente;
- se transformações de montagem podem ficar integralmente acima do motor;
- se o motor assume uma única peça em pontos que impedem composição;
- quais dados devem ser adicionados ao contrato de saída, caso faltem;
- quais conceitos não devem entrar no motor: composição, dependências,
  contexto de trabalho, revalidação entre peças e navegação da montagem.

A hipótese inicial, a ser confirmada ou rejeitada, é:

```text
motor de peça
  resolve uma peça em coordenadas locais

resolvedor de montagem
  instancia peças e montagens
  aplica transformações externas
  mantém relações e dependências

bancada
  observa peças e montagens resolvidas
```

## Método

1. Ler o contrato documental sem tratá-lo como prova suficiente.
2. Mapear funções e estruturas de dados do núcleo.
3. Seguir uma receita simples de ponta a ponta.
4. Seguir receitas representativas de capacidades diferentes.
5. Comparar a saída consumida pela bancada, descritor, exportador e revisão.
6. Executar testes e comandos existentes que provem comportamento.
7. Criar apenas provas diagnósticas temporárias quando os testes atuais não
   responderem uma pergunta; essas provas não entram na `main` por implicação.
8. Registrar contradições entre código, testes e documentação.
9. Classificar achados em preservar, documentar, refatorar ou adiar.
10. Encerrar com uma recomendação objetiva para o próximo plano.

## Evidências obrigatórias

O relatório final deve conter:

- diagrama textual do fluxo real;
- tabela dos principais dados de entrada e saída;
- lista das receitas examinadas e motivo da seleção;
- exemplos concretos de pelo menos um caminho sólido e um limite real;
- referência a funções, arquivos e testes que sustentam cada achado importante;
- distinção entre comportamento observado, inferência e hipótese;
- lista dos bloqueios anteriores à montagem mínima;
- lista explícita do que não precisa mudar antes da montagem;
- recomendação final entre:

```text
motor adequado
→ abrir plano da Montagem Mínima Persistida v1

ajustes localizados necessários
→ abrir plano curto para os bloqueios comprovados

limitação estrutural comprovada
→ redefinir o contrato do motor antes da montagem
```

## Arquivos reservados

Durante esta etapa, mudanças persistidas ficam limitadas a documentação do
próprio diagnóstico:

- este plano;
- `docs/mecanifica/planos/README.md`;
- `docs/mecanifica/INDEX.md`;
- `docs/uso/MAPA.md`, somente quando regenerado pelo gate;
- um futuro relatório de diagnóstico, em caminho declarado antes de sua criação;
- fechamento deste plano.

Código do motor, receitas, bancada, ferramentas, testes e contratos não estão
reservados para alteração. Achados nesses arquivos devem ser registrados, não
corrigidos silenciosamente.

## Incluído

- leitura estática do motor e auxiliares;
- rastreamento de dados por receitas reais;
- execução dos testes e gates existentes;
- provas temporárias e descartáveis de comportamento;
- comparação entre código, testes e documentação;
- identificação de capacidades, limites, acoplamentos e lacunas;
- recomendação do próximo plano.

## Excluído

- refatorar `oficina.js` ou seus auxiliares;
- criar operações geométricas;
- corrigir `lathe`, `earcut`, materiais ou outras pendências;
- alterar receitas existentes;
- criar montagem persistida;
- criar resolvedor ou mapa de montagens;
- implementar escrita para IA;
- mudar MCP, CLI ou API;
- otimizar desempenho sem um problema medido;
- renomear ou reorganizar arquivos apenas por preferência;
- transformar hipóteses em arquitetura antes da prova.

## Invariantes

- o diagnóstico não muda geometria publicada;
- nenhuma receita é regravada;
- o gabarito das peças permanece intacto;
- identidade, portas e revisões existentes não mudam;
- o motor continua independente de Three.js;
- o domínio automotivo não entra como caso especial no núcleo;
- carro e motor continuam definidos como montagens, não receitas únicas;
- MCP continua sendo porta opcional, não critério arquitetural;
- um achado não autoriza correção fora de um plano posterior.

## Gates da etapa documental

Antes de integrar a abertura deste plano:

```text
npm run mapa
npm run mapa:check
npm run docs:toc:check
npm run docs:links:check
npm run planos:check

git diff --check
```

## Gate de saída do diagnóstico

O plano só pode ser encerrado quando:

1. as dez perguntas do resultado verificável estiverem respondidas;
2. entrada, fluxo interno e saída estiverem descritos com evidência;
3. houver separação clara entre limites locais e estruturais;
4. cada achado estiver classificado;
5. a fronteira proposta entre motor, montagem, bancada e acesso da IA tiver sido
   confirmada, corrigida ou rejeitada;
6. existir recomendação única para o próximo plano;
7. nenhuma implementação corretiva estiver misturada ao diagnóstico;
8. documentação e gates estiverem verdes.

## Riscos e regra de parada

Parar e registrar antes de ampliar o escopo quando:

- o comportamento só puder ser entendido alterando código de produção;
- uma prova ameaçar modificar receitas ou revisões publicadas;
- surgir vontade de corrigir um problema antes de medir seu impacto;
- o estudo começar a desenhar montagem, MCP ou nova linguagem em vez de descrever
  o motor atual;
- o volume de funções impedir evidência útil — nesse caso, reduzir para caminhos
  representativos e declarar o que ficou sem inspeção.

## Fatias

1. **Mapa estático:** módulos, entradas, estado, operações e saída.
2. **Caminhos reais:** receitas representativas executadas de ponta a ponta.
3. **Contratos e limites:** consumidores, garantias, fragilidades e teto atual.
4. **Fronteira futura:** impacto sobre montagem e autoria pela IA.
5. **Síntese:** classificação dos achados, relatório e recomendação.
6. **Fechamento:** resultado, decisão, evidências e próximo plano candidato.

## Fechamento

A preencher somente ao concluir ou cancelar:

- estado final;
- relatório produzido;
- commit e PR;
- receitas e caminhos analisados;
- gates executados;
- achados por classificação;
- decisão sobre adequação do motor;
- próximo plano autorizado ou itens devolvidos ao backlog.
