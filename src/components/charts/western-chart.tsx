'use client';

import React, { useEffect, useRef } from 'react';
// @ts-ignore
import { Chart } from '@astrodraw/astrochart';

interface WesternChartProps {
  data: any;
}

const WesternChart: React.FC<WesternChartProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && data) {
      // Clear container
      containerRef.current.innerHTML = '<div id="western-birthchart"></div>';

      try {
        const chart = new Chart('western-birthchart', 600, 600, {
          SYMBOL_SCALE: 0.8,
          COLOR_BACKGROUND: "transparent",
          POINTS_COLOR: "#fff",
          SIGNS_COLOR: "#94a3b8",
          LINE_COLOR: "#7c3aed",
          MARGIN: 50
        });

        // Prep data for astrochart
        const formattedData = {
          planets: {
            Sun: [data.sun],
            Moon: [data.moon],
            Mercury: [data.mercury],
            Venus: [data.venus],
            Mars: [data.mars],
            Jupiter: [data.jupiter],
            Saturn: [data.saturn],
            Uranus: [data.uranus],
            Neptune: [data.neptune],
            Pluto: [data.pluto],
            Chiron: [data.chiron],
            Lilith: [data.lilith],
            NNode: [data.nnode]
          },
          cusps: data.houses
        };

        chart.radix(formattedData);
      } catch (err) {
        console.error("Error drawing western chart:", err);
      }
    }
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '32px', padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
    </div>
  );
};

export default WesternChart;
