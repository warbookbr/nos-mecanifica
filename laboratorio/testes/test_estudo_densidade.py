"""O estudo do aço: ele tem de poder discordar, e discordou."""
import pytest

from laboratorio.erros import ErroLaboratorio
from laboratorio.estudos import densidade_de_aco_inoxidavel as estudo
from laboratorio.instrumentos import Manifesto, Registro


def test_o_estudo_roda_de_ponta_a_ponta():
    sintese = estudo.avaliar(estudo.medir())
    assert len(sintese.conclusoes) == 2
    assert all(c["estado"] != "nao-testada" for c in sintese.conclusoes)


def test_A_HIPOTESE_DE_ACERTO_FOI_CONTRADITA():
    """O erro é ~2,5%, acima do 1% fixado ANTES de calcular."""
    sintese = estudo.avaliar(estudo.medir())
    por_hipotese = {c["hipotese"]: c["estado"] for c in sintese.conclusoes}
    assert por_hipotese[estudo.HIPOTESE_ACERTO.id] == "contradita"


def test_a_hipotese_do_SENTIDO_do_erro_foi_sustentada():
    """A regra subestima, que é o que a hipótese de volumes aditivos prevê ao falhar."""
    sintese = estudo.avaliar(estudo.medir())
    por_hipotese = {c["hipotese"]: c["estado"] for c in sintese.conclusoes}
    assert por_hipotese[estudo.HIPOTESE_SENTIDO_DO_ERRO.id] == "sustentada-no-dominio-testado"


def test_o_previsto_fica_ABAIXO_da_referencia():
    previsto = estudo.medir()["densidade"]["valor"]
    assert previsto < estudo.DENSIDADE_DE_REFERENCIA_304


def test_A_SINTESE_DIZ_QUE_NENHUM_ACO_FOI_PESADO():
    """A fraqueza maior do estudo fica na saída, não escondida."""
    sintese = estudo.avaliar(estudo.medir())
    assert any("NENHUM AÇO FOI PESADO" in limite for limite in sintese.limites)
    assert any("fonte primária" in limite for limite in sintese.limites)


def test_o_criterio_de_erro_e_fixado_ANTES_de_medir():
    """Escolher a tolerância depois de ver o resultado é escolher a conclusão."""
    import inspect

    fonte = inspect.getsource(estudo)
    assert fonte.index("ERRO_ACEITAVEL = ") < fonte.index("def medir")


def test_INSTRUMENTO_NAO_REGISTRADO_nao_sustenta_conclusao():
    """Medida existir não a autoriza a concluir."""
    vazio = Registro()
    vazio.registrar(Manifesto(identidade="outro", versao="1", capacidades=("x",),
                              nao_cobre=("y",)))
    with pytest.raises(ErroLaboratorio) as erro:
        estudo.avaliar(estudo.medir(), vazio)
    assert erro.value.codigo == "instrumento-nao-registrado"


def test_densidades_de_manual_ficam_ISOLADAS_e_marcadas():
    """A entrada mais frágil do estudo é fácil de trocar por dado com fonte."""
    assert "não conferido" in estudo.FONTE_DAS_DENSIDADES
    assert set(estudo.COMPOSICAO_304) <= set(estudo.DENSIDADES_DE_MANUAL)


def test_trocar_a_densidade_de_entrada_MUDA_o_resultado():
    """Prova que o número de manual não está cravado na conta."""
    padrao = estudo.medir()["densidade"]["valor"]
    outro = estudo.medir({**estudo.DENSIDADES_DE_MANUAL, "Fe": 8.5})["densidade"]["valor"]
    assert outro > padrao
