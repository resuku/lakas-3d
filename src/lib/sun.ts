// Egyszerűsített napállás-számítás (NOAA közelítés, ±0,5° pontosság bőven elég a látványhoz).

const RAD = Math.PI / 180;

/** Alapértelmezett hely: Budapest (A – a lakás pontos helye nincs rögzítve). */
export const LOCATION = { lat: 47.5, lon: 19.04, label: 'Budapest (feltételezett)' };

function lastSunday(year: number, month0: number) {
  const d = new Date(Date.UTC(year, month0 + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
}

/** Közép-európai idő: CET (UTC+1), nyári időszámítás CEST (UTC+2) március utolsó vasárnapjától október utolsó vasárnapjáig. */
export function utcOffsetHours(year: number, month: number, day: number) {
  if (month > 3 && month < 10) return 2;
  if (month === 3) return day >= lastSunday(year, 2) ? 2 : 1;
  if (month === 10) return day < lastSunday(year, 9) ? 2 : 1;
  return 1;
}

/** Napmagasság és azimut (fok; azimut északtól, kelet felé pozitív). */
export function sunPosition(year: number, month: number, day: number, localHour: number, lat = LOCATION.lat, lon = LOCATION.lon) {
  const utcHour = localHour - utcOffsetHours(year, month, day);
  const ms = Date.UTC(year, month - 1, day) + utcHour * 3600_000;
  const d = ms / 86400_000 + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * d) % 360;
  const g = ((357.528 + 0.9856003 * d) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * d) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const lst = (gmst * 15 + lon) * RAD;
  const H = lst - ra;
  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.cos(dec) * Math.sin(H), Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.cos(H) * Math.sin(phi));
  return { alt: alt / RAD, az: ((az / RAD) + 360) % 360 };
}
