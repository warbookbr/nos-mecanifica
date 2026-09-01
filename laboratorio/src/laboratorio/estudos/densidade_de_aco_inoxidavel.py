"""Primeiro estudo de material: a regra das misturas acerta a densidade de um
aço inoxidável austenítico?

POR QUE ESTA PERGUNTA. Ela é pequena, tem resposta conhecida fora do laboratório,
e a conta tem uma hipótese declarada que pode estar errada — os volumes se
somarem sem mudar. Um primeiro estudo que só confirmasse o esperado não testaria
nada; este pode discordar do mundo, e é justamente isso que se quer ver.

O QUE ESTE ESTUDO NÃO É. Não é uma medição. Nenhum aço foi pesado aqui. É a
comparação entre o que a conta prevê e um valor de referência de manual, e essa
distinção está na síntese, não escondida no meio.

A FRAQUEZA MAIOR, dita antes do resultado: as densidades dos elementos e a
densidade de referência do aço 304 vêm de valor de manual amplamente reproduzido,
e NÃO foram conferidas contra fonte primária neste ambiente — não há rede
garantida aqui. Se algum desses números estiver errado, a conclusão vira junto.
Quem for usar isto para decidir tem de conferir primeiro, e a síntese repete isso.
"""

from __future__ import annotations

from typing import Any

from ..contratos import Estudo, Evidencia, Execucao, Hipotese, Sintese
from ..instrumentos import Registro
from ..materiais import Composicao
from ..misturas import DENSIDADE, INSTRUMENTO, VERSAO, densidade, registro_padrao
from ..unidades import Grandeza

#: Densidades dos elementos puros, em g/cm³, a ~20 °C. Valor de manual, NÃO
#: conferido contra fonte primária neste ambiente. É a entrada mais frágil do
#: estudo e está isolada aqui para ser fácil de substituir por dado com fonte.
DENSIDADES_DE_MANUAL = {
    "Fe": 7.874,
    "Cr": 7.190,
    "Ni": 8.908,
    "Mn": 7.470,
}

FONTE_DAS_DENSIDADES = "valor de manual amplamente reproduzido; não conferido contra fonte primária"

#: Aço inoxidável 304, composição nominal simplificada e densidade de referência.
#: A composição real tem carbono, silício e outros em fração pequena, ignorados
#: aqui — e ignorar isso é uma escolha que a síntese declara como limite.
COMPOSICAO_304 = {"Fe": 0.70, "Cr": 0.18, "Ni": 0.08, "Mn": 0.04}
DENSIDADE_DE_REFERENCIA_304 = 8.00

#: Quanto a conta pode errar e ainda ser útil para escolher material. Escolhido
#: ANTES de ver o resultado, que é a única hora em que essa escolha é honesta.
ERRO_ACEITAVEL = 0.01

HIPOTESE_ACERTO = Hipotese(
    proposicao=(
        "A regra das misturas prevê a densidade do aço 304 dentro de "
        f"{ERRO_ACEITAVEL * 100:.0f}% do valor de referência."
    ),
    predicao=f"|previsto − referência| / referência ≤ {ERRO_ACEITAVEL}.",
    criterio_de_refutacao=f"O erro relativo passar de {ERRO_ACEITAVEL}.",
    dominio="aço austenítico Fe-Cr-Ni-Mn, composição nominal, ~20 °C",
)

HIPOTESE_SENTIDO_DO_ERRO = Hipotese(
    proposicao=(
        "Se errar, a regra das misturas SUBESTIMA a densidade deste aço, porque "
        "ela supõe que os volumes se somam e a austenita é mais compacta que isso."
    ),
    predicao="previsto < referência.",
    criterio_de_refutacao="O previsto ficar acima da referência.",
    dominio="o mesmo aço acima",
)

ESTUDO = Estudo(
    pergunta=(
        "A regra das misturas serve para estimar a densidade de um aço inoxidável "
        "austenítico, e se erra, para que lado erra?"
    ),
    criterio_de_encerramento=(
        "O canário do instrumento passa, a previsão é calculada e as duas hipóteses "
        "recebem estado; nenhuma pode ficar `nao-testada`."
    ),
    hipoteses=(HIPOTESE_ACERTO, HIPOTESE_SENTIDO_DO_ERRO),
)


def medir(densidades_dos_elementos: dict[str, float] | None = None) -> dict[str, Any]:
    """Roda o instrumento sobre a composição do 304."""
    valores = densidades_dos_elementos or DENSIDADES_DE_MANUAL
    grandezas = {
        elemento: Grandeza(valores[elemento], "g/cm3", DENSIDADE)
        for elemento in COMPOSICAO_304
    }
    return densidade(Composicao(COMPOSICAO_304), grandezas)


def avaliar(pacote: dict[str, Any], registro: Registro | None = None) -> Sintese:
    """Compara previsão e referência, e devolve a síntese com os limites."""
    # Medida existir não a autoriza a sustentar conclusão.
    registro = registro or registro_padrao()
    registro.exigir(pacote["instrumento"], pacote["versao"])

    previsto = pacote["densidade"]["valor"]
    erro = abs(previsto - DENSIDADE_DE_REFERENCIA_304) / DENSIDADE_DE_REFERENCIA_304
    subestima = previsto < DENSIDADE_DE_REFERENCIA_304

    execucao = Execucao(
        instrumento=pacote["instrumento"],
        versao_instrumento=pacote["versao"],
        parametros=pacote["parametros"],
        entradas=pacote["entradas"],
        saida={"densidadePrevista": previsto,
               "densidadeDeReferencia": DENSIDADE_DE_REFERENCIA_304,
               "erroRelativo": erro},
    )

    evidencias = (
        Evidencia(
            hipotese_id=HIPOTESE_ACERTO.id,
            execucoes=(execucao.id,),
            direcao="sustenta" if erro <= ERRO_ACEITAVEL else "contradiz",
            justificativa=(
                f"previsto {previsto:.4f} g/cm³ contra referência "
                f"{DENSIDADE_DE_REFERENCIA_304:.2f}; erro relativo {erro * 100:.2f}%, "
                f"contra o aceitável de {ERRO_ACEITAVEL * 100:.0f}% fixado antes de medir."
            ),
            dominio=HIPOTESE_ACERTO.dominio,
        ),
        Evidencia(
            hipotese_id=HIPOTESE_SENTIDO_DO_ERRO.id,
            execucoes=(execucao.id,),
            direcao="sustenta" if subestima else "contradiz",
            justificativa=(
                f"o previsto ficou {'abaixo' if subestima else 'acima'} da referência, "
                f"por {abs(previsto - DENSIDADE_DE_REFERENCIA_304):.4f} g/cm³."
            ),
            dominio=HIPOTESE_SENTIDO_DO_ERRO.dominio,
        ),
    )

    return Sintese(
        estudo_id=ESTUDO.id,
        conclusoes=(
            {"hipotese": HIPOTESE_ACERTO.id,
             "estado": ("sustentada-no-dominio-testado" if erro <= ERRO_ACEITAVEL
                        else "contradita")},
            {"hipotese": HIPOTESE_SENTIDO_DO_ERRO.id,
             "estado": ("sustentada-no-dominio-testado" if subestima else "contradita")},
        ),
        evidencias=tuple(e.id for e in evidencias),
        limites=(
            "NENHUM AÇO FOI PESADO: isto compara conta com valor de manual, e não com "
            "medição feita aqui. O laboratório ainda não encostou em dado experimental.",
            f"As densidades dos elementos e a referência do 304 são {FONTE_DAS_DENSIDADES}; "
            "se algum número estiver errado, a conclusão vira junto.",
            "A composição usada é nominal e simplificada: carbono, silício e outros "
            "elementos em fração pequena foram ignorados, e eles deslocam a densidade.",
            "Um único ponto: um aço, uma composição. Nada aqui autoriza estender a "
            "conclusão para outras famílias de liga, e menos ainda para intersticiais.",
            "A conta supõe que os volumes se somam ao misturar; é essa hipótese que está "
            "sendo testada, então o resultado fala dela, não da qualidade da implementação.",
        ),
    )
