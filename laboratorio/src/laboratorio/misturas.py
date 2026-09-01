"""Instrumento: densidade de uma mistura pela regra das misturas.

A CONTA. Para frações em MASSA, a densidade da mistura é o inverso da média
ponderada dos inversos: 1/ρ = Σ(wᵢ/ρᵢ). Não é aproximação empírica — sai de
somar volumes. O que É aproximação está na hipótese por trás dela.

A HIPÓTESE, e ela falha de verdade: **os volumes se somam sem mudar**. Ligas reais
contradizem isso o tempo todo — átomo pequeno entra no interstício da rede do
grande e a liga fica mais densa do que a conta prevê. Em soluções sólidas
substitucionais de elementos parecidos o desvio é pequeno; em intersticiais, ou
onde se forma composto, não é. Por isso `nao_cobre` diz isso com todas as letras,
e a saída carrega o aviso: quem usar o número para decidir precisa saber que ele
supõe uma coisa que a natureza nem sempre respeita.

POR QUE ESTA CONTA COMO PRIMEIRO INSTRUMENTO DE MATERIAL. Ela tem resposta
conhecida em casos triviais: um elemento só devolve a densidade dele, e duas
densidades iguais devolvem a mesma. O canário cobra isso.

E UMA CORREÇÃO QUE O PRÓPRIO CANÁRIO IMPÔS. A primeira versão deste texto dizia
que a prova era EXATA, ao último dígito, e que por isso não dependia de
tolerância escolhida por mim. Está errado: `1/(1/7.874)` devolve 7.873999999999999,
porque o inverso do inverso não volta ao mesmo binário. A tolerância é
inevitável — mas ela é a do próprio ponto flutuante, alguns ulps, e não um número
que eu escolhi para o teste passar. A diferença entre essas duas coisas é o que
separa canário de encenação, e eu quase escrevi a segunda.
"""

from __future__ import annotations

from typing import Any

from .erros import falhar
from .instrumentos import Manifesto, Registro
from .materiais import Composicao
from .unidades import Grandeza, dimensao

INSTRUMENTO = "materiais.densidade-por-regra-das-misturas"
VERSAO = "1.0.0"

DENSIDADE = dimensao(massa=1, comprimento=-3)

MANIFESTO = Manifesto(
    identidade=INSTRUMENTO,
    versao=VERSAO,
    capacidades=("calcular densidade de mistura a partir de frações em massa",),
    dominio={
        "base": lambda v: v == "massa",
    },
    nao_cobre=(
        "mudança de volume na mistura — a conta SUPÕE que os volumes se somam, "
        "e soluções intersticiais violam isso de forma mensurável",
        "formação de composto intermetálico, que muda a densidade fora da regra",
        "porosidade, inclusão e defeito de processamento",
        "qualquer efeito de temperatura: a densidade dos elementos entra na "
        "temperatura em que foi tabelada, e a saída herda essa condição",
        "frações em base atômica",
    ),
    determinista=True,
    maturidade="experimental",
)


def registro_padrao() -> Registro:
    registro = Registro()
    registro.registrar(MANIFESTO)
    return registro


def densidade(composicao: Composicao, densidades: dict[str, Grandeza]) -> dict[str, Any]:
    """Densidade da mistura, com a hipótese que a sustenta dita na saída."""
    if composicao.base != "massa":
        raise falhar(
            "instrumento", "base-fora-do-dominio",
            f"a conta vale para fração em massa e a composição veio em '{composicao.base}'.",
            local="base",
            acaoSugerida="Converta para massa deliberadamente; a conversão precisa das massas molares.",
        )
    faltando = sorted(set(composicao.fracoes) - set(densidades))
    if faltando:
        raise falhar(
            "instrumento", "densidade-de-elemento-ausente",
            f"sem densidade para {faltando}.",
            local="densidades",
            acaoSugerida="Forneça com fonte; supor valor aqui inventaria o resultado.",
        )

    unidades = {densidades[e].unidade for e in composicao.fracoes}
    if len(unidades) != 1:
        # Misturar g/cm³ com kg/m³ erra por mil e o resultado continua parecendo
        # densidade — é o caso exato que o módulo de unidades existe para pegar.
        raise falhar("instrumento", "densidades-em-unidades-diferentes",
                     f"as densidades vêm em {sorted(unidades)}.", local="densidades")
    unidade = unidades.pop()

    for elemento in composicao.fracoes:
        if densidades[elemento].valor <= 0:
            raise falhar("instrumento", "densidade-nao-positiva",
                         f"densidade de '{elemento}' é {densidades[elemento].valor}.",
                         local="densidades")
        if densidades[elemento].dimensao != DENSIDADE:
            raise falhar("instrumento", "grandeza-nao-e-densidade",
                         f"'{elemento}' não veio como massa por volume.", local="densidades")

    inverso = sum(w / densidades[e].valor for e, w in composicao.fracoes.items())
    valor = 1.0 / inverso
    return {
        "instrumento": INSTRUMENTO,
        "versao": VERSAO,
        "densidade": Grandeza(valor, unidade, DENSIDADE).documento(),
        "parametros": {"base": composicao.base},
        "entradas": {
            "composicao": composicao.documento(),
            "densidadesDosElementos": {
                e: densidades[e].documento() for e in sorted(composicao.fracoes)
            },
        },
        # Repetido na saída, e não só no manifesto: quem lê o número três
        # documentos adiante não vai abrir o manifesto.
        "hipotese": "os volumes se somam sem mudar ao misturar",
        "quandoIssoFalha": ("solução intersticial, composto intermetálico, porosidade; "
                            "nesses casos a densidade real difere de forma mensurável"),
    }


#: Tolerância relativa do canário. NÃO é um número escolhido para o teste passar:
#: é a ordem do erro de arredondamento de duas operações em ponto flutuante
#: (~2.2e-16 por operação). Qualquer erro real da conta é ordens de grandeza maior.
TOLERANCIA_DO_CANARIO = 1e-14


def canario() -> None:
    """Prova que a conta mede algo, em casos de resposta conhecida.

    A tolerância aqui é a do ponto flutuante, não uma escolha de conveniência:
    o inverso do inverso não volta ao mesmo binário, e fingir exatidão seria
    encenar rigor.
    """
    ferro = Grandeza(7.874, "g/cm3", DENSIDADE)
    so_ferro = densidade(Composicao({"Fe": 1.0}), {"Fe": ferro})["densidade"]["valor"]
    if abs(so_ferro - 7.874) / 7.874 > TOLERANCIA_DO_CANARIO:
        raise falhar("instrumento", "canario-morto",
                     f"um elemento só devolveu {so_ferro} em vez da densidade dele.",
                     local="canario")

    iguais = densidade(Composicao({"A": 0.5, "B": 0.5}),
                       {"A": ferro, "B": Grandeza(7.874, "g/cm3", DENSIDADE)})["densidade"]["valor"]
    if abs(iguais - 7.874) / 7.874 > TOLERANCIA_DO_CANARIO:
        raise falhar("instrumento", "canario-morto",
                     f"duas densidades iguais devolveram {iguais}.", local="canario")

    # Terceiro caso, e o mais importante: a conta tem de ficar ENTRE os
    # extremos. Um erro de sinal ou de inversão passa pelos dois primeiros
    # casos e é pego aqui.
    entre = densidade(Composicao({"leve": 0.5, "pesado": 0.5}),
                      {"leve": Grandeza(2.0, "g/cm3", DENSIDADE),
                       "pesado": Grandeza(10.0, "g/cm3", DENSIDADE)})["densidade"]["valor"]
    if not 2.0 < entre < 10.0:
        raise falhar("instrumento", "canario-morto",
                     f"a mistura deu {entre}, fora do intervalo dos componentes.",
                     local="canario")
