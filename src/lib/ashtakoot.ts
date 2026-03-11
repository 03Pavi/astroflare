export interface AshtakootResult {
  varna: { score: number; max: 1; name: "Varna"; description: "Work & spiritual compatibility" };
  vashya: { score: number; max: 2; name: "Vashya"; description: "Dominance & attraction" };
  tara: { score: number; max: 3; name: "Tara"; description: "Destiny & mutual well-being" };
  yoni: { score: number; max: 4; name: "Yoni"; description: "Intimacy & physical compatibility" };
  grahaMaitri: { score: number; max: 5; name: "Graha Maitri"; description: "Mental & psychological match" };
  gana: { score: number; max: 6; name: "Gana"; description: "Temperament & behavior" };
  bhakoot: { score: number; max: 7; name: "Bhakoot"; description: "Health, romance & family" };
  nadi: { score: number; max: 8; name: "Nadi"; description: "Genetic & physiological compatibility" };
  total: number;
}

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
] as const;

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

export function calculateAshtakoot(
  moonSign1: string, nakshatra1: string,
  moonSign2: string, nakshatra2: string
): AshtakootResult {
  const s1 = SIGNS.indexOf(moonSign1);
  const s2 = SIGNS.indexOf(moonSign2);
  const n1 = NAKSHATRAS.indexOf(nakshatra1 as any);
  const n2 = NAKSHATRAS.indexOf(nakshatra2 as any);

  // Fallbacks if unknown
  const safeS1 = s1 === -1 ? 0 : s1;
  const safeS2 = s2 === -1 ? 0 : s2;
  const safeN1 = n1 === -1 ? 0 : n1;
  const safeN2 = n2 === -1 ? 0 : n2;

  // 1. Varna (1 Point) - based on sign elements
  // 0: Brahmin (Cancer, Scorpio, Pisces), 1: Kshatriya (Aries, Leo, Sag), 2: Vaishya (Taurus, Virgo, Cap), 3: Shudra (Gem, Lib, Aqua)
  const getVarna = (s: number) => [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0][s];
  const v1 = getVarna(safeS1);
  const v2 = getVarna(safeS2);
  let varnaScore = 1;
  if (v1 > v2) varnaScore = 0; // Groom's varna should ideally be >= Bride's (simplified)

  // 2. Vashya (2 Points) - based on signs
  const getVashya = (s: number) => {
    if ([0, 1, 8, 9].includes(s)) return 0; // Chatushpada
    if ([2, 5, 6, 10, 4].includes(s)) return 1; // Manav/Biped
    if ([3, 7, 11].includes(s)) return 2; // Jalchar
    return 3;
  };
  const vashyaMatch = getVashya(safeS1) === getVashya(safeS2) ? 2 : (getVashya(safeS1) % 2 === getVashya(safeS2) % 2 ? 1 : 0.5);

  // 3. Tara (3 Points)
  const t1 = (safeN2 - safeN1 + 27) % 9;
  const t2 = (safeN1 - safeN2 + 27) % 9;
  const taraScore = ((t1 % 2 === 0 ? 1.5 : 0) + (t2 % 2 === 0 ? 1.5 : 0)) || 1.5;

  // 4. Yoni (4 Points)
  // Simplified array mapping 27 Nakshatras to 14 Yonis
  const yoniMap = [0, 1, 2, 3, 4, 5, 6, 2, 5, 7, 7, 8, 9, 10, 9, 10, 11, 11, 5, 12, 13, 12, 1, 0, 1, 8, 1];
  const y1 = yoniMap[safeN1];
  const y2 = yoniMap[safeN2];
  let yoniScore = y1 === y2 ? 4 : 2; // Exact match 4, average 2. (Enemies score 0, not fully implemented here)
  if (Math.abs(y1 - y2) === 7) yoniScore = 0; // rough enemy distance

  // 5. Graha Maitri (5 Points) - Lords of Moon Signs
  const lords = [0, 1, 2, 3, 4, 2, 1, 0, 5, 6, 6, 5]; // generic grouping
  const l1 = lords[safeS1];
  const l2 = lords[safeS2];
  let grahaScore = l1 === l2 ? 5 : (Math.abs(l1 - l2) < 3 ? 4 : 1);

  // 6. Gana (6 Points)
  const ganaMap = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 0, 0, 2, 2, 1, 2, 0];
  const g1 = ganaMap[safeN1];
  const g2 = ganaMap[safeN2];
  let ganaScore = 6;
  if (g1 === 2 && g2 === 0) ganaScore = 0;
  else if (g1 !== g2) ganaScore = 3;

  // 7. Bhakoot (7 Points) - Distance between signs
  const dist = (safeS2 - safeS1 + 12) % 12 + 1;
  const bhakootScore = [1, 6, 8, 2, 12, 5, 9].includes(dist) ? 0 : 7; // Navam-Pancham, Shadashtak, Dwirdwadash give 0

  // 8. Nadi (8 Points)
  const nadiMap = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
  const nd1 = nadiMap[safeN1];
  const nd2 = nadiMap[safeN2];
  const nadiScore = nd1 === nd2 ? 0 : 8;

  const total = Number((varnaScore + vashyaMatch + taraScore + yoniScore + grahaScore + ganaScore + bhakootScore + nadiScore).toFixed(1));

  return {
    varna: { score: varnaScore, max: 1, name: "Varna", description: "Work & spiritual compatibility" },
    vashya: { score: vashyaMatch, max: 2, name: "Vashya", description: "Dominance & attraction" },
    tara: { score: taraScore, max: 3, name: "Tara", description: "Destiny & mutual well-being" },
    yoni: { score: yoniScore, max: 4, name: "Yoni", description: "Intimacy & physical compatibility" },
    grahaMaitri: { score: grahaScore, max: 5, name: "Graha Maitri", description: "Mental & psychological match" },
    gana: { score: ganaScore, max: 6, name: "Gana", description: "Temperament & behavior" },
    bhakoot: { score: bhakootScore, max: 7, name: "Bhakoot", description: "Health, romance & family" },
    nadi: { score: nadiScore, max: 8, name: "Nadi", description: "Genetic & physiological compatibility" },
    total
  };
}
