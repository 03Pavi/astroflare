import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Divider } from "@mui/material";
import { Eye, EyeOff, Star, X } from "lucide-react";


type Planet = {
  name: string;
  degree: number;
  sign: string;
  house: number;
  retrograde: boolean;
};

type BirthChartDetails = {
  planets: Planet[];
  ascendant: string;
  sun_sign: string;
  moon_sign: string;
};

type BirthChartProps = {
  details?: BirthChartDetails | null;
};

type House = {
  id: number;
  path: string;
  textPos: { x: number; y: number };
  label: string;
};

/* ---------------- COMPONENT ---------------- */

const BirthChart: React.FC<BirthChartProps> = ({ details }) => {
  const [showNames, setShowNames] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  if (!details?.planets) return null;

  const { planets, ascendant, sun_sign, moon_sign } = details;

  const SIGN_NAMES = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
  ] as const;

  type SignName = (typeof SIGN_NAMES)[number];

  const SIGN_TO_NUMBER: Record<SignName, number> = SIGN_NAMES.reduce(
    (acc, name, i) => {
      acc[name] = i + 1;
      return acc;
    },
    {} as Record<SignName, number>
  );

  const ascendantNum = SIGN_TO_NUMBER[ascendant as SignName] || 1;

  /* ---------------- CLICK OUTSIDE ---------------- */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chartContainerRef.current &&
        !chartContainerRef.current.contains(event.target as Node)
      ) {
        setSelectedHouse(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- GROUP PLANETS ---------------- */

  const planetsByHouse = planets.reduce<Record<number, Planet[]>>((acc, p) => {
    if (!acc[p.house]) acc[p.house] = [];
    acc[p.house].push(p);
    return acc;
  }, {});

  /* ---------------- HOUSES ---------------- */

  const houses: House[] = [
    { id: 1, path: "M250,250 L125,125 L250,0 L375,125 Z", textPos: { x: 250, y: 85 }, label: "Lagna / Body & Identity" },
    { id: 2, path: "M125,125 L0,0 L250,0 Z", textPos: { x: 125, y: 35 }, label: "Wealth / Family / Speech" },
    { id: 3, path: "M125,125 L0,0 L0,250 Z", textPos: { x: 35, y: 125 }, label: "Siblings / Courage / Efforts" },
    { id: 4, path: "M250,250 L125,125 L0,250 L125,375 Z", textPos: { x: 85, y: 250 }, label: "Mother / Home / Comfort" },
    { id: 5, path: "M125,375 L0,250 L0,500 Z", textPos: { x: 35, y: 375 }, label: "Children / Creativity / Wisdom" },
    { id: 6, path: "M125,375 L0,500 L250,500 Z", textPos: { x: 125, y: 465 }, label: "Debts / Enemies / Health" },
    { id: 7, path: "M250,250 L125,375 L250,500 L375,375 Z", textPos: { x: 250, y: 415 }, label: "Partners / Marriage" },
    { id: 8, path: "M375,375 L250,500 L500,500 Z", textPos: { x: 375, y: 465 }, label: "Longevity / Transformation" },
    { id: 9, path: "M375,375 L500,500 L500,250 Z", textPos: { x: 465, y: 375 }, label: "Fortune / Higher Learning" },
    { id: 10, path: "M250,250 L375,375 L500,250 L375,125 Z", textPos: { x: 415, y: 250 }, label: "Career / Social Status" },
    { id: 11, path: "M375,125 L500,250 L500,0 Z", textPos: { x: 465, y: 125 }, label: "Gains / Social Circle" },
    { id: 12, path: "M375,125 L500,0 L250,0 Z", textPos: { x: 375, y: 35 }, label: "Losses / Spirituality" }
  ];

  const getSignForHouse = (houseIndex: number): string | number => {
    let num = (ascendantNum + houseIndex - 1) % 12;
    if (num === 0) num = 12;
    return showNames ? SIGN_NAMES[num - 1] : num;
  };

  const currentHouseData = houses.find((h) => h.id === selectedHouse);

  /* ---------------- JSX ---------------- */

  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2, md: 4 },
        bgcolor: "#0F172A",
        borderRadius: 4,
        border: "1px solid #1E293B",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        maxWidth: 900,
        width: "100%",
        mx: "auto"
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "flex-start" },
          gap: 2,
          mb: 4
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(245,158,11,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Star size={22} color="#F59E0B" />
            </Box>

            <Typography fontWeight={900} fontSize={28} color="white">
              Vedic Kundli
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 1,
              fontSize: 11,
              letterSpacing: 2,
              color: "#94A3B8",
              fontWeight: 800
            }}
          >
            {ascendant} ASCENDANT • NORTH INDIAN STYLE
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            gap: 2
          }}
        >
          <Button
            onClick={() => setShowNames((p) => !p)}
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700 }}
            startIcon={showNames ? <EyeOff size={16} /> : <Eye size={16} />}
          >
            {showNames ? "Sign Numbers" : "Sign Names"}
          </Button>

          <Divider orientation="vertical" flexItem />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Box sx={{ px: 1.5, py: 1, bgcolor: "rgba(245,158,11,.1)", borderRadius: 2 }}>
              <Typography fontSize={10} color="#F59E0B" fontWeight={900}>
                SUN SIGN
              </Typography>
              <Typography fontWeight={700} color="white">
                {sun_sign}
              </Typography>
            </Box>

            <Box sx={{ px: 1.5, py: 1, bgcolor: "rgba(34,211,238,.1)", borderRadius: 2 }}>
              <Typography fontSize={10} color="#22D3EE" fontWeight={900}>
                MOON SIGN
              </Typography>
              <Typography fontWeight={700} color="white">
                {moon_sign}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* SVG */}

      <Box ref={chartContainerRef} sx={{ display: "flex", justifyContent: "stretch", width: "100%" }}>
        <Box sx={{ width: "100%" }}>
          <svg viewBox="0 0 500 500" width="100%">
            <rect width="500" height="500" fill="transparent" onClick={() => setSelectedHouse(null)} />

            {houses.map((house) => {
              const isHovered = hoveredHouse === house.id;
              const isSelected = selectedHouse === house.id;

              return (
                <g
                  key={house.id}
                  onMouseEnter={() => setHoveredHouse(house.id)}
                  onMouseLeave={() => setHoveredHouse(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHouse(house.id === selectedHouse ? null : house.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <path
                    d={house.path}
                    fill={isSelected ? "rgba(245,158,11,.2)" : isHovered ? "rgba(245,158,11,.08)" : "#131C2E"}
                    stroke="#F59E0B"
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2 : 1.2}
                    strokeOpacity={isSelected || isHovered ? 1 : 0.25}
                  />

                  <text
                    x={house.textPos.x}
                    y={house.textPos.y}
                    textAnchor="middle"
                    fontWeight="900"
                    fontSize={showNames ? 10 : 15}
                    fill={isSelected || isHovered ? "#F59E0B" : "#475569"}
                  >
                    {getSignForHouse(house.id)}
                  </text>
                </g>
              );
            })}
          </svg>
        </Box>
      </Box>
    </Box>
  );
};

export default BirthChart;
