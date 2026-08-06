/* planejar-pacote.test.mjs — plano puro, sem escrita: determinismo da
   confirmação, recusas estruturadas e paridade de defaults com a CLI. */
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { ErroDePacote, serializarCanonico } from './formato-pacote.mjs';
import { planejarPacote } from './planejar-pacote.mjs';

function raizTemporaria() {
  return mkdtempSync(join(tmpdir(), 'mecanifica-planejar-'));
}

describe('planejarPacote — plano puro, sem escrita', () => {
  it('planeja refinamento válido sem criar nenhum arquivo ou diretório', async () => {
    const raiz = raizTemporaria();
    try {
      const antes = existsSync(raiz) ? readdirSync(raiz) : null;
      const plano = await planejarPacote({ id: 'plano-jardineira', peca: '_jardineira', raizPacotes: raiz });
      expect(plano.id).toBe('plano-jardineira');
      expect(plano.peca).toBe('_jardineira');
      expect(plano.modo).toBe('refinamento');
      expect(plano.partesEsperadas.length).toBeGreaterThan(0);
      expect(plano.destino.endsWith('plano-jardineira')).toBe(true);
      expect(plano.arquivos).toHaveLength(2);
      expect(plano.arquivos.map((a) => a.caminho.split('/').pop())).toEqual(['briefing.json', 'referencias.json']);
      expect(plano.confirmacao).toMatch(/^sha256:[a-f0-9]{64}$/);
      /* nada foi escrito: a raiz continua exatamente como estava (inexistente ou vazia) */
      expect(existsSync(raiz) ? readdirSync(raiz) : null).toEqual(antes);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('planeja criação válida com partesEsperadas, sem importar nem exigir o alvo', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({
        id: 'plano-criacao', peca: 'peca-nova-inexistente', modo: 'criacao',
        partesEsperadas: ['base', 'topo'], raizPacotes: raiz,
      });
      expect(plano.modo).toBe('criacao');
      expect(plano.partesEsperadas).toEqual(['base', 'topo']);
      expect(plano.briefing.alvo).toEqual({
        peca: 'peca-nova-inexistente', caminho: 'prototipos/fps/v3/pecas/peca-nova-inexistente.js', modo: 'criacao',
      });
      /* `mkdtempSync` já cria `raiz`; o que importa é que planejar não criou
         nada dentro dela — nem a pasta do pacote, nem nada mais. */
      expect(readdirSync(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa refinamento de peça inexistente com codigo alvo_nao_encontrado', async () => {
    const raiz = raizTemporaria();
    try {
      await expect(planejarPacote({ id: 'plano-fantasma', peca: 'peca-que-nao-existe', raizPacotes: raiz }))
        .rejects.toMatchObject({ codigo: 'alvo_nao_encontrado' });
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa criação quando o alvo já existe, com codigo alvo_ja_existe', async () => {
    const raiz = raizTemporaria();
    try {
      await expect(planejarPacote({
        id: 'plano-sobre-existente', peca: '_jardineira', modo: 'criacao', partesEsperadas: ['x'], raizPacotes: raiz,
      })).rejects.toMatchObject({ codigo: 'alvo_ja_existe' });
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa pacote já existente com codigo pacote_existente, sem tentar recalcular nada mais', async () => {
    const raiz = raizTemporaria();
    try {
      mkdirSync(join(raiz, 'ja-existe'), { recursive: true });
      await expect(planejarPacote({ id: 'ja-existe', peca: '_jardineira', raizPacotes: raiz }))
        .rejects.toMatchObject({ codigo: 'pacote_existente' });
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa entrada incompatível com codigo entrada_invalida', async () => {
    const raiz = raizTemporaria();
    try {
      await expect(planejarPacote({ id: 'x', peca: '_jardineira', modo: 'misto', raizPacotes: raiz }))
        .rejects.toMatchObject({ codigo: 'entrada_invalida' });
      await expect(planejarPacote({
        id: 'y', peca: '_jardineira', modo: 'refinamento', partesEsperadas: ['nao-deveria'], raizPacotes: raiz,
      })).rejects.toMatchObject({ codigo: 'entrada_invalida' });
      await expect(planejarPacote({ id: 'z', peca: 'nova-peca', modo: 'criacao', raizPacotes: raiz }))
        .rejects.toMatchObject({ codigo: 'entrada_invalida' });
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('a mesma entrada produz sempre a mesma confirmação e os mesmos bytes canônicos', async () => {
    const raizA = raizTemporaria();
    const raizB = raizTemporaria();
    try {
      const opcoes = { id: 'determinismo', peca: '_jardineira', modo: 'refinamento' };
      const a = await planejarPacote({ ...opcoes, raizPacotes: raizA });
      const b = await planejarPacote({ ...opcoes, raizPacotes: raizB });
      expect(a.confirmacao).toBe(b.confirmacao);
      expect(a.briefingTexto).toBe(b.briefingTexto);
      expect(a.referenciasTexto).toBe(b.referenciasTexto);
      expect(a.briefingTexto).toBe(serializarCanonico(a.briefing));
      expect(a.arquivos.map((x) => x.sha256)).toEqual(b.arquivos.map((x) => x.sha256));
    } finally {
      rmSync(raizA, { recursive: true, force: true });
      rmSync(raizB, { recursive: true, force: true });
    }
  });

  it('mudar qualquer campo da entrada muda a confirmação', async () => {
    const raiz = raizTemporaria();
    try {
      const base = await planejarPacote({ id: 'sensivel-a', peca: '_jardineira', raizPacotes: raiz });
      const idDiferente = await planejarPacote({ id: 'sensivel-b', peca: '_jardineira', raizPacotes: raiz });
      const criacaoA = await planejarPacote({
        id: 'sensivel-criacao', peca: 'nova-peca-x', modo: 'criacao', partesEsperadas: ['base'], raizPacotes: raiz,
      });
      const criacaoB = await planejarPacote({
        id: 'sensivel-criacao', peca: 'nova-peca-x', modo: 'criacao', partesEsperadas: ['topo'], raizPacotes: raiz,
      });
      const confirmacoes = [base.confirmacao, idDiferente.confirmacao, criacaoA.confirmacao, criacaoB.confirmacao];
      expect(new Set(confirmacoes).size).toBe(confirmacoes.length);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('preview não expõe caminho absoluto (raiz de pacotes real; planejar nunca escreve, então é seguro sem limpeza)', async () => {
    const plano = await planejarPacote({ id: 'sem-caminho-absoluto-prova', peca: '_jardineira' });
    expect(plano.destino).toBe('autoria-assistida/pacotes/sem-caminho-absoluto-prova');
    const serializado = JSON.stringify(plano.arquivos) + plano.destino;
    expect(serializado).not.toMatch(/^\/|[A-Za-z]:\\|\/tmp\/|\/home\//);
  });

  it('erros de entrada_invalida são instâncias de ErroDePacote', async () => {
    const raiz = raizTemporaria();
    try {
      await expect(planejarPacote({ id: 'w', peca: '_jardineira', modo: 'misto', raizPacotes: raiz }))
        .rejects.toBeInstanceOf(ErroDePacote);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa planejar quando o destino é um symlink quebrado, sem emitir confirmação', async () => {
    const raiz = raizTemporaria();
    const fora = raizTemporaria();
    try {
      const alvoInexistente = join(fora, 'nao-existe-de-verdade');
      symlinkSync(alvoInexistente, join(raiz, 'destino-symlink-quebrado'));
      /* `existsSync` seguiria o link, veria que o alvo não existe, e diria
         "não existe" — errado: há algo ali (o próprio link) que precisa ser
         recusado, não ignorado. */
      await expect(planejarPacote({ id: 'destino-symlink-quebrado', peca: '_jardineira', raizPacotes: raiz }))
        .rejects.toMatchObject({ codigo: 'pacote_existente' });
    } finally {
      rmSync(raiz, { recursive: true, force: true });
      rmSync(fora, { recursive: true, force: true });
    }
  });

  it('recusa planejar quando a raiz de pacotes é link simbólico, sem emitir confirmação', async () => {
    const fora = raizTemporaria();
    const alvoReal = raizTemporaria();
    try {
      const raizSymlink = join(fora, 'raiz-symlink');
      symlinkSync(alvoReal, raizSymlink, 'dir');
      await expect(planejarPacote({ id: 'via-raiz-symlink-plano', peca: '_jardineira', raizPacotes: raizSymlink }))
        .rejects.toMatchObject({ codigo: 'raiz_invalida' });
    } finally {
      rmSync(fora, { recursive: true, force: true });
      rmSync(alvoReal, { recursive: true, force: true });
    }
  });

  it('recusa planejar quando o pai da raiz de pacotes é link simbólico, sem emitir confirmação', async () => {
    const fora = raizTemporaria();
    const alvoReal = raizTemporaria();
    try {
      const paiSymlink = join(fora, 'pai-symlink');
      symlinkSync(alvoReal, paiSymlink, 'dir');
      const raizPacotes = join(paiSymlink, 'pacotes');
      await expect(planejarPacote({ id: 'via-pai-symlink-plano', peca: '_jardineira', raizPacotes }))
        .rejects.toMatchObject({ codigo: 'raiz_invalida' });
    } finally {
      rmSync(fora, { recursive: true, force: true });
      rmSync(alvoReal, { recursive: true, force: true });
    }
  });
});
