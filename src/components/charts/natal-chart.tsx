'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Planet = {
  name?: string;
  degree?: number;
  house?: number;
  retrograde?: boolean;
};

type ChartDetails = {
  planets?: Planet[];
  ascendant?: string;
  sun_sign?: string;
  moon_sign?: string;
};

type NatalChartProps = {
  details: ChartDetails;
};

const SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const HOUSES = [
  { id: 1, path: 'M250,250 L125,125 L250,0 L375,125 Z', textPos: { x: 250, y: 85 }, label: 'Lagna / Body & Identity' },
  { id: 2, path: 'M125,125 L0,0 L250,0 Z', textPos: { x: 125, y: 35 }, label: 'Wealth / Family / Speech' },
  { id: 3, path: 'M125,125 L0,0 L0,250 Z', textPos: { x: 35, y: 125 }, label: 'Siblings / Courage / Efforts' },
  { id: 4, path: 'M250,250 L125,125 L0,250 L125,375 Z', textPos: { x: 85, y: 250 }, label: 'Mother / Home / Comfort' },
  { id: 5, path: 'M125,375 L0,250 L0,500 Z', textPos: { x: 35, y: 375 }, label: 'Children / Creativity / Wisdom' },
  { id: 6, path: 'M125,375 L0,500 L250,500 Z', textPos: { x: 125, y: 465 }, label: 'Debts / Enemies / Health' },
  { id: 7, path: 'M250,250 L125,375 L250,500 L375,375 Z', textPos: { x: 250, y: 415 }, label: 'Partners / Marriage' },
  { id: 8, path: 'M375,375 L250,500 L500,500 Z', textPos: { x: 375, y: 465 }, label: 'Longevity / Transformation' },
  { id: 9, path: 'M375,375 L500,500 L500,250 Z', textPos: { x: 465, y: 375 }, label: 'Fortune / Higher Learning' },
  { id: 10, path: 'M250,250 L375,375 L500,250 L375,125 Z', textPos: { x: 415, y: 250 }, label: 'Career / Social Status' },
  { id: 11, path: 'M375,125 L500,250 L500,0 Z', textPos: { x: 465, y: 125 }, label: 'Gains / Social Circle' },
  { id: 12, path: 'M375,125 L500,0 L250,0 Z', textPos: { x: 375, y: 35 }, label: 'Losses / Spirituality' },
] as const;

function getPlanetCode(name?: string) {
  const codes: Record<string, string> = {
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
    Rahu: 'Ra',
    Ketu: 'Ke',
    Uranus: 'Ur',
    Neptune: 'Ne',
    Pluto: 'Pl',
  };

  return codes[name || ''] || (name || '?').slice(0, 2);
}

export default function NatalChart({ details }: NatalChartProps) {
  const [showNames, setShowNames] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const planets = useMemo(
    () => (Array.isArray(details?.planets) ? details.planets.filter((planet) => planet?.name && planet.name !== 'ayanamsa') : []),
    [details]
  );

  const ascendant = details?.ascendant || 'Aries';
  const sunSign = details?.sun_sign || 'Unknown';
  const moonSign = details?.moon_sign || 'Unknown';
  const signToNumber = useMemo(
    () =>
      SIGN_NAMES.reduce<Record<string, number>>((accumulator, name, index) => {
        accumulator[name] = index + 1;
        return accumulator;
      }, {}),
    []
  );
  const ascendantNum = signToNumber[ascendant] || 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chartContainerRef.current &&
        !chartContainerRef.current.contains(event.target as Node)
      ) {
        setSelectedHouse(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const planetsByHouse = useMemo(
    () =>
      planets.reduce<Record<number, Planet[]>>((accumulator, planet) => {
        const house = planet.house || 0;
        if (!house) return accumulator;
        if (!accumulator[house]) accumulator[house] = [];
        accumulator[house].push(planet);
        return accumulator;
      }, {}),
    [planets]
  );

  const getSignForHouse = (houseIndex: number) => {
    let signNumber = (ascendantNum + houseIndex - 1) % 12;
    if (signNumber === 0) signNumber = 12;
    return showNames ? SIGN_NAMES[signNumber - 1] : String(signNumber);
  };

  const currentHouse = HOUSES.find((house) => house.id === selectedHouse) || null;
  const currentHouseSign =
    selectedHouse !== null
      ? SIGN_NAMES[(ascendantNum + selectedHouse - 2 + 12) % 12]
      : null;

  if (!details || planets.length === 0) return null;

  return (
    <div
      ref={chartContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '760px',
        margin: '0 auto',
        padding: '1rem',
        borderRadius: '28px',
        background: '#0f172a',
        border: '1px solid rgba(51, 65, 85, 0.9)',
        boxShadow: '0 24px 80px rgba(2, 6, 23, 0.55)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-6rem',
          left: '-5rem',
          width: '16rem',
          height: '16rem',
          borderRadius: '999px',
          background: 'rgba(245, 158, 11, 0.09)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-5rem',
          bottom: '-6rem',
          width: '16rem',
          height: '16rem',
          borderRadius: '999px',
          background: 'rgba(34, 211, 238, 0.08)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowNames((value) => !value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.7rem 0.95rem',
                borderRadius: '14px',
                border: '1px solid rgba(51, 65, 85, 1)',
                background: 'rgba(30, 41, 59, 0.55)',
                color: '#cbd5e1',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {showNames ? 'Sign Numbers' : 'Sign Names'}
            </button>

            <div style={{ display: 'flex', gap: '0.55rem' }}>
              <div
                style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <span style={{ display: 'block', color: '#f59e0b', fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  Sun Sign (Surya)
                </span>
                <span style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 800 }}>{sunSign}</span>
              </div>
              <div
                style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: '14px',
                  background: 'rgba(34, 211, 238, 0.06)',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                }}
              >
                <span style={{ display: 'block', color: '#22d3ee', fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  Moon Sign (Chandra)
                </span>
                <span style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 800 }}>{moonSign}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '0.5rem 0 0.25rem' }}>
          {selectedHouse && currentHouse ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(92%, 360px)',
                zIndex: 20,
                background: 'rgba(30, 41, 59, 0.96)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '24px',
                padding: '1.2rem',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
                <div>
                  <span style={{ display: 'block', color: '#f59e0b', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                    House {selectedHouse}
                  </span>
                  <h4 style={{ margin: '0.35rem 0 0', color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
                    {currentHouse.label}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedHouse(null)}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  x
                </button>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  padding: '0.35rem 0.55rem',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                  color: '#fbbf24',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Occupied Sign: {currentHouseSign}
              </div>

              <div style={{ display: 'grid', gap: '0.55rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  Planets in this house
                </span>
                {(planetsByHouse[selectedHouse] || []).length > 0 ? (
                  planetsByHouse[selectedHouse].map((planet) => (
                    <div
                      key={planet.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.85rem 0.95rem',
                        borderRadius: '18px',
                        background: 'rgba(2, 6, 23, 0.45)',
                        border: '1px solid rgba(51, 65, 85, 0.75)',
                      }}
                    >
                      <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.92rem' }}>
                        {planet.name} {planet.retrograde ? '(Rx)' : ''}
                      </span>
                      <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.78rem' }}>
                        {typeof planet.degree === 'number' ? `${planet.degree.toFixed(2)}°` : '--'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '0.9rem',
                      textAlign: 'center',
                      borderRadius: '18px',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      border: '1px dashed rgba(51, 65, 85, 0.85)',
                    }}
                  >
                    This house is empty
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div style={{ width: '100%', maxWidth: '620px', transition: 'all 0.2s ease' }}>
            <svg viewBox="0 0 500 500" width="100%" role="img" aria-label="North Indian natal chart">
              <rect width="500" height="500" fill="transparent" onClick={() => setSelectedHouse(null)} />

              {HOUSES.map((house) => {
                const isHovered = hoveredHouse === house.id;
                const isSelected = selectedHouse === house.id;
                const signLabel = getSignForHouse(house.id);

                return (
                  <g
                    key={house.id}
                    onMouseEnter={() => setHoveredHouse(house.id)}
                    onMouseLeave={() => setHoveredHouse(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedHouse((current) => (current === house.id ? null : house.id));
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <path
                      d={house.path}
                      fill={
                        isSelected
                          ? 'rgba(245, 158, 11, 0.18)'
                          : isHovered
                            ? 'rgba(245, 158, 11, 0.08)'
                            : '#131c2e'
                      }
                      stroke="#f59e0b"
                      strokeWidth={isSelected ? 3.5 : isHovered ? 2 : 1.2}
                      strokeOpacity={isSelected || isHovered ? 1 : 0.25}
                    />

                    <text
                      x={house.textPos.x}
                      y={house.textPos.y}
                      fill={isSelected || isHovered ? '#f59e0b' : '#475569'}
                      fontSize={showNames ? '10' : '15'}
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {signLabel}
                    </text>

                    <foreignObject
                      x={house.textPos.x - 45}
                      y={
                        house.id === 1
                          ? house.textPos.y + 10
                          : house.id === 7
                            ? house.textPos.y - 65
                            : house.textPos.y - 10
                      }
                      width="90"
                      height="80"
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '4px',
                        }}
                      >
                        {(planetsByHouse[house.id] || []).map((planet) => (
                          <div
                            key={planet.name}
                            style={{
                              fontSize: '9px',
                              fontWeight: 900,
                              padding: '2px 6px',
                              borderRadius: '8px',
                              border: `1px solid ${planet.name === 'Sun'
                                  ? 'rgba(245, 158, 11, 0.45)'
                                  : planet.name === 'Moon'
                                    ? 'rgba(34, 211, 238, 0.45)'
                                    : 'rgba(71, 85, 105, 1)'
                                }`,
                              background:
                                planet.name === 'Sun'
                                  ? 'rgba(245, 158, 11, 0.16)'
                                  : planet.name === 'Moon'
                                    ? 'rgba(34, 211, 238, 0.16)'
                                    : 'rgba(30, 41, 59, 0.92)',
                              color:
                                planet.name === 'Sun'
                                  ? '#f59e0b'
                                  : planet.name === 'Moon'
                                    ? '#22d3ee'
                                    : '#cbd5e1',
                              transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            }}
                          >
                            {getPlanetCode(planet.name)}{planet.retrograde ? 'R' : ''}
                          </div>
                        ))}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
