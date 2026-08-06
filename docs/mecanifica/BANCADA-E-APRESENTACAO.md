# Bancada e apresentação

## Papel atual

`bancada.html` é a única aplicação publicada deste repositório. Hoje ela abre
uma peça isolada, mede o neutro, mostra vistas canônicas e registra uma URL
reproduzível.

A apresentação do cliente pertence a
[`warbookbr/mecanica`](https://github.com/warbookbr/mecanica). A bancada não é a
cena do produto: é uma superfície de atenção, inspeção e prova para a autoria.

## Consulta atual

A bancada mostra hierarquia informativa, partes, grupos e portas da peça
carregada. Seleção semântica, isolamento, contexto fantasma, explosão e consulta
de subárvore já existem. A régua e o painel de portas respondem ao conteúdo
executado, não a uma constante global.

O isolamento atual reduz ruído visual, mas não deve ser interpretado como modelo
de montagem persistida. A bancada ainda não possui um mapa canônico de carro,
motor ou sistema composto.

## Direção para sistemas compostos

Quando montagens recursivas existirem, a bancada deve continuar sendo a camada
visual de inspeção. Ela não deve virar a fonte de verdade da composição.

O contexto de inspeção precisa separar:

1. **alvo de edição** — entidade que pode ser alterada;
2. **contexto visual** — entidades mostradas somente para comparação;
3. **dependências afetadas** — relações e montagens que precisam ser
   revalidadas;
4. **vistas e medições obrigatórias** — prova mínima da tarefa.

A IA deve conseguir pedir contextos como:

```text
somente a roda
roda + cubo
roda + eixo
capô + dobradiças
pistão + biela + virabrequim
motor + cofre do motor
suspensão + roda + caixa de roda
```

Mostrar apenas roda e eixo não pode apagar o fato de que ambos pertencem a
montagens maiores. Isolamento visual reduz o que aparece na imagem; não remove
relações, dependências nem obrigações de validação.

A seleção futura deve aceitar peça, montagem, parte interna, subárvore e conjunto
arbitrário de entidades relacionadas, sempre por identidade semântica estável.

## Revisão visual

Use as quatro vistas canônicas quando o pacote exigir revisão. Leia os PNGs,
confira enquadramento, corte, legibilidade, proporção e identidade. `porteiro`
verifica abertura, erros de página e quadro degenerado. `revisar:modelagem`
conserva revisões recusadas e promovidas sem criação manual de evidência.

Para sistemas compostos, a revisão visual precisa ocorrer em mais de uma escala:

- peça isolada;
- interfaces importantes em pares ou pequenos conjuntos;
- montagem local;
- contexto maior quando proporção ou interferência depender dele.

Uma imagem bonita não prova encaixe. Vistas complementam medidas de dimensão,
centro, eixo, folga, contato e interferência.

## Limites atuais

A bancada ainda não:

- persiste montagem;
- deriva contexto de um mapa de dependências;
- resolve encaixes;
- valida movimento ou espaço varrido;
- distingue formalmente alvo editável de contexto somente leitura;
- publica alterações de receita ou montagem.

O servidor estático local ainda não resolve o import bare `earcut`; não contorne
isso alterando câmera ou peça.

## Critério de saída atual

Uma peça só é levada ao produto depois de passar estado, identidade, exportação,
gates de câmera e portas, medições aplicáveis e leitura visual. O produto do
cliente não carrega a linguagem de autoria.

Quando montagens persistidas existirem, o critério também deverá exigir
revalidação das relações e dos dependentes afetados. Essa capacidade ainda não
está implementada.

A definição ampla está em [`AUTORIA-IA.md`](AUTORIA-IA.md), e a direção das
montagens em [`MONTAGENS-SEMANTICAS.md`](MONTAGENS-SEMANTICAS.md).