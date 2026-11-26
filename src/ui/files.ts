// Letöltés és képernyőkép (az oldalsáv és az eszköztár közös segédfüggvényei).

export function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Képernyőkép: két nézetes módban (fényjelenet + termékhű) a két vászon egymás mellé kerül. */
export function screenshot(name: string) {
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('.viewport canvas')];
  if (!canvases.length) return;
  const out = document.createElement('canvas');
  out.width = canvases.reduce((a, c) => a + c.width, 0);
  out.height = Math.max(...canvases.map((c) => c.height));
  const ctx = out.getContext('2d')!;
  let x = 0;
  for (const c of canvases) {
    ctx.drawImage(c, x, 0);
    x += c.width;
  }
  out.toBlob((b) => b && download(name, b), 'image/png');
}
