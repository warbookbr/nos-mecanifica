# Planos congelados

Um plano congelado **não foi refutado e não foi concluído**. Ele saiu do caminho
crítico porque a decisão de rota mudou, e foi guardado inteiro para poder voltar
sem reconstrução.

Isto é diferente das outras duas situações já usadas no repositório:

| situação | onde fica | o que significa |
| --- | --- | --- |
| concluído | `../concluidos/` | executou até a decisão registrada |
| cancelado | permanece em `../` com `**Estado:** cancelado` | a premissa caiu; não volta como estava |
| congelado | aqui | a premissa continua de pé, mas outra rota foi escolhida |

Um plano congelado não conta para o gate de plano ativo — `planos:check` lê
apenas a pasta `../`, e essa exclusão é intencional.

## Regra de arquivo

Todo plano aqui precisa declarar, no cabeçalho e antes do conteúdo original:

- `**Estado:** congelado` e a data;
- **por que foi congelado**, em termos do que mudou na decisão, não em termos de
  falha do plano;
- a **condição de descongelamento**, concreta o bastante para alguém reconhecer
  quando ela acontecer;
- o que foi **levado** para o plano que o substituiu;
- o que **fica parado** junto com ele, incluindo código que continua no
  repositório sem consumidor ativo.

Sem essas cinco coisas, o plano vira arquivo morto e alguém vai reconstruir do
zero daqui a três meses.
