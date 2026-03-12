import { type BirthChart } from '@/lib/charts';

type Planet = {
  name?: string;
  sign?: string;
  degree?: number;
  retrograde?: boolean;
};

type CareerSection = {
  title: string;
  summary: string;
  bullets: string[];
};

export type CareerInsight = {
  chartLabel: string;
  headline: string;
  topPaths: string[];
  sections: Record<string, CareerSection>;
};

const SIGN_TRAITS: Record<string, { theme: string; roles: string[] }> = {
  Aries: { theme: 'initiating', roles: ['startup operator', 'sales lead', 'sports or defense roles'] },
  Taurus: { theme: 'building', roles: ['finance', 'design', 'luxury or food business'] },
  Gemini: { theme: 'communicating', roles: ['media', 'marketing', 'teaching'] },
  Cancer: { theme: 'supporting', roles: ['care, wellness, hospitality', 'people operations'] },
  Leo: { theme: 'leading', roles: ['management', 'branding', 'creative direction'] },
  Virgo: { theme: 'optimizing', roles: ['analytics', 'research', 'operations'] },
  Libra: { theme: 'balancing', roles: ['law', 'partnership roles', 'client strategy'] },
  Scorpio: { theme: 'investigating', roles: ['psychology', 'risk', 'forensics'] },
  Sagittarius: { theme: 'expanding', roles: ['education', 'travel', 'advisory'] },
  Capricorn: { theme: 'structuring', roles: ['administration', 'enterprise leadership', 'government'] },
  Aquarius: { theme: 'innovating', roles: ['technology', 'product', 'community systems'] },
  Pisces: { theme: 'imagining', roles: ['healing arts', 'film/music', 'spiritual guidance'] },
};

function parseChart(chart: BirthChart) {
  if (!chart.chartData) return [];
  try {
    const parsed = JSON.parse(chart.chartData);
    return Array.isArray(parsed.planets) ? (parsed.planets as Planet[]) : [];
  } catch {
    return [];
  }
}

function findPlanet(planets: Planet[], name: string) {
  return planets.find((planet) => planet.name === name);
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildCareerInsight(chart: BirthChart): CareerInsight {
  const planets = parseChart(chart);
  const mercury = findPlanet(planets, 'Mercury');
  const jupiter = findPlanet(planets, 'Jupiter');
  const saturn = findPlanet(planets, 'Saturn');
  const mars = findPlanet(planets, 'Mars');
  const venus = findPlanet(planets, 'Venus');
  const sunTrait = SIGN_TRAITS[chart.sunSign || ''] ?? { theme: 'expressing', roles: ['general leadership'] };
  const moonTrait = SIGN_TRAITS[chart.moonSign || ''] ?? { theme: 'responding', roles: ['support functions'] };
  const risingTrait = SIGN_TRAITS[chart.risingSign || ''] ?? { theme: 'presenting', roles: ['front-facing work'] };
  const topPaths = uniq([
    ...sunTrait.roles,
    ...moonTrait.roles,
    ...risingTrait.roles,
    mercury?.sign ? `${SIGN_TRAITS[mercury.sign]?.theme || 'clear'} communication roles` : '',
    jupiter?.sign ? `${SIGN_TRAITS[jupiter.sign]?.theme || 'strategic'} advisory work` : '',
  ]).slice(0, 5);

  return {
    chartLabel: chart.label,
    headline: `${chart.label} is strongest in careers that reward ${sunTrait.theme} leadership, ${moonTrait.theme} instincts, and a ${risingTrait.theme} public style.`,
    topPaths,
    sections: {
      overview: {
        title: 'Career Direction',
        summary: `Sun in ${chart.sunSign || 'Unknown'}, Moon in ${chart.moonSign || 'Unknown'}, and Rising in ${chart.risingSign || 'Unknown'} point toward visible work with a clear personal stamp.`,
        bullets: [
          `Your base career tone is ${sunTrait.theme}.`,
          `You perform best when the role also lets you stay ${moonTrait.theme}.`,
          `Your public image reads as ${risingTrait.theme}, which affects how others trust you.`,
        ],
      },
      roles: {
        title: 'Best Career Options',
        summary: 'These paths match the dominant sign patterns in the chart.',
        bullets: topPaths.map((path) => `Strong fit: ${path}.`),
      },
      wealth: {
        title: 'Money Pattern',
        summary: `${jupiter?.sign || chart.sunSign || 'Your chart'} suggests wealth grows through compounding skill and reputation rather than quick wins.`,
        bullets: [
          saturn?.retrograde ? 'Finances improve steadily after delays; patience matters.' : 'Consistency and structure improve your earning ceiling.',
          venus?.sign ? `Venus in ${venus.sign} favors income through aesthetics, relationship capital, or client trust.` : 'Relationship quality strongly affects income flow.',
          jupiter?.sign ? `Jupiter in ${jupiter.sign} expands luck when you teach, guide, or build expertise.` : 'Expertise is a major wealth lever for you.',
        ],
      },
      style: {
        title: 'Work Style',
        summary: 'This is how the chart is most likely to operate inside a team or business.',
        bullets: [
          mercury?.sign ? `Mercury in ${mercury.sign} shows how you think and communicate under pressure.` : 'Communication skill is central to career growth.',
          mars?.sign ? `Mars in ${mars.sign} shows where you compete hard and move fast.` : 'You need work with enough challenge to stay engaged.',
          saturn?.sign ? `Saturn in ${saturn.sign} rewards discipline, long-range planning, and repeatable systems.` : 'Stable routines will outperform improvisation.',
        ],
      },
    },
  };
}
