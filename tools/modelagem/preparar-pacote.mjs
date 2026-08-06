#!/usr/bin/env node
/* preparar-pacote.mjs — CLI fina sobre o mesmo núcleo de `planejar-pacote.mjs`
   e `criar-pacote.mjs`: plano, confirmação e aplicação atômica em um único
   comando. Uma pasta já existente é sempre erro, então uma segunda tentativa
   nunca apaga briefing ou crítica. */
import { ErroDePacote, RAIZ_PACOTES, caminhoPacote } from './formato-pacote.mjs';
import { criarPacoteAtomico } from './criar-pacote.mjs';
import { planejarPacote } from './planejar-pacote.mjs';

function uso(mensagem) {
  console.error(`preparar:modelagem: ${mensagem}`);
  process.exit(2);
}
function ler(argv) {
  let id = null;
  let peca = null;
  let modo = 'refinamento';
  let modoDefinido = false;
  let partesEsperadas = null;
  for (const argumento of argv) {
    if (argumento.startsWith('--peca=')) {
      if (peca !== null) uso('--peca veio mais de uma vez.');
      peca = argumento.slice('--peca='.length);
    } else if (argumento.startsWith('--modo=')) {
      if (modoDefinido) uso('--modo veio mais de uma vez.');
      modo = argumento.slice('--modo='.length);
      modoDefinido = true;
    } else if (argumento.startsWith('--partes=')) {
      if (partesEsperadas !== null) uso('--partes veio mais de uma vez.');
      const recebido = argumento.slice('--partes='.length);
      partesEsperadas = recebido ? recebido.split(',') : [];
    } else if (argumento.startsWith('--')) {
      uso(`não conheço '${argumento}'; use: <pacote> --peca=<peça> [--modo=refinamento|criacao] [--partes=parte-a,parte-b].`);
    } else if (id === null) id = argumento;
    else uso(`recebi mais de um pacote: '${id}' e '${argumento}'.`);
  }
  if (!id || !peca) uso('use: npm run preparar:modelagem -- <pacote> --peca=<peça> [--modo=refinamento|criacao] [--partes=parte-a,parte-b].');
  if (!['refinamento', 'criacao'].includes(modo)) uso('--modo precisa ser refinamento ou criacao.');
  if (modo === 'criacao' && (!partesEsperadas || !partesEsperadas.length || partesEsperadas.some((parte) => !parte))) {
    uso('--modo=criacao exige --partes=nomes-semanticos,separados-por-virgula.');
  }
  if (modo === 'refinamento' && partesEsperadas !== null) {
    uso('--partes só é aceito em --modo=criacao; refinamento deriva as partes da descrição atual.');
  }
  return { id, peca, modo, partesEsperadas };
}

export async function prepararPacote({
  id, peca, modo = 'refinamento', partesEsperadas = null, raizPacotes = RAIZ_PACOTES,
} = {}) {
  const plano = await planejarPacote({ id, peca, modo, partesEsperadas, raizPacotes });
  await criarPacoteAtomico({
    id, peca, modo, partesEsperadas, confirmacao: plano.confirmacao, raizPacotes,
  });
  return {
    destino: caminhoPacote(id, { raizPacotes }),
    briefing: plano.briefing,
    referencias: plano.referencias,
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const { id, peca, modo, partesEsperadas } = ler(process.argv.slice(2));
  try {
    const criado = await prepararPacote({ id, peca, modo, partesEsperadas });
    console.log(`pacote criado: ${criado.destino}`);
  } catch (erro) {
    console.error(`preparar:modelagem: ${erro.message}`);
    process.exit(erro instanceof ErroDePacote ? 1 : 1);
  }
}
