"""Rigidez de um policristal a partir das constantes elásticas do monocristal.

O QUE É ISTO. Um metal real é um monte de graõzinhos, cada um com orientação
diferente. O cristal isolado é anisotrópico — mais duro numa direção que noutra —
mas a peça, com milhões de grãos apontando para todo lado, se comporta como se
fosse isotrópica. A pergunta é: quanto vale essa rigidez média?

POR QUE ESTE INSTRUMENTO VALE MAIS QUE OS OUTROS. Voigt e Reuss NÃO são
estimativas: são **limites rigorosos**, provados. Voigt supõe deformação igual em
todos os grãos e dá o valor mais alto possível; Reuss supõe tensão igual e dá o
mais baixo. O material real fica obrigatoriamente entre os dois.

Isso é raro e precioso aqui: a distância entre os limites é uma **incerteza
provada**, não um número que alguém escolheu. É a primeira que este laboratório
tem que não saiu de mim. Hill, a média dos dois, é o palpite usual — e é palpite,
então sai marcado como tal, entre os limites que valem de verdade.

O QUE ELE NÃO COBRE, e cada item muda o resultado de verdade:
  - **textura.** A conta supõe grãos orientados ao acaso. Chapa laminada tem
    orientação preferencial, e aí nem Hill nem os limites descrevem a peça.
  - **contorno de grão, porosidade, segunda fase.** São o que separa o cristal
    do material de engenharia, e nada disso entra aqui.
  - **plasticidade.** Isto é rigidez elástica, não resistência. Confundir os dois
    é o erro mais comum de quem lê um módulo elástico e acha que sabe quanto a
    peça aguenta.

ESCRITO DO ZERO, DE PROPÓSITO. As fórmulas são públicas e antigas; o código é
nosso. Método publicado não é obra derivada de código de ninguém, e assim o
resultado fica MIT sem herdar licença de pacote nenhum.
"""

from __future__ import annotations

from typing import Any

from .erros import falhar
from .instrumentos import Manifesto, Registro
from .unidades import Grandeza, dimensao

INSTRUMENTO = "materiais.rigidez-de-policristal-voigt-reuss-hill"
VERSAO = "1.0.0"

PRESSAO = dimensao(massa=1, comprimento=-1, tempo=-2)

MANIFESTO = Manifesto(
    identidade=INSTRUMENTO,
    versao=VERSAO,
    capacidades=(
        "calcular limites de Voigt e Reuss e a média de Hill para módulo "
        "volumétrico e de cisalhamento de um policristal sem textura",
    ),
    nao_cobre=(
        "textura: a conta supõe grãos orientados ao acaso, e chapa laminada não é isso",
        "contorno de grão, porosidade e segunda fase — o que separa cristal de peça",
        "plasticidade e resistência: isto é rigidez elástica, e confundir as duas "
        "é achar que um módulo elástico diz quanto a peça aguenta",
        "dependência de temperatura: o resultado herda a condição das constantes de entrada",
        "materiais com constantes elásticas que violem estabilidade mecânica",
    ),
    determinista=True,
    maturidade="experimental",
)


def registro_padrao() -> Registro:
    registro = Registro()
    registro.registrar(MANIFESTO)
    return registro


def _inverter(matriz: list[list[float]]) -> list[list[float]]:
    """Inversa 6×6 por Gauss-Jordan com pivotamento parcial.

    Escrita à mão porque são 6×6 e uma dependência numérica inteira para isto
    seria pagar caro por nada. O pivotamento não é luxo: sem ele, uma constante
    de cisalhamento pequena na diagonal destrói a precisão.
    """
    n = len(matriz)
    a = [linha[:] + [1.0 if i == j else 0.0 for j in range(n)]
         for i, linha in enumerate(matriz)]
    for coluna in range(n):
        pivo = max(range(coluna, n), key=lambda linha: abs(a[linha][coluna]))
        if abs(a[pivo][coluna]) < 1e-12:
            raise falhar(
                "instrumento", "matriz-singular",
                "a matriz de rigidez não tem inversa; ela não descreve um material estável.",
                local="C",
            )
        a[coluna], a[pivo] = a[pivo], a[coluna]
        divisor = a[coluna][coluna]
        a[coluna] = [v / divisor for v in a[coluna]]
        for linha in range(n):
            if linha != coluna and a[linha][coluna] != 0.0:
                fator = a[linha][coluna]
                a[linha] = [v - fator * w for v, w in zip(a[linha], a[coluna])]
    return [linha[n:] for linha in a]


def _conferir(C: list[list[float]]) -> None:
    if len(C) != 6 or any(len(linha) != 6 for linha in C):
        raise falhar("instrumento", "matriz-fora-de-forma",
                     "a matriz de rigidez é 6×6 na notação de Voigt.", local="C")
    for i in range(6):
        for j in range(6):
            if C[i][j] != C[j][i]:
                # A simetria não é convenção: ela vem de a energia elástica ser
                # uma função de estado. Matriz assimétrica não é material.
                raise falhar(
                    "instrumento", "matriz-nao-simetrica",
                    f"C[{i}][{j}] = {C[i][j]} e C[{j}][{i}] = {C[j][i]}; "
                    "a simetria vem da energia elástica ser função de estado.",
                    local="C",
                )
    for i in range(6):
        if C[i][i] <= 0:
            raise falhar("instrumento", "diagonal-nao-positiva",
                         f"C[{i}][{i}] = {C[i][i]}; material estável tem diagonal positiva.",
                         local="C")


def cubica(c11: float, c12: float, c44: float) -> list[list[float]]:
    """Monta a matriz de um cristal cúbico, que é o caso da maioria dos metais."""
    return [
        [c11, c12, c12, 0.0, 0.0, 0.0],
        [c12, c11, c12, 0.0, 0.0, 0.0],
        [c12, c12, c11, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, c44, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0, c44, 0.0],
        [0.0, 0.0, 0.0, 0.0, 0.0, c44],
    ]


def calcular(C: list[list[float]], *, unidade: str = "GPa",
             condicao: str = "não declarada") -> dict[str, Any]:
    """Limites de Voigt e Reuss, e a média de Hill, com a incerteza que sai deles."""
    _conferir(C)
    S = _inverter(C)

    # Voigt: deformação uniforme entre os grãos. Limite SUPERIOR.
    k_voigt = (C[0][0] + C[1][1] + C[2][2] + 2 * (C[0][1] + C[0][2] + C[1][2])) / 9.0
    g_voigt = ((C[0][0] + C[1][1] + C[2][2]) - (C[0][1] + C[0][2] + C[1][2])
               + 3 * (C[3][3] + C[4][4] + C[5][5])) / 15.0

    # Reuss: tensão uniforme entre os grãos. Limite INFERIOR.
    k_reuss_inverso = (S[0][0] + S[1][1] + S[2][2] + 2 * (S[0][1] + S[0][2] + S[1][2]))
    g_reuss_inverso = (4 * (S[0][0] + S[1][1] + S[2][2])
                       - 4 * (S[0][1] + S[0][2] + S[1][2])
                       + 3 * (S[3][3] + S[4][4] + S[5][5])) / 15.0
    if k_reuss_inverso <= 0 or g_reuss_inverso <= 0:
        raise falhar("instrumento", "material-instavel",
                     "os limites de Reuss saíram não positivos; as constantes não "
                     "descrevem um material mecanicamente estável.", local="C")
    k_reuss = 1.0 / k_reuss_inverso
    g_reuss = 1.0 / g_reuss_inverso

    if k_voigt < k_reuss or g_voigt < g_reuss:
        # Voigt abaixo de Reuss é matematicamente impossível: é prova de erro na
        # implementação ou de entrada que não é material. Melhor gritar do que
        # devolver um intervalo invertido que alguém vai ler como incerteza.
        raise falhar("instrumento", "limites-invertidos",
                     f"Voigt ({k_voigt:.4g}, {g_voigt:.4g}) ficou abaixo de Reuss "
                     f"({k_reuss:.4g}, {g_reuss:.4g}), o que é impossível.",
                     local="C")

    k_hill = (k_voigt + k_reuss) / 2.0
    g_hill = (g_voigt + g_reuss) / 2.0
    # E e ν saem de K e G por identidade da elasticidade isotrópica.
    young = 9 * k_hill * g_hill / (3 * k_hill + g_hill)
    poisson = (3 * k_hill - 2 * g_hill) / (2 * (3 * k_hill + g_hill))

    def g(valor: float) -> dict[str, Any]:
        return Grandeza(valor, unidade, PRESSAO).documento()

    largura_k = (k_voigt - k_reuss) / k_hill if k_hill else 0.0
    largura_g = (g_voigt - g_reuss) / g_hill if g_hill else 0.0
    return {
        "instrumento": INSTRUMENTO,
        "versao": VERSAO,
        "parametros": {"unidade": unidade},
        "entradas": {"C": [linha[:] for linha in C], "condicao": condicao},
        "limites": {
            "volumetrico": {"reuss": g(k_reuss), "voigt": g(k_voigt)},
            "cisalhamento": {"reuss": g(g_reuss), "voigt": g(g_voigt)},
        },
        "hill": {
            "volumetrico": g(k_hill), "cisalhamento": g(g_hill),
            "young": g(young), "poisson": poisson,
            "natureza": "estimativa, não limite",
        },
        # A frase é o produto: a incerteza aqui é PROVADA, e isso quase nunca
        # acontece — o resto do laboratório trabalha com incerteza declarada.
        "incerteza": {
            "tipo": "limite rigoroso",
            "larguraRelativaVolumetrico": largura_k,
            "larguraRelativaCisalhamento": largura_g,
            "significado": ("o material real está entre Reuss e Voigt por prova, "
                            "não por estimativa; a largura é a anisotropia do cristal"),
        },
        "avisos": (
            "supõe grãos orientados ao acaso: chapa laminada tem textura e não obedece",
            "isto é rigidez elástica, não resistência",
        ),
    }


def canario() -> None:
    """Casos de resposta conhecida, incluindo um que só um erro real quebraria."""
    # Material ISOTRÓPICO por construção: C44 = (C11 − C12)/2. Aí não há
    # anisotropia, e Voigt tem de ser IGUAL a Reuss. Este é o caso forte: um erro
    # em qualquer das quatro fórmulas abre uma fresta entre os limites.
    c11, c12 = 200.0, 100.0
    isotropico = calcular(cubica(c11, c12, (c11 - c12) / 2))
    k = isotropico["limites"]["volumetrico"]
    g = isotropico["limites"]["cisalhamento"]
    for nome, par in (("volumétrico", k), ("cisalhamento", g)):
        alto, baixo = par["voigt"]["valor"], par["reuss"]["valor"]
        if abs(alto - baixo) / alto > 1e-12:
            raise falhar("instrumento", "canario-morto",
                         f"material isotrópico deu limites diferentes em {nome}: "
                         f"{baixo} e {alto}.", local="canario")

    # K de um cúbico é exatamente (C11 + 2·C12)/3 nos dois limites.
    esperado = (c11 + 2 * c12) / 3
    if abs(k["voigt"]["valor"] - esperado) / esperado > 1e-12:
        raise falhar("instrumento", "canario-morto",
                     f"K deu {k['voigt']['valor']} e devia dar {esperado}.", local="canario")

    # E um cristal ANISOTRÓPICO tem de abrir fresta: se não abrir, a conta está
    # devolvendo a mesma coisa duas vezes e ninguém perceberia.
    anisotropico = calcular(cubica(200.0, 100.0, 120.0))
    if anisotropico["incerteza"]["larguraRelativaCisalhamento"] <= 0:
        raise falhar("instrumento", "canario-morto",
                     "cristal anisotrópico não abriu fresta entre os limites.",
                     local="canario")
