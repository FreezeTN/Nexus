import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { DiceSkin } from './diceSkins';

interface PolyhedralDieProps {
  dieType: number;
  value: number;
  skin: DiceSkin;
  isRolling: boolean;
  size?: number;
}

export const PolyhedralDie: React.FC<PolyhedralDieProps> = ({
  dieType,
  value,
  skin,
  isRolling,
  size = 110
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isNat20 = dieType === 20 && value === 20;
  const isNat1 = dieType === 20 && value === 1;

  // Compute theme colors and facet shader gradients
  const theme = getSkinShaderTheme(skin.id);

  // Check for custom critical icons
  const renderSpecialEmblem = isNat20 && skin.specialNat20Icon;
  const renderSpecialFumbleEmblem = isNat1 && skin.specialNat1Icon;

  // Interactive 3D tilt tracking for tactile feel
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isRolling) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // -10 to +10 deg
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setTilt({ x: y, y: x });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        width: size,
        height: size,
        perspective: 900
      }}
      className="relative flex items-center justify-center select-none cursor-pointer group bg-transparent"
    >
      {/* 1. Realistic Soft Ambient Ground Contact Shadow */}
      <motion.div
        animate={{
          scale: isRolling ? [1, 0.6, 1.15, 0.7, 1] : isHovered ? 1.08 : 1,
          opacity: isRolling ? [0.5, 0.2, 0.6, 0.25, 0.55] : 0.55
        }}
        transition={{ duration: isRolling ? 0.65 : 0.2 }}
        className="absolute -bottom-2.5 w-[76%] h-3.5 bg-black/75 blur-[5px] rounded-full pointer-events-none z-0"
      />

      {/* 2. Main 3D Tumbling Body with Parallax & Physical Lighting */}
      <motion.div
        animate={{
          rotate: isRolling ? [0, 45, 120, 210, 310, 360, 420, 720] : 0,
          scale: isRolling ? [1, 1.12, 0.95, 1.08, 1] : 1,
          y: isRolling ? [0, -18, 4, -8, 0] : 0,
          rotateX: isRolling ? 0 : tilt.x,
          rotateY: isRolling ? 0 : tilt.y
        }}
        transition={{
          duration: isRolling ? 0.65 : 0.15,
          ease: 'easeOut'
        }}
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        className={`relative flex items-center justify-center bg-transparent ${
          isNat20
            ? 'drop-shadow-[0_0_22px_rgba(251,191,36,0.85)]'
            : isNat1
            ? 'drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]'
            : theme.glowFilter
        }`}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible bg-transparent"
        >
          <defs>
            {/* Clip masks for die silhouettes */}
            <clipPath id="clip-d20-clean">
              <polygon points="60,6 106,34 106,86 60,114 14,86 14,34" />
            </clipPath>
            <clipPath id="clip-d12-clean">
              <polygon points="60,8 106,38 90,92 30,92 14,38" />
            </clipPath>
            <clipPath id="clip-d10-clean">
              <polygon points="60,6 108,44 60,114 12,44" />
            </clipPath>
            <clipPath id="clip-d8-clean">
              <polygon points="60,8 110,60 60,112 10,60" />
            </clipPath>
            <clipPath id="clip-d6-clean">
              <polygon points="60,14 104,36 104,84 60,106 16,84 16,36" />
            </clipPath>
            <clipPath id="clip-d4-clean">
              <polygon points="60,10 110,98 10,98" />
            </clipPath>

            {/* LIGHTING & SHADING GRADIENTS (Keylight from Top-Left ~135°) */}
            
            {/* 1. Center Facet: Primary facing facet with rich depth and subtle specular highlight */}
            <radialGradient id={`rad-center-${skin.id}`} cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor={theme.centerFacet[0]} />
              <stop offset="60%" stopColor={theme.centerFacet[1]} />
              <stop offset="100%" stopColor={theme.centerFacet[2] || theme.centerFacet[1]} />
            </radialGradient>

            {/* 2. Top-Left / Sky Facet: Receives direct overhead keylight */}
            <linearGradient id={`grad-top-light-${skin.id}`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={theme.topLightFacet[0]} />
              <stop offset="100%" stopColor={theme.topLightFacet[1]} />
            </linearGradient>

            {/* 3. Top-Right Facet: Direct sky light slightly tilted away */}
            <linearGradient id={`grad-top-right-${skin.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={theme.topRightFacet[0]} />
              <stop offset="100%" stopColor={theme.topRightFacet[1]} />
            </linearGradient>

            {/* 4. Left Mid Facet: Key light illumination */}
            <linearGradient id={`grad-left-mid-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.leftMidFacet[0]} />
              <stop offset="100%" stopColor={theme.leftMidFacet[1]} />
            </linearGradient>

            {/* 5. Right Mid Facet: Shadow falloff */}
            <linearGradient id={`grad-right-mid-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.rightMidFacet[0]} />
              <stop offset="100%" stopColor={theme.rightMidFacet[1]} />
            </linearGradient>

            {/* 6. Lower Shadow Facets: Ambient occlusion / ground reflection */}
            <linearGradient id={`grad-bottom-shadow-${skin.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.bottomShadowFacet[0]} />
              <stop offset="100%" stopColor={theme.bottomShadowFacet[1]} />
            </linearGradient>

            {/* Inked Gold Foil Leaf */}
            <linearGradient id="ink-gold-foil" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffdf0" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            {/* Inked Platinum / Polished Silver */}
            <linearGradient id="ink-silver-foil" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Polished Acrylic Curved Specular Glint */}
            <linearGradient id="acrylic-glint" x1="0%" y1="0%" x2="70%" y2="90%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Render Geometry */}
          {dieType === 20 ? (
            <CleanD20Geometry skin={skin} theme={theme} />
          ) : dieType === 12 ? (
            <CleanD12Geometry skin={skin} theme={theme} />
          ) : dieType === 10 || dieType === 100 ? (
            <CleanD10Geometry skin={skin} theme={theme} />
          ) : dieType === 8 ? (
            <CleanD8Geometry skin={skin} theme={theme} />
          ) : dieType === 6 ? (
            <CleanD6Geometry skin={skin} theme={theme} />
          ) : (
            <CleanD4Geometry skin={skin} theme={theme} />
          )}

          {/* Curved Specular Glint Across Upper Acrylic Dome */}
          <g clipPath={`url(#clip-${dieType === 20 ? 'd20' : dieType === 12 ? 'd12' : dieType === 10 || dieType === 100 ? 'd10' : dieType === 8 ? 'd8' : dieType === 6 ? 'd6' : 'd4'}-clean)`} className="pointer-events-none">
            <ellipse
              cx="45"
              cy="25"
              rx="40"
              ry="22"
              transform="rotate(-15 45 25)"
              fill="url(#acrylic-glint)"
            />
          </g>

          {/* Central Face Inked Number or Critical Emblem */}
          {renderSpecialEmblem === 'moon' ? (
            <g id="lunar-nat20-crest" transform="translate(60, 62) scale(0.95)">
              <circle cx="0" cy="0" r="14" fill="rgba(34, 211, 238, 0.2)" />
              <path
                d="M -3 -12 C 4 -12 10 -6 10 2 C 10 10 4 16 -4 16 C 0 13 2 8 2 2 C 2 -4 0 -9 -3 -12 Z"
                fill="#ffffff"
                filter="drop-shadow(0 0 5px rgba(34, 211, 238, 0.9))"
              />
              <circle cx="-5" cy="-2" r="1.5" fill="#a5f3fc" />
            </g>
          ) : renderSpecialEmblem === 'lightning' ? (
            <g id="storm-nat20-crest" transform="translate(60, 62) scale(0.95)">
              <circle cx="0" cy="0" r="14" fill="rgba(56, 189, 248, 0.25)" />
              <path
                d="M 2 -13 L -7 0 L 0 0 L -4 13 L 7 -1 L 0 -1 Z"
                fill="#ffffff"
                stroke="#38bdf8"
                strokeWidth="1.2"
                filter="drop-shadow(0 0 6px rgba(56, 189, 248, 0.9))"
              />
            </g>
          ) : renderSpecialFumbleEmblem === 'skull' ? (
            <g id="eldritch-fumble-skull" transform="translate(60, 62) scale(0.9)">
              <path
                d="M -8 -8 C -8 -13 8 -13 8 -8 C 8 -4 6 -2 6 2 L 4 6 L -4 6 L -6 2 C -6 -2 -8 -4 -8 -8 Z"
                fill="#ffffff"
                filter="drop-shadow(0 0 5px rgba(239, 68, 68, 0.8))"
              />
              <circle cx="-3" cy="-7" r="2" fill="#1c1917" />
              <circle cx="3" cy="-7" r="2" fill="#1c1917" />
              <path d="M 0 -3.5 L -1 -1.5 L 1 -1.5 Z" fill="#1c1917" />
              <line x1="-3" y1="4" x2="-3" y2="6" stroke="#1c1917" strokeWidth="1" />
              <line x1="0" y1="4" x2="0" y2="6" stroke="#1c1917" strokeWidth="1" />
              <line x1="3" y1="4" x2="3" y2="6" stroke="#1c1917" strokeWidth="1" />
            </g>
          ) : (
            <g id="engraved-inked-numeral">
              {/* Deep debossed inner bevel shadow */}
              <text
                x="60.6"
                y={dieType === 20 ? "64.2" : dieType === 6 ? "61.2" : "62.2"}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-serif select-none pointer-events-none"
                style={{
                  fontSize: value >= 100 ? '20px' : dieType === 20 ? '26px' : '28px',
                  fontWeight: 900,
                  fill: 'rgba(0,0,0,0.85)'
                }}
              >
                {value}
              </text>
              {/* Lower edge specular reflection */}
              <text
                x="59.6"
                y={dieType === 20 ? "62.2" : dieType === 6 ? "59.2" : "60.2"}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-serif select-none pointer-events-none"
                style={{
                  fontSize: value >= 100 ? '20px' : dieType === 20 ? '26px' : '28px',
                  fontWeight: 900,
                  fill: 'rgba(255,255,255,0.45)'
                }}
              >
                {value}
              </text>
              {/* Main Inked Face */}
              <text
                x="60"
                y={dieType === 20 ? "63" : dieType === 6 ? "60" : "61"}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-serif select-none pointer-events-none tracking-tight"
                style={{
                  fontSize: value >= 100 ? '20px' : dieType === 20 ? '26px' : '28px',
                  fontWeight: 900,
                  fill: isNat20
                    ? '#fef08a'
                    : isNat1
                    ? '#ffffff'
                    : theme.useGoldFoil
                    ? 'url(#ink-gold-foil)'
                    : theme.useSilverFoil
                    ? 'url(#ink-silver-foil)'
                    : theme.textColor,
                  filter: `drop-shadow(0 1px 2px ${theme.textShadow})`
                }}
              >
                {value}
              </text>
            </g>
          )}

          {/* Underline for 6 and 9 to eliminate ambiguity on polyhedral dice */}
          {!renderSpecialEmblem && !renderSpecialFumbleEmblem && (value === 6 || value === 9) && (
            <line
              x1="52"
              y1={dieType === 20 ? "73" : "71"}
              x2="68"
              y2={dieType === 20 ? "73" : "71"}
              stroke={theme.useGoldFoil ? '#fde047' : theme.useSilverFoil ? '#ffffff' : theme.textColor}
              strokeWidth="2"
              strokeLinecap="round"
              filter={`drop-shadow(0px 1px 1px ${theme.textShadow})`}
            />
          )}
        </svg>
      </motion.div>
    </div>
  );
};

/* =========================================================================
   AUTHENTIC 3D POLYHEDRAL GEOMETRIES (Strict isometric projections)
   ========================================================================= */

interface GeometryProps {
  skin: DiceSkin;
  theme: SkinShaderTheme;
}

/**
 * Mathematically accurate 3D regular icosahedron viewed facing a central facet:
 * Vertices:
 * - Center Triangle: C_Top(60, 32), C_Right(88, 78), C_Left(32, 78)
 * - Outer Hexagon: Top(60, 6), TopRight(106, 34), BotRight(106, 86), Bot(60, 114), BotLeft(14, 86), TopLeft(14, 34)
 */
const CleanD20Geometry: React.FC<GeometryProps> = ({ skin, theme }) => {
  return (
    <g id="d20-mesh" strokeLinejoin="round" strokeLinecap="round">
      {/* 1. Base Silhouette Fill */}
      <polygon
        points="60,6 106,34 106,86 60,114 14,86 14,34"
        fill={`url(#grad-bottom-shadow-${skin.id})`}
      />

      {/* 2. Visible Facets (10 facets visible in perspective) */}
      {/* Facet 1: Top-Left Sky Facet */}
      <polygon points="60,6 14,34 60,32" fill={`url(#grad-top-light-${skin.id})`} />

      {/* Facet 2: Top-Right Sky Facet */}
      <polygon points="60,6 106,34 60,32" fill={`url(#grad-top-right-${skin.id})`} />

      {/* Facet 3: Upper-Left Keylight Facet */}
      <polygon points="14,34 60,32 32,78" fill={`url(#grad-left-mid-${skin.id})`} />

      {/* Facet 4: Upper-Right Midtone Facet */}
      <polygon points="106,34 60,32 88,78" fill={`url(#grad-right-mid-${skin.id})`} />

      {/* Facet 5: Lower-Left Side Facet */}
      <polygon points="14,34 14,86 32,78" fill={`url(#grad-left-mid-${skin.id})`} />

      {/* Facet 6: Lower-Right Side Facet */}
      <polygon points="106,34 106,86 88,78" fill={`url(#grad-right-mid-${skin.id})`} />

      {/* Facet 7: Bottom-Left Base Facet */}
      <polygon points="14,86 60,114 32,78" fill={`url(#grad-bottom-shadow-${skin.id})`} />

      {/* Facet 8: Bottom-Right Base Facet */}
      <polygon points="106,86 60,114 88,78" fill={`url(#grad-bottom-shadow-${skin.id})`} />

      {/* Facet 9: Bottom-Center Underside Facet */}
      <polygon points="32,78 88,78 60,114" fill={`url(#grad-bottom-shadow-${skin.id})`} />

      {/* Facet 10: Primary Central Face (Centroid facing camera) */}
      <polygon
        points="60,32 88,78 32,78"
        fill={`url(#rad-center-${skin.id})`}
      />

      {/* Internal Material Swirls for Resin & Marbled styles */}
      <g clipPath="url(#clip-d20-clean)" opacity="0.35" fill="none">
        {skin.materialType === 'resin_swirl' && (
          <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
            <path d="M 20 40 Q 55 20 80 48 Q 95 65 68 88 Q 35 98 25 72" />
            <path d="M 40 18 Q 72 45 52 75 Q 38 95 62 108" strokeWidth="2" />
          </g>
        )}
        {skin.materialType === 'marble_noir' && (
          <g stroke="#f472b6" strokeWidth="2" strokeLinecap="round">
            <path d="M 18 28 Q 42 48 38 72 Q 62 70 92 98" />
            <path d="M 58 12 Q 74 42 98 62" strokeWidth="1.5" />
          </g>
        )}
      </g>

      {/* Facet Seams (Dark structural groove lines) */}
      <g stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" fill="none">
        <polygon points="60,6 106,34 106,86 60,114 14,86 14,34" />
        <line x1="60" y1="6" x2="60" y2="32" />
        <line x1="14" y1="34" x2="60" y2="32" />
        <line x1="106" y1="34" x2="60" y2="32" />
        <line x1="14" y1="34" x2="32" y2="78" />
        <line x1="106" y1="34" x2="88" y2="78" />
        <line x1="14" y1="86" x2="32" y2="78" />
        <line x1="106" y1="86" x2="88" y2="78" />
        <line x1="60" y1="114" x2="32" y2="78" />
        <line x1="60" y1="114" x2="88" y2="78" />
        <polygon points="60,32 88,78 32,78" strokeWidth="1.5" stroke="rgba(0,0,0,0.5)" />
      </g>

      {/* Chamfered Specular Edge Glints (Top & left light-catching bevels) */}
      <g stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="60" y1="6" x2="14" y2="34" />
        <line x1="14" y1="34" x2="60" y2="32" />
        <line x1="60" y1="6" x2="60" y2="32" />
        <line x1="60" y1="32" x2="32" y2="78" />
        <line x1="14" y1="34" x2="14" y2="86" opacity="0.5" />
      </g>
    </g>
  );
};

// Clean D12 Dodecahedron
const CleanD12Geometry: React.FC<GeometryProps> = ({ skin, theme }) => {
  return (
    <g id="d12-mesh" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="60,8 106,38 90,92 30,92 14,38" fill={`url(#grad-bottom-shadow-${skin.id})`} />
      <polygon points="60,8 106,38 88,48 60,30 32,48" fill={`url(#grad-top-light-${skin.id})`} />
      <polygon points="106,38 90,92 78,74 88,48" fill={`url(#grad-right-mid-${skin.id})`} />
      <polygon points="90,92 30,92 42,74 78,74" fill={`url(#grad-bottom-shadow-${skin.id})`} />
      <polygon points="30,92 14,38 32,48 42,74" fill={`url(#grad-left-mid-${skin.id})`} />
      <polygon points="60,30 88,48 78,74 42,74 32,48" fill={`url(#rad-center-${skin.id})`} />
      
      {/* Seams & Edge highlights */}
      <g stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" fill="none">
        <polygon points="60,8 106,38 90,92 30,92 14,38" />
        <polygon points="60,30 88,48 78,74 42,74 32,48" />
      </g>
      <g stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="60" y1="8" x2="14" y2="38" />
        <line x1="14" y1="38" x2="32" y2="48" />
        <line x1="32" y1="48" x2="60" y2="30" />
        <line x1="60" y1="8" x2="60" y2="30" />
      </g>
    </g>
  );
};

// Clean D10 Decahedron
const CleanD10Geometry: React.FC<GeometryProps> = ({ skin, theme }) => {
  return (
    <g id="d10-mesh" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="60,6 108,44 60,114 12,44" fill={`url(#grad-bottom-shadow-${skin.id})`} />
      <polygon points="60,6 108,44 60,60" fill={`url(#grad-top-right-${skin.id})`} />
      <polygon points="108,44 60,114 60,60" fill={`url(#grad-right-mid-${skin.id})`} />
      <polygon points="60,114 12,44 60,60" fill={`url(#grad-bottom-shadow-${skin.id})`} />
      <polygon points="12,44 60,6 60,60" fill={`url(#grad-top-light-${skin.id})`} />
      
      {/* Central Inset Face */}
      <polygon points="36,44 60,26 84,44 60,88" fill={`url(#rad-center-${skin.id})`} />

      {/* Seams & Bevels */}
      <g stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" fill="none">
        <polygon points="60,6 108,44 60,114 12,44" />
        <line x1="60" y1="6" x2="60" y2="114" />
        <line x1="12" y1="44" x2="108" y2="44" />
      </g>
      <g stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="60" y1="6" x2="12" y2="44" />
        <line x1="60" y1="6" x2="60" y2="60" />
        <line x1="12" y1="44" x2="60" y2="60" />
      </g>
    </g>
  );
};

// Clean D8 Octahedron
const CleanD8Geometry: React.FC<GeometryProps> = ({ skin, theme }) => {
  return (
    <g id="d8-mesh" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="60,8 110,60 60,112 10,60" fill={`url(#grad-bottom-shadow-${skin.id})`} />
      <polygon points="60,8 110,60 60,60" fill={`url(#grad-top-right-${skin.id})`} />
      <polygon points="110,60 60,112 60,60" fill={`url(#grad-right-mid-${skin.id})`} />
      <polygon points="60,112 10,60 60,60" fill={`url(#grad-bottom-shadow-${skin.id})`} />
      <polygon points="10,60 60,8 60,60" fill={`url(#grad-top-light-${skin.id})`} />

      {/* Center Primary Facet */}
      <polygon points="60,20 95,60 60,60" fill={`url(#rad-center-${skin.id})`} opacity="0.6" />

      {/* Seams & Bevels */}
      <g stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" fill="none">
        <polygon points="60,8 110,60 60,112 10,60" />
        <line x1="60" y1="8" x2="60" y2="112" />
        <line x1="10" y1="60" x2="110" y2="60" />
      </g>
      <g stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="60" y1="8" x2="10" y2="60" />
        <line x1="60" y1="8" x2="60" y2="60" />
        <line x1="10" y1="60" x2="60" y2="60" />
      </g>
    </g>
  );
};

// Clean D6 Cube
const CleanD6Geometry: React.FC<GeometryProps> = ({ skin, theme }) => {
  return (
    <g id="d6-mesh" strokeLinejoin="round" strokeLinecap="round">
      {/* Top Face */}
      <polygon points="60,14 104,36 60,58 16,36" fill={`url(#grad-top-light-${skin.id})`} />
      {/* Right Face */}
      <polygon points="104,36 104,84 60,106 60,58" fill={`url(#grad-right-mid-${skin.id})`} />
      {/* Front/Left Primary Face */}
      <polygon points="16,36 60,58 60,106 16,84" fill={`url(#rad-center-${skin.id})`} />

      {/* Seams & Bevels */}
      <g stroke="rgba(0,0,0,0.45)" strokeWidth="1.4" fill="none">
        <polygon points="60,14 104,36 104,84 60,106 16,84 16,36" />
        <line x1="16" y1="36" x2="60" y2="58" />
        <line x1="104" y1="36" x2="60" y2="58" />
        <line x1="60" y1="106" x2="60" y2="58" />
      </g>
      {/* Top Specular Edge Chamfers */}
      <g stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <line x1="16" y1="36" x2="60" y2="14" />
        <line x1="60" y1="14" x2="104" y2="36" />
        <line x1="16" y1="36" x2="60" y2="58" />
      </g>
    </g>
  );
};

// Clean D4 Tetrahedron
const CleanD4Geometry: React.FC<GeometryProps> = ({ skin, theme }) => {
  return (
    <g id="d4-mesh" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="60,10 110,98 10,98" fill={`url(#rad-center-${skin.id})`} />
      <polygon points="60,10 60,66 10,98" fill={`url(#grad-top-light-${skin.id})`} opacity="0.75" />
      <polygon points="60,10 110,98 60,66" fill={`url(#grad-right-mid-${skin.id})`} opacity="0.65" />
      <polygon points="10,98 110,98 60,66" fill={`url(#grad-bottom-shadow-${skin.id})`} opacity="0.85" />

      {/* Seams & Glints */}
      <g stroke="rgba(0,0,0,0.4)" strokeWidth="1.4" fill="none">
        <polygon points="60,10 110,98 10,98" />
        <line x1="60" y1="10" x2="60" y2="66" />
        <line x1="10" y1="98" x2="60" y2="66" />
        <line x1="110" y1="98" x2="60" y2="66" />
      </g>
      <g stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <line x1="60" y1="10" x2="10" y2="98" />
        <line x1="60" y1="10" x2="60" y2="66" />
      </g>
    </g>
  );
};

/* =========================================================================
   SKIN THEME SHADERS & COLOR PALETTES
   ========================================================================= */

interface SkinShaderTheme {
  centerFacet: string[];
  topLightFacet: string[];
  topRightFacet: string[];
  leftMidFacet: string[];
  rightMidFacet: string[];
  bottomShadowFacet: string[];
  textColor: string;
  textShadow: string;
  glowFilter: string;
  useGoldFoil?: boolean;
  useSilverFoil?: boolean;
}

function getSkinShaderTheme(skinId: string): SkinShaderTheme {
  switch (skinId) {
    case 'lunar_prism':
      return {
        centerFacet: ['#0891b2', '#0e7490', '#155e75'],
        topLightFacet: ['#67e8f9', '#06b6d4'],
        topRightFacet: ['#22d3ee', '#0891b2'],
        leftMidFacet: ['#0891b2', '#0e7490'],
        rightMidFacet: ['#0e7490', '#155e75'],
        bottomShadowFacet: ['#155e75', '#083344'],
        textColor: '#ecfeff',
        textShadow: 'rgba(6, 182, 212, 0.8)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(6, 182, 212, 0.45))',
        useSilverFoil: true
      };

    case 'oceanic_resin':
      return {
        centerFacet: ['#0284c7', '#0369a1', '#075985'],
        topLightFacet: ['#38bdf8', '#0284c7'],
        topRightFacet: ['#0284c7', '#0369a1'],
        leftMidFacet: ['#0369a1', '#0c4a6e'],
        rightMidFacet: ['#075985', '#0c4a6e'],
        bottomShadowFacet: ['#0c4a6e', '#082f49'],
        textColor: '#fef08a',
        textShadow: 'rgba(0, 0, 0, 0.8)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(2, 132, 199, 0.4))',
        useGoldFoil: true
      };

    case 'neon_noir':
      return {
        centerFacet: ['#3f3f46', '#27272a', '#18181b'],
        topLightFacet: ['#e4e4e7', '#a1a1aa'],
        topRightFacet: ['#a1a1aa', '#52525b'],
        leftMidFacet: ['#52525b', '#27272a'],
        rightMidFacet: ['#27272a', '#18181b'],
        bottomShadowFacet: ['#18181b', '#09090b'],
        textColor: '#f472b6',
        textShadow: 'rgba(244, 114, 182, 0.9)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(244, 114, 182, 0.45))'
      };

    case 'nebula_swirl':
      return {
        centerFacet: ['#7c3aed', '#6b21a8', '#4c1d95'],
        topLightFacet: ['#a78bfa', '#7c3aed'],
        topRightFacet: ['#8b5cf6', '#6b21a8'],
        leftMidFacet: ['#0d9488', '#581c87'],
        rightMidFacet: ['#6b21a8', '#4c1d95'],
        bottomShadowFacet: ['#4c1d95', '#2e1065'],
        textColor: '#fef08a',
        textShadow: 'rgba(0, 0, 0, 0.8)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(139, 92, 246, 0.45))',
        useGoldFoil: true
      };

    case 'storm_crystal':
      return {
        centerFacet: ['#bae6fd', '#38bdf8', '#0284c7'],
        topLightFacet: ['#ffffff', '#e0f2fe'],
        topRightFacet: ['#e0f2fe', '#bae6fd'],
        leftMidFacet: ['#7dd3fc', '#0284c7'],
        rightMidFacet: ['#38bdf8', '#0369a1'],
        bottomShadowFacet: ['#0369a1', '#0c4a6e'],
        textColor: '#f8fafc',
        textShadow: 'rgba(2, 132, 199, 0.75)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(56, 189, 248, 0.45))',
        useSilverFoil: true
      };

    case 'cosmic_galaxy':
      return {
        centerFacet: ['#4f46e5', '#3730a3', '#312e81'],
        topLightFacet: ['#818cf8', '#6366f1'],
        topRightFacet: ['#6366f1', '#4338ca'],
        leftMidFacet: ['#4338ca', '#312e81'],
        rightMidFacet: ['#3730a3', '#1e1b4b'],
        bottomShadowFacet: ['#1e1b4b', '#0f172a'],
        textColor: '#fdf2f8',
        textShadow: 'rgba(244, 114, 182, 0.8)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(129, 140, 248, 0.45))'
      };

    case 'eldritch_blood':
      return {
        centerFacet: ['#78716c', '#44403c', '#292524'],
        topLightFacet: ['#e7e5e4', '#a8a29e'],
        topRightFacet: ['#d6d3d1', '#78716c'],
        leftMidFacet: ['#991b1b', '#44403c'],
        rightMidFacet: ['#44403c', '#292524'],
        bottomShadowFacet: ['#292524', '#0c0a09'],
        textColor: '#ffffff',
        textShadow: 'rgba(220, 38, 38, 0.9)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(220, 38, 38, 0.45))',
        useSilverFoil: true
      };

    case 'gold':
      return {
        centerFacet: ['#facc15', '#eab308', '#ca8a04'],
        topLightFacet: ['#fef08a', '#facc15'],
        topRightFacet: ['#facc15', '#eab308'],
        leftMidFacet: ['#eab308', '#ca8a04'],
        rightMidFacet: ['#ca8a04', '#a16207'],
        bottomShadowFacet: ['#a16207', '#713f12'],
        textColor: '#422006',
        textShadow: 'rgba(254, 240, 138, 0.7)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(234, 179, 8, 0.4))'
      };

    case 'obsidian':
      return {
        centerFacet: ['#292524', '#1c1917', '#0c0a09'],
        topLightFacet: ['#57534e', '#292524'],
        topRightFacet: ['#44403c', '#1c1917'],
        leftMidFacet: ['#292524', '#0c0a09'],
        rightMidFacet: ['#1c1917', '#0c0a09'],
        bottomShadowFacet: ['#0c0a09', '#000000'],
        textColor: '#fda4af',
        textShadow: 'rgba(244, 63, 94, 0.8)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(244, 63, 94, 0.4))'
      };

    case 'molten':
      return {
        centerFacet: ['#ea580c', '#c2410c', '#9a3412'],
        topLightFacet: ['#fdba74', '#fb923c'],
        topRightFacet: ['#f97316', '#ea580c'],
        leftMidFacet: ['#ea580c', '#9a3412'],
        rightMidFacet: ['#c2410c', '#7c2d12'],
        bottomShadowFacet: ['#7c2d12', '#431407'],
        textColor: '#fef08a',
        textShadow: 'rgba(0, 0, 0, 0.8)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(249, 115, 22, 0.45))',
        useGoldFoil: true
      };

    case 'standard':
    default:
      return {
        centerFacet: ['#78350f', '#572607', '#3d1a04'],
        topLightFacet: ['#b45309', '#92400e'],
        topRightFacet: ['#92400e', '#78350f'],
        leftMidFacet: ['#78350f', '#451a03'],
        rightMidFacet: ['#572607', '#292524'],
        bottomShadowFacet: ['#292524', '#1c1917'],
        textColor: '#fef3c7',
        textShadow: 'rgba(0, 0, 0, 0.85)',
        glowFilter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5))',
        useGoldFoil: true
      };
  }
}
