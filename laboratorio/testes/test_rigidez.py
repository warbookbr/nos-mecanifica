"""Rigidez de policristal: os limites são provados, e o canário cobra isso."""
import pytest

from laboratorio.erros import ErroLaboratorio
from laboratorio.rigidez import (MANIFESTO, calcular, canario, cubica,
                                 registro_padrao)


def test_O_CANARIO_PASSA():
    canario()


def test_MATERIAL_ISOTROPICO_TEM_LIMITES_IGUAIS():
    """Sem anisotropia não há fresta: é o caso que pega erro em qualquer fórmula."""
    r = calcular(cubica(200.0, 100.0, 50.0))
    for grandeza in ("volumetrico", "cisalhamento"):
        par = r["limites"][grandeza]
        assert abs(par["voigt"]["valor"] - par["reuss"]["valor"]) < 1e-10


def test_CRISTAL_ANISOTROPICO_ABRE_FRESTA():
    """Se não abrisse, a conta estaria devolvendo a mesma coisa duas vezes."""
    r = calcular(cubica(200.0, 100.0, 120.0))
    assert r["incerteza"]["larguraRelativaCisalhamento"] > 0


def test_VOIGT_NUNCA_FICA_ABAIXO_DE_REUSS():
    """É impossível pela prova; se acontecer, é erro de implementação."""
    for c44 in (30.0, 50.0, 80.0, 116.0, 200.0):
        r = calcular(cubica(226.0, 140.0, c44))
        for grandeza in ("volumetrico", "cisalhamento"):
            par = r["limites"][grandeza]
            assert par["voigt"]["valor"] >= par["reuss"]["valor"] - 1e-12


def test_HILL_FICA_ENTRE_OS_LIMITES():
    r = calcular(cubica(226.0, 140.0, 116.0))
    par = r["limites"]["cisalhamento"]
    assert par["reuss"]["valor"] <= r["hill"]["cisalhamento"]["valor"] <= par["voigt"]["valor"]


def test_HILL_SAI_MARCADO_COMO_ESTIMATIVA_e_nao_como_limite():
    """A distinção é o produto deste instrumento."""
    r = calcular(cubica(226.0, 140.0, 116.0))
    assert r["hill"]["natureza"] == "estimativa, não limite"
    assert r["incerteza"]["tipo"] == "limite rigoroso"


def test_o_MODULO_VOLUMETRICO_de_um_cubico_NAO_tem_incerteza():
    """Num cristal cúbico K é exato nos dois limites; a anisotropia vai toda
    para o cisalhamento. Isto não é aproximação, é identidade."""
    r = calcular(cubica(226.0, 140.0, 116.0))
    assert abs(r["incerteza"]["larguraRelativaVolumetrico"]) < 1e-12
    assert r["incerteza"]["larguraRelativaCisalhamento"] > 0.1


def test_o_FERRO_bate_com_o_valor_conhecido_de_aco():
    """Conferência contra o mundo: E de aço é ~200-210 GPa, e ν ~0,3."""
    r = calcular(cubica(226.0, 140.0, 116.0), condicao="300 K")
    assert 195 < r["hill"]["young"]["valor"] < 215
    assert 0.28 < r["hill"]["poisson"] < 0.32


def test_MATRIZ_NAO_SIMETRICA_e_recusada():
    """A simetria vem da energia elástica ser função de estado."""
    C = cubica(200.0, 100.0, 50.0)
    C[0][1] = 999.0
    with pytest.raises(ErroLaboratorio) as erro:
        calcular(C)
    assert erro.value.codigo == "matriz-nao-simetrica"


def test_matriz_fora_de_forma_e_recusada():
    with pytest.raises(ErroLaboratorio) as erro:
        calcular([[1.0, 2.0], [2.0, 1.0]])
    assert erro.value.codigo == "matriz-fora-de-forma"


def test_diagonal_nao_positiva_e_recusada():
    C = cubica(200.0, 100.0, 50.0)
    C[3][3] = -1.0
    with pytest.raises(ErroLaboratorio) as erro:
        calcular(C)
    assert erro.value.codigo == "diagonal-nao-positiva"


def test_MATERIAL_MECANICAMENTE_INSTAVEL_e_recusado():
    """C12 acima de C11 viola a estabilidade; não é material."""
    with pytest.raises(ErroLaboratorio) as erro:
        calcular(cubica(100.0, 300.0, 50.0))
    assert erro.value.codigo in ("material-instavel", "limites-invertidos", "matriz-singular")


def test_a_saida_avisa_sobre_TEXTURA_e_sobre_RESISTENCIA():
    """Confundir rigidez com resistência é o erro mais comum de quem lê isto."""
    r = calcular(cubica(226.0, 140.0, 116.0))
    juntos = " ".join(r["avisos"])
    assert "textura" in juntos and "resistência" in juntos


def test_o_manifesto_declara_textura_e_plasticidade_como_nao_cobertas():
    juntos = " ".join(MANIFESTO.nao_cobre)
    assert "textura" in juntos and "plasticidade" in juntos


def test_o_instrumento_esta_registrado():
    assert registro_padrao().exigir(MANIFESTO.identidade, MANIFESTO.versao)


def test_o_resultado_carrega_a_CONDICAO_das_constantes_de_entrada():
    r = calcular(cubica(226.0, 140.0, 116.0), condicao="300 K")
    assert r["entradas"]["condicao"] == "300 K"
