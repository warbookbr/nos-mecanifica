/* criar-pacote.test.mjs — aplicação atômica: confirmação, confinamento,
   symlinks, corrida, falha injetada e ausência de resíduo. */
import {
  existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { ErroDePacote } from './formato-pacote.mjs';
import { planejarPacote } from './planejar-pacote.mjs';
import { criarPacoteAtomico, escritaPadrao } from './criar-pacote.mjs';

function raizTemporaria() {
  return mkdtempSync(join(tmpdir(), 'mecanifica-criar-'));
}

function residuoTemporario(raiz) {
  return existsSync(raiz) ? readdirSync(raiz).filter((nome) => nome.startsWith('.tmp-')) : [];
}

describe('criarPacoteAtomico — aplicação atômica, confinada e sem sobrescrita', () => {
  it('aplica exatamente os dois arquivos planejados, com bytes idênticos ao plano', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'aplica-ok', peca: '_jardineira', raizPacotes: raiz });
      const criado = await criarPacoteAtomico({
        id: 'aplica-ok', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz,
      });
      expect(criado.arquivos).toEqual(plano.arquivos);
      const pasta = join(raiz, 'aplica-ok');
      expect(readFileSync(join(pasta, 'briefing.json'), 'utf8')).toBe(plano.briefingTexto);
      expect(readFileSync(join(pasta, 'referencias.json'), 'utf8')).toBe(plano.referenciasTexto);
      expect(residuoTemporario(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa confirmação ausente ou malformada, sem criar nada', async () => {
    const raiz = raizTemporaria();
    try {
      await expect(criarPacoteAtomico({ id: 'sem-confirmacao', peca: '_jardineira', raizPacotes: raiz }))
        .rejects.toMatchObject({ codigo: 'confirmacao_ausente' });
      await expect(criarPacoteAtomico({
        id: 'confirmacao-malformada', peca: '_jardineira', confirmacao: 'nao-e-um-sha256', raizPacotes: raiz,
      })).rejects.toMatchObject({ codigo: 'confirmacao_invalida' });
      expect(existsSync(raiz) ? readdirSync(raiz) : []).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa confirmação de outra entrada (divergente)', async () => {
    const raiz = raizTemporaria();
    try {
      const planoOutro = await planejarPacote({ id: 'outro-pacote', peca: '_jardineira', raizPacotes: raiz });
      await expect(criarPacoteAtomico({
        id: 'divergente', peca: '_jardineira', confirmacao: planoOutro.confirmacao, raizPacotes: raiz,
      })).rejects.toMatchObject({ codigo: 'confirmacao_invalida' });
      expect(existsSync(join(raiz, 'divergente'))).toBe(false);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa confirmação reutilizada quando um campo da mesma entrada muda depois do plano', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({
        id: 'reaproveitada', peca: 'nova-peca-reaproveitada', modo: 'criacao', partesEsperadas: ['base'], raizPacotes: raiz,
      });
      /* mesmo id/peca/modo, mas partesEsperadas mudou depois do plano — a
         confirmação antiga não pode valer para essa entrada nova. */
      await expect(criarPacoteAtomico({
        id: 'reaproveitada', peca: 'nova-peca-reaproveitada', modo: 'criacao', partesEsperadas: ['outra-parte'],
        confirmacao: plano.confirmacao, raizPacotes: raiz,
      })).rejects.toMatchObject({ codigo: 'confirmacao_invalida' });
      expect(existsSync(join(raiz, 'reaproveitada'))).toBe(false);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa pacote já existente sem tocar o pacote original, e sem tratar repetição como sucesso', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'ja-existente', peca: '_jardineira', raizPacotes: raiz });
      await criarPacoteAtomico({ id: 'ja-existente', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz });
      const briefingOriginal = readFileSync(join(raiz, 'ja-existente', 'briefing.json'), 'utf8');

      await expect(criarPacoteAtomico({
        id: 'ja-existente', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz,
      })).rejects.toMatchObject({ codigo: 'pacote_existente' });

      expect(readFileSync(join(raiz, 'ja-existente', 'briefing.json'), 'utf8')).toBe(briefingOriginal);
      expect(residuoTemporario(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('falha injetada antes da primeira gravação não deixa resíduo nem destino', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'falha-antes', peca: '_jardineira', raizPacotes: raiz });
      const escritaComFalha = {
        ...escritaPadrao,
        writeFileSync: () => { throw new Error('falha injetada antes de qualquer gravação'); },
      };
      await expect(criarPacoteAtomico({
        id: 'falha-antes', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz, escrita: escritaComFalha,
      })).rejects.toMatchObject({ codigo: 'escrita_invalida' });
      expect(existsSync(join(raiz, 'falha-antes'))).toBe(false);
      expect(residuoTemporario(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('falha injetada depois da primeira gravação não deixa resíduo nem destino parcial', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'falha-depois', peca: '_jardineira', raizPacotes: raiz });
      let chamadas = 0;
      const escritaComFalha = {
        ...escritaPadrao,
        writeFileSync: (...args) => {
          chamadas += 1;
          if (chamadas === 2) throw new Error('falha injetada depois da primeira gravação');
          return escritaPadrao.writeFileSync(...args);
        },
      };
      await expect(criarPacoteAtomico({
        id: 'falha-depois', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz, escrita: escritaComFalha,
      })).rejects.toMatchObject({ codigo: 'escrita_invalida' });
      expect(existsSync(join(raiz, 'falha-depois'))).toBe(false);
      expect(residuoTemporario(raiz)).toEqual([]);
      expect(chamadas).toBe(2);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa corrida em que o destino aparece vazio bem no instante do mkdir de publicação (EEXIST real do SO)', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'corrida-vazia', peca: '_jardineira', raizPacotes: raiz });
      const escritaComCorrida = {
        ...escritaPadrao,
        mkdirSync: (caminho, opcoes) => {
          if (typeof caminho === 'string' && caminho.endsWith('corrida-vazia') && !caminho.includes('.tmp-')) {
            /* outro "processo" publica um destino vazio no instante exato
               antes do nosso próprio mkdir — rename silenciaria isso;
               mkdir não. */
            escritaPadrao.mkdirSync(caminho, opcoes);
            const erro = new Error('EEXIST simulado');
            erro.code = 'EEXIST';
            throw erro;
          }
          return escritaPadrao.mkdirSync(caminho, opcoes);
        },
      };
      await expect(criarPacoteAtomico({
        id: 'corrida-vazia', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz, escrita: escritaComCorrida,
      })).rejects.toMatchObject({ codigo: 'pacote_existente' });
      expect(residuoTemporario(raiz)).toEqual([]);
      /* o destino colidido continua vazio: não herdou nada da nossa tentativa */
      expect(readdirSync(join(raiz, 'corrida-vazia'))).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('não deixa pacote parcial visível se a segunda gravação de arquivo falhar depois do mkdir de publicação', async () => {
    const raiz = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'falha-na-publicacao', peca: '_jardineira', raizPacotes: raiz });
      let chamadasRename = 0;
      const escritaComFalhaNaPublicacao = {
        ...escritaPadrao,
        renameSync: (...args) => {
          chamadasRename += 1;
          if (chamadasRename === 2) throw new Error('falha injetada movendo referencias.json pro destino');
          return escritaPadrao.renameSync(...args);
        },
      };
      await expect(criarPacoteAtomico({
        id: 'falha-na-publicacao', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz, escrita: escritaComFalhaNaPublicacao,
      })).rejects.toThrow('falha injetada movendo referencias.json pro destino');
      /* nem o destino (nem parcialmente) nem a temporária sobram */
      expect(existsSync(join(raiz, 'falha-na-publicacao'))).toBe(false);
      expect(residuoTemporario(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('recusa raiz de pacotes que é link simbólico (mesma pré-condição do plano, recalculada por dentro)', async () => {
    const fora = raizTemporaria();
    const alvoReal = raizTemporaria();
    try {
      const raizSymlink = join(fora, 'raiz-symlink');
      symlinkSync(alvoReal, raizSymlink, 'dir');
      /* planejarPacote já recusa isso sozinho — criarPacoteAtomico herda a
         mesma recusa por recalcular o plano internamente, então nem chega a
         validar a confirmação (por isso um valor qualquer aqui já basta). */
      await expect(planejarPacote({ id: 'via-raiz-symlink', peca: '_jardineira', raizPacotes: raizSymlink }))
        .rejects.toMatchObject({ codigo: 'raiz_invalida' });
      await expect(criarPacoteAtomico({
        id: 'via-raiz-symlink', peca: '_jardineira', confirmacao: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        raizPacotes: raizSymlink,
      })).rejects.toMatchObject({ codigo: 'raiz_invalida' });
    } finally {
      rmSync(fora, { recursive: true, force: true });
      rmSync(alvoReal, { recursive: true, force: true });
    }
  });

  it('recusa quando a pasta temporária de escrita nasce como link simbólico (injeção de teste)', async () => {
    const raiz = raizTemporaria();
    const fora = raizTemporaria();
    try {
      const plano = await planejarPacote({ id: 'temporaria-symlink', peca: '_jardineira', raizPacotes: raiz });
      const escritaComTemporariaSymlink = {
        ...escritaPadrao,
        mkdirSync: (caminho, opcoes) => {
          if (typeof caminho === 'string' && caminho.includes('.tmp-temporaria-symlink-')) {
            symlinkSync(fora, caminho, 'dir');
            return undefined;
          }
          return escritaPadrao.mkdirSync(caminho, opcoes);
        },
      };
      await expect(criarPacoteAtomico({
        id: 'temporaria-symlink', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz, escrita: escritaComTemporariaSymlink,
      })).rejects.toMatchObject({ codigo: 'escrita_invalida' });
      expect(existsSync(join(raiz, 'temporaria-symlink'))).toBe(false);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
      rmSync(fora, { recursive: true, force: true });
    }
  });

  it('recusa escrita quando um symlink externo já ocupa o caminho de um dos dois JSONs na temporária', async () => {
    const raiz = raizTemporaria();
    const fora = raizTemporaria();
    try {
      const alvoSecreto = join(fora, 'segredo.json');
      writeFileSync(alvoSecreto, '{"segredo":true}');
      const plano = await planejarPacote({ id: 'json-symlink', peca: '_jardineira', raizPacotes: raiz });
      const escritaComJsonSymlink = {
        ...escritaPadrao,
        mkdirSync: (caminho, opcoes) => {
          const resultado = escritaPadrao.mkdirSync(caminho, opcoes);
          if (typeof caminho === 'string' && caminho.includes('.tmp-json-symlink-')) {
            /* um "atacante" planta um symlink no lugar exato do primeiro
               arquivo antes da nossa própria escrita chegar lá. */
            symlinkSync(alvoSecreto, join(caminho, 'briefing.json'));
          }
          return resultado;
        },
      };
      await expect(criarPacoteAtomico({
        id: 'json-symlink', peca: '_jardineira', confirmacao: plano.confirmacao, raizPacotes: raiz, escrita: escritaComJsonSymlink,
      })).rejects.toMatchObject({ codigo: 'escrita_invalida' });
      expect(readFileSync(alvoSecreto, 'utf8')).toBe('{"segredo":true}');
      expect(existsSync(join(raiz, 'json-symlink'))).toBe(false);
      expect(residuoTemporario(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
      rmSync(fora, { recursive: true, force: true });
    }
  });

  it('erros propagados são instâncias de ErroDePacote com codigo definido', async () => {
    const raiz = raizTemporaria();
    try {
      await expect(criarPacoteAtomico({ id: 'sem-confirmacao-2', peca: '_jardineira', raizPacotes: raiz }))
        .rejects.toBeInstanceOf(ErroDePacote);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
});
