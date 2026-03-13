import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Modal, 
  Fade, 
  Backdrop, 
  Chip, 
  Stack,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Close as CloseIcon
} from '@mui/icons-material';

/** * Types and Interfaces 
 */
interface Planet {
  name: string;
  degree: number;
  sign: string;
  house: number;
  retrograde: boolean;
}

interface BirthChartDetails {
  success: boolean;
  ascendant: string;
  planets: Planet[];
  sun_sign: string;
  moon_sign: string;
}

interface BirthChartProps {
  details: BirthChartDetails;
}

interface HousePath {
  id: number;
  path: string;
  textPos: { x: number; y: number };
  label: string;
}

const BirthChart: React.FC<BirthChartProps> = ({ details }) => {
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const theme = useTheme();

  if (!details || !details.planets) return null;

  const { planets, ascendant, sun_sign, moon_sign } = details;

  const SIGN_NAMES: string[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const SIGN_TO_NUMBER: Record<string, number> = SIGN_NAMES.reduce((acc, name, i) => {
    acc[name] = i + 1;
    return acc;
  }, {} as Record<string, number>);

  const ascendantNum: number = SIGN_TO_NUMBER[ascendant] || 1;

  const planetsByHouse: Record<number, Planet[]> = planets.reduce((acc, planet) => {
    if (!acc[planet.house]) acc[planet.house] = [];
    acc[planet.house].push(planet);
    return acc;
  }, {} as Record<number, Planet[]>);

  const houses: HousePath[] = [
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

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const currentHouseData = houses.find(h => h.id === selectedHouse);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, md: 4 }, 
          bgcolor: 'background.paper', 
          border: '1px solid', 
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow effects */}
        <Box sx={{ position: 'absolute', top: -100, left: -100, width: 250, height: 250, bgcolor: 'primary.main', opacity: 0.05, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Chart SVG */}
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mt: { xs: 0.25, md: 1 } }}>
          <Box sx={{ width: '100%', maxWidth: 550 }}>
            <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto' }}>
              <rect width="500" height="500" fill="transparent" onClick={() => setSelectedHouse(null)} style={{ cursor: 'default' }} />
              
            {houses.map((house) => {
                const isHovered = hoveredHouse === house.id;
                const isSelected = selectedHouse === house.id;
                const chipBoxWidth = 116;
                const chipBoxHeight = 92;
                const defaultChipY = house.id === 1 ? house.textPos.y + 10 : house.id === 7 ? house.textPos.y - 65 : house.textPos.y - 12;
                const chipX = clamp(house.textPos.x - chipBoxWidth / 2, 4, 500 - chipBoxWidth - 4);
                const chipY = clamp(defaultChipY, 4, 500 - chipBoxHeight - 4);
                
                return (
                  <g 
                    key={house.id} 
                    onMouseEnter={() => setHoveredHouse(house.id)}
                    onMouseLeave={() => setHoveredHouse(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHouse(house.id === selectedHouse ? null : house.id);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <path 
                      d={house.path} 
                      fill={isSelected ? "rgba(245, 158, 11, 0.2)" : isHovered ? "rgba(245, 158, 11, 0.1)" : "rgba(22, 35, 58, 0.52)"} 
                      stroke={isSelected || isHovered ? theme.palette.primary.main : theme.palette.primary.main} 
                      strokeWidth={isSelected ? "3.5" : isHovered ? "2.3" : "1.8"} 
                      strokeOpacity={isSelected || isHovered ? "1" : "0.65"}
                      style={{ transition: 'all 0.2s' }}
                    />
                    
                    <text 
                      x={house.textPos.x} 
                      y={house.textPos.y} 
                      fill={isSelected || isHovered ? "#FBBF24" : "#D1E3FB"} 
                      fontSize="20" 
                      fontWeight="900" 
                      textAnchor="middle"
                      stroke="rgba(15, 23, 42, 0.9)"
                      strokeWidth="1"
                      paintOrder="stroke"
                      style={{ transition: 'all 0.2s', pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {house.id}
                    </text>
                    
                    <foreignObject 
                      x={chipX}
                      y={chipY}
                      width={chipBoxWidth}
                      height={chipBoxHeight}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px', padding: '4px', background: 'rgba(15, 23, 42, 0.24)', borderRadius: '8px' }}>
                        {planetsByHouse[house.id]?.map((p) => (
                          <span 
                            key={p.name}
                            style={{
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.02em',
                              padding: '3px 6px',
                              borderRadius: '7px',
                              background: p.name === 'Sun' ? 'rgba(245,158,11,0.28)' : p.name === 'Moon' ? 'rgba(34,211,238,0.26)' : 'rgba(71, 85, 105, 0.92)',
                              color: p.name === 'Sun' ? '#FCD34D' : p.name === 'Moon' ? '#67E8F9' : '#E2E8F0',
                              border: `1px solid ${p.name === 'Sun' ? 'rgba(245,158,11,0.5)' : p.name === 'Moon' ? 'rgba(34,211,238,0.5)' : 'rgba(148, 163, 184, 0.65)'}`,
                              opacity: 1,
                              transform: isSelected ? 'scale(1.1)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {p.name.substring(0, 2)}{p.retrograde ? 'R' : ''}
                          </span>
                        ))}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </Box>
        </Box>
      </Paper>

      {/* MUI Modal for House Details */}
      <Modal
        open={Boolean(selectedHouse)}
        onClose={() => setSelectedHouse(null)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(2, 6, 23, 0.7)' }
          }
        }}
      >
        <Fade in={Boolean(selectedHouse)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'primary.main',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            p: 4,
            borderRadius: 1,
            outline: 'none'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 900, letterSpacing: 2 }}>
                  House {selectedHouse}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {currentHouseData?.label}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedHouse(null)} size="small" sx={{ bgcolor: 'action.hover' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Occupied Sign
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={SIGN_NAMES[((ascendantNum + (selectedHouse || 1) - 2) % 12 + 12) % 12]} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                  sx={{ fontWeight: 900, borderStyle: 'dashed' }}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
              Planets Present
            </Typography>

            <Stack spacing={1.5}>
              {selectedHouse !== null && planetsByHouse[selectedHouse]?.length > 0 ? (
                planetsByHouse[selectedHouse].map(p => (
                  <Paper 
                    key={p.name} 
                    variant="outlined" 
                    sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(15, 23, 42, 0.5)', borderRadius: 3 }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: p.name === 'Sun' ? 'primary.main' : p.name === 'Moon' ? '#22D3EE' : 'text.disabled',
                        boxShadow: p.name === 'Sun' ? '0 0 10px #F59E0B' : 'none'
                      }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {p.name} {p.retrograde ? '(Rx)' : ''}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                      {p.degree.toFixed(2)}°
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', textAlign: 'center', py: 2 }}>
                  This house is currently empty
                </Typography>
              )}
            </Stack>

            <Typography variant="caption" sx={{ mt: 3, display: 'block', textAlign: 'center', color: 'text.disabled' }}>
              Click background to dismiss
            </Typography>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};
export default BirthChart
