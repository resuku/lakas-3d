// Képernyőképek a futó dev szerverről, fej nélküli Chromiummal (Playwright konténerben).
// Használat: lásd README – "Képernyőképek automatikusan".
// Paraméter: JSON lépéslista, pl. [{"click":"Háló"},{"shot":"halo-ajtobol"}]

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://host.docker.internal:5173/';
const OUT = process.env.OUT_DIR || '/work/screenshots';
const steps = JSON.parse(process.argv[2] || '[{"shot":"start"}]');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(6000);
// az első megnyitáskor megjelenő súgó: előbb kép róla, ha a lépések kérik ({"helpShot":"név"}), aztán bezárás
if (steps[0]?.helpShot) {
  await page.screenshot({ path: `${OUT}/${steps[0].helpShot}.png` });
  console.log('kép:', steps[0].helpShot);
}
const start = page.getByRole('button', { name: 'Kezdjük', exact: true });
if (await start.count()) await start.click();

page.context().on('page', async (p) => {
  await p.waitForLoadState('commit').catch(() => {});
  console.log('új lap:', p.url());
});

for (const s of steps) {
  if (s.click) await page.getByRole('button', { name: s.click, exact: true }).first().click();
  if (s.toggle) await page.getByLabel(s.toggle).click();
  // select: [index, felirat] vagy ["auto", felirat] – az utóbbi azt a legördülőt keresi, amelyben ez a felirat szerepel
  if (s.select) {
    const loc = typeof s.select[0] === 'number' ? page.locator('select').nth(s.select[0]) : page.locator('select').filter({ has: page.locator('option', { hasText: s.select[1] }) }).first();
    await loc.selectOption({ label: s.select[1] });
  }
  if (s.wait) await page.waitForTimeout(s.wait);
  // billentyű lenyomva tartása ms-ig, pl. {"hold":["w",1500]}; egérhúzás a 3D nézetben, pl. {"drag":[200,0]}
  if (s.hold) {
    await page.keyboard.down(s.hold[0]);
    await page.waitForTimeout(s.hold[1]);
    await page.keyboard.up(s.hold[0]);
  }
  // letöltés gombnyomásra, mentés a kimeneti mappába, pl. {"download":["Konfiguráció mentése","cfg.json"]}
  if (s.download) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: s.download[0], exact: true }).first().click()]);
    await dl.saveAs(`${OUT}/${s.download[1]}`);
  }
  // fájl feltöltése egy fájlmezőbe, pl. {"upload":["input[accept='application/json,.json']","cfg.json"]}
  if (s.upload) await page.setInputFiles(s.upload[0], `${OUT}/${s.upload[1]}`);
  // szövegmező kitöltése a helykitöltő szövege alapján, pl. {"fill":["A neved","Anya"]}
  if (s.fill) await page.getByPlaceholder(s.fill[0]).first().fill(s.fill[1]);
  // egér mozgatása oldalkoordinátára (pl. gyorsinfóhoz), pl. {"mouse":[900,400]}
  if (s.mouse) await page.mouse.move(s.mouse[0], s.mouse[1], { steps: 4 });
  // billentyű le / fel külön lépésben (pl. M nyomva tartása egérhúzás közben), egérgomb le / fel oldalkoordinátán
  if (s.keyDown) await page.keyboard.down(s.keyDown);
  if (s.keyUp) await page.keyboard.up(s.keyUp);
  if (s.mouseDown) {
    await page.mouse.move(s.mouseDown[0], s.mouseDown[1]);
    await page.mouse.down();
  }
  if (s.mouseUp) await page.mouse.up();
  // Ctrl + kattintás oldalkoordinátán (a megnyitott új lap címét kiírja)
  if (s.ctrlClick) {
    await page.keyboard.down('Control');
    await page.mouse.click(s.ctrlClick[0], s.ctrlClick[1]);
    await page.keyboard.up('Control');
  }
  // kattintás oldalkoordinátán, pl. {"clickAt":[969,107]}
  if (s.clickAt) await page.mouse.click(s.clickAt[0], s.clickAt[1]);
  if (s.drag) {
    const box = await page.locator('.viewport canvas').first().boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + s.drag[0], cy + s.drag[1], { steps: 10 });
    await page.mouse.up();
  }
  if (s.eval) console.log('eval:', await page.evaluate(s.eval));
  // A mentett állapot (változatok) kiírása, pl. a javaslatgalériához
  if (s.dump) writeFileSync(`${OUT}/${s.dump}`, await page.evaluate(() => localStorage.getItem('lakas-3d') ?? '{}'));
  // kifejezés eredményének kiírása fájlba, pl. {"dumpEval":["fit.json","JSON.stringify(...)"]}
  if (s.dumpEval) writeFileSync(`${OUT}/${s.dumpEval[0]}`, String(await page.evaluate(s.dumpEval[1])));
  if (s.shot) {
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${s.shot}.png` });
    console.log('kép:', s.shot);
  }
}
if (errors.length) console.log('KONZOLHIBÁK:\n' + [...new Set(errors)].join('\n'));
await browser.close();
