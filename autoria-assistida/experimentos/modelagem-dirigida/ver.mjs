#!/usr/bin/env node
/* ver.mjs — uma rodada do laço em um comando.

   Aplica zero ou mais alterações POR NOME e devolve as duas vistas que decidem
   proporção, empilhadas, grandes, num PNG só. Não há isométrica: ela sombreia o
   flanco e a leitura preenche volume que não existe.

   Uso:
     node ver.mjs --saida=/caminho/rodada.png
     node ver.mjs teto.altura=1380 capo.comprimento=1620 --saida=...

   Ele não aprova nada. Aprovar é ato do usuário. */

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { CARRO, alterar, comprimentoOcupado, balancos, VOCABULARIO } from './carro.mjs';
import { lateral, planta } from './desenhar.mjs';

const args = process.argv.slice(2);
const saida = (args.find((a) => a.startsWith('--saida=')) ?? '').slice(8) || 'rodada.png';
const nomes = args.filter((a) => !a.startsWith('--'));

let carro = CARRO;
const feitas = [];
for (const par of nomes) {
  const [caminho, cru] = par.split('=');
  const valor = Number(cru);
  carro = alterar(carro, caminho, valor);
  feitas.push(`${caminho} = ${valor}   (${VOCABULARIO[caminho] ?? 'sem frase declarada'})`);
}

if (feitas.length) console.log('alterado:\n  ' + feitas.join('\n  '));
console.log(`comprimento ocupado ${comprimentoOcupado(carro)} mm · balanços ${JSON.stringify(balancos(carro))}`);

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#f2f2f0}.g{width:max-content;padding:8px}
svg{display:block;margin:10px 0}
</style><div class="g">${lateral(carro)}${planta(carro)}</div>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2 });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.locator('.g').screenshot({ path: saida });
await navegador.close();
writeFileSync(saida.replace(/\.png$/, '.json'), JSON.stringify(carro, null, 2) + '\n');
console.log(`vistas em ${saida}; grandezas da rodada ao lado, em .json`);
