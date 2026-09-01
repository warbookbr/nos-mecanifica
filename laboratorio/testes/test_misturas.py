"""Instrumento de densidade: o canário, o domínio e as recusas."""
import pytest

from laboratorio.erros import ErroLaboratorio
from laboratorio.materiais import Composicao
from laboratorio.misturas import (DENSIDADE, MANIFESTO, canario, densidade,
                                  registro_padrao)
from laboratorio.unidades import Grandeza, dimensao


def d(v, unidade="g/cm3"):
    return Grandeza(v, unidade, DENSIDADE)


def test_O_CANARIO_PASSA():
    canario()


def test_um_elemento_so_devolve_a_densidade_dele():
    r = densidade(Composicao({"Fe": 1.0}), {"Fe": d(7.874)})
    assert abs(r["densidade"]["valor"] - 7.874) < 1e-12


def test_a_MISTURA_FICA_ENTRE_os_componentes():
    """Erro de sinal ou de inversão passa pelos casos triviais e é pego aqui."""
    r = densidade(Composicao({"leve": 0.5, "pesado": 0.5}),
                  {"leve": d(2.0), "pesado": d(10.0)})
    assert 2.0 < r["densidade"]["valor"] < 10.0


def test_a_conta_e_a_de_VOLUMES_e_nao_a_media_simples():
    """Média simples de 2 e 10 daria 6; a regra correta dá 10/3."""
    r = densidade(Composicao({"a": 0.5, "b": 0.5}), {"a": d(2.0), "b": d(10.0)})
    assert abs(r["densidade"]["valor"] - 10 / 3) < 1e-12


def test_BASE_ATOMICA_e_recusada_por_estar_fora_do_dominio():
    with pytest.raises(ErroLaboratorio) as erro:
        densidade(Composicao({"Fe": 1.0}, base="atomica"), {"Fe": d(7.874)})
    assert erro.value.codigo == "base-fora-do-dominio"
    assert erro.value.acao_sugerida


def test_ELEMENTO_SEM_DENSIDADE_e_recusado_em_vez_de_suposto():
    """Supor valor aqui inventaria o resultado."""
    with pytest.raises(ErroLaboratorio) as erro:
        densidade(Composicao({"Fe": 0.9, "Cr": 0.1}), {"Fe": d(7.874)})
    assert erro.value.codigo == "densidade-de-elemento-ausente"


def test_DENSIDADES_EM_UNIDADES_DIFERENTES_sao_recusadas():
    """Misturar g/cm³ com kg/m³ erra por mil e continua parecendo densidade."""
    with pytest.raises(ErroLaboratorio) as erro:
        densidade(Composicao({"a": 0.5, "b": 0.5}),
                  {"a": d(7874, "kg/m3"), "b": d(7.19)})
    assert erro.value.codigo == "densidades-em-unidades-diferentes"


def test_grandeza_que_nao_e_densidade_e_recusada():
    with pytest.raises(ErroLaboratorio) as erro:
        densidade(Composicao({"a": 1.0}),
                  {"a": Grandeza(7.8, "g/cm3", dimensao(massa=1))})
    assert erro.value.codigo == "grandeza-nao-e-densidade"


def test_densidade_nao_positiva_e_recusada():
    with pytest.raises(ErroLaboratorio) as erro:
        densidade(Composicao({"a": 1.0}), {"a": Grandeza(-1.0, "g/cm3", DENSIDADE)})
    assert erro.value.codigo == "densidade-nao-positiva"


def test_A_SAIDA_CARREGA_A_HIPOTESE_que_a_sustenta():
    """Quem lê o número três documentos adiante não abre o manifesto."""
    r = densidade(Composicao({"Fe": 1.0}), {"Fe": d(7.874)})
    assert "volumes se somam" in r["hipotese"]
    assert r["quandoIssoFalha"]


def test_o_manifesto_declara_a_MUDANCA_DE_VOLUME_como_nao_coberta():
    assert any("volume" in limite for limite in MANIFESTO.nao_cobre)


def test_o_instrumento_esta_registrado():
    assert registro_padrao().exigir(MANIFESTO.identidade, MANIFESTO.versao)
