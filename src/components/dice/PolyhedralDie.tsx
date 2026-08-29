import React from 'react';
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
  size = 96
}) => {
  const isNat20 = dieType === 20 && value === 20;
  const isNat1 = dieType === 20 && value === 1;

  // Skin color and gradient definitions
  const skinTheme = getSkinTheme(skin.id);

  return (
    <motion.div
      animate={{
        rotate: isRolling ? [0, 45, 120, 210, 310, 360, 420, 720] : 0,
        scale: isRolling ? [1, 1.18, 0.92, 1.12, 1] : 1,
        y: isRolling ? [0, -14, 4, -8, 0] : 0
      }}
      transition={{
        duration: isRolling ? 0.65 : 0.25,
        ease: 'easeInOut'
      }}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none cursor-pointer filter ${
        isNat20
          ? 'drop-shadow-[0_0_18px_rgba(251,191,36,0.95)] animate-bounce'
          : isNat1
          ? 'drop-shadow-[0_0_18px_rgba(225,29,72,0.95)]'
          : skinTheme.containerFilter
      }`}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Gradients for facets */}
          <linearGradient id={`grad-center-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={skinTheme.centerFacet[0]} />
            <stop offset="100%" stopColor={skinTheme.centerFacet[1]} />
          </linearGradient>

          <linearGradient id={`grad-top-${skin.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={skinTheme.topFacet[0]} />
            <stop offset="100%" stopColor={skinTheme.topFacet[1]} />
          </linearGradient>

          <linearGradient id={`grad-side-light-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={skinTheme.sideFacetLight[0]} />
            <stop offset="100%" stopColor={skinTheme.sideFacetLight[1]} />
          </linearGradient>

          <linearGradient id={`grad-side-dark-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={skinTheme.sideFacetDark[0]} />
            <stop offset="100%" stopColor={skinTheme.sideFacetDark[1]} />
          </linearGradient>

          <linearGradient id={`grad-bottom-${skin.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skinTheme.bottomFacet[0]} />
            <stop offset="100%" stopColor={skinTheme.bottomFacet[1]} />
          </linearGradient>

          {/* Edge Glow Filter */}
          <filter id={`glow-${skin.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Render Die Shape based on Die Type (Defaulting to authentic D20 Icosahedron) */}
        {dieType === 20 ? (
          <D20IcosahedronGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        ) : dieType === 12 ? (
          <D12DodecahedronGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        ) : dieType === 10 || dieType === 100 ? (
          <D10DecahedronGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        ) : dieType === 8 ? (
          <D8OctahedronGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        ) : dieType === 6 ? (
          <D6CubeGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        ) : dieType === 4 ? (
          <D4TetrahedronGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        ) : (
          <D20IcosahedronGeometry skinId={skin.id} edgeColor={skinTheme.edgeColor} />
        )}

        {/* Die Value Text placed right on the front-facing center facet */}
        <text
          x="60"
          y={dieType === 20 ? "66" : dieType === 6 ? "63" : "64"}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono font-black select-none pointer-events-none"
          style={{
            fontSize: value >= 100 ? '22px' : dieType === 20 ? '26px' : '28px',
            fill: isNat20 ? '#fef08a' : isNat1 ? '#fecdd3' : skinTheme.textColor,
            filter: `drop-shadow(0px 2px 4px ${skinTheme.textShadow})`,
            fontWeight: 900
          }}
        >
          {value}
        </text>

        {/* Underline for 6 and 9 to prevent confusion on d20 */}
        {(value === 6 || value === 9) && (
          <line
            x1="52"
            y1={dieType === 20 ? "76" : "74"}
            x2="68"
            y2={dieType === 20 ? "76" : "74"}
            stroke={skinTheme.textColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Critical Success / Fumble Overlays */}
      {isNat20 && (
        <div className="absolute -bottom-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-lg border border-yellow-200">
          NAT 20
        </div>
      )}
      {isNat1 && (
        <div className="absolute -bottom-2 bg-gradient-to-r from-rose-600 to-red-700 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-lg border border-rose-400">
          FUMBLE
        </div>
      )}
    </motion.div>
  );
};

/* =========================================================================
   GEOMETRIES
   ========================================================================= */

// Authentic 3D Icosahedron D20 with 10 visible isometric facet planes
const D20IcosahedronGeometry: React.FC<{ skinId: string; edgeColor: string }> = ({
  skinId,
  edgeColor
}) => {
  // Vertices:
  // Outer Hexagon: P0(60,6), P1(108,34), P2(108,86), P3(60,114), P4(12,86), P5(12,34)
  // Inner Face Triangle: T0(60,34), T1(88,78), T2(32,78)

  return (
    <g id="d20-facets" stroke={edgeColor} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      {/* Background Outer Hexagon Clip / Shadow Base */}
      <polygon
        points="60,6 108,34 108,86 60,114 12,86 12,34"
        fill={`url(#grad-bottom-${skinId})`}
      />

      {/* 1. Top-Left Facet */}
      <polygon points="60,6 60,34 12,34" fill={`url(#grad-top-${skinId})`} />

      {/* 2. Top-Right Facet */}
      <polygon points="60,6 108,34 60,34" fill={`url(#grad-top-${skinId})`} />

      {/* 3. Right-Top Facet */}
      <polygon points="108,34 88,78 60,34" fill={`url(#grad-side-light-${skinId})`} />

      {/* 4. Right-Bottom Facet */}
      <polygon points="108,34 108,86 88,78" fill={`url(#grad-side-dark-${skinId})`} />

      {/* 5. Bottom-Right Facet */}
      <polygon points="108,86 60,114 88,78" fill={`url(#grad-bottom-${skinId})`} />

      {/* 6. Bottom Center Facet */}
      <polygon points="88,78 60,114 32,78" fill={`url(#grad-bottom-${skinId})`} />

      {/* 7. Bottom-Left Facet */}
      <polygon points="32,78 60,114 12,86" fill={`url(#grad-bottom-${skinId})`} />

      {/* 8. Left-Bottom Facet */}
      <polygon points="12,34 32,78 12,86" fill={`url(#grad-side-dark-${skinId})`} />

      {/* 9. Left-Top Facet */}
      <polygon points="12,34 60,34 32,78" fill={`url(#grad-side-light-${skinId})`} />

      {/* 10. Center Primary Face (Inscribed face facing the player) */}
      <polygon
        points="60,34 88,78 32,78"
        fill={`url(#grad-center-${skinId})`}
        stroke={edgeColor}
        strokeWidth="2.2"
      />

      {/* Center Specular Highlight Ridge */}
      <polyline
        points="60,34 88,78 32,78 60,34"
        fill="none"
        stroke={edgeColor}
        strokeWidth="2"
        opacity="0.9"
      />
    </g>
  );
};

// D12 Dodecahedron (Pentagonal central face with 5 surrounding pentagonal facets)
const D12DodecahedronGeometry: React.FC<{ skinId: string; edgeColor: string }> = ({
  skinId,
  edgeColor
}) => {
  return (
    <g id="d12-facets" stroke={edgeColor} strokeWidth="1.8" strokeLinejoin="round">
      <polygon points="60,8 106,38 90,92 30,92 14,38" fill={`url(#grad-bottom-${skinId})`} />
      <polygon points="60,8 106,38 88,48 60,30 32,48" fill={`url(#grad-top-${skinId})`} />
      <polygon points="106,38 90,92 78,74 88,48" fill={`url(#grad-side-light-${skinId})`} />
      <polygon points="90,92 30,92 42,74 78,74" fill={`url(#grad-bottom-${skinId})`} />
      <polygon points="30,92 14,38 32,48 42,74" fill={`url(#grad-side-dark-${skinId})`} />
      {/* Center Face */}
      <polygon points="60,30 88,48 78,74 42,74 32,48" fill={`url(#grad-center-${skinId})`} strokeWidth="2.2" />
    </g>
  );
};

// D10 Decahedron (Pentagonal Trapezohedron / Kite diamond)
const D10DecahedronGeometry: React.FC<{ skinId: string; edgeColor: string }> = ({
  skinId,
  edgeColor
}) => {
  return (
    <g id="d10-facets" stroke={edgeColor} strokeWidth="1.8" strokeLinejoin="round">
      <polygon points="60,6 108,44 60,114 12,44" fill={`url(#grad-bottom-${skinId})`} />
      <polygon points="60,6 108,44 60,60" fill={`url(#grad-top-${skinId})`} />
      <polygon points="108,44 60,114 60,60" fill={`url(#grad-side-dark-${skinId})`} />
      <polygon points="60,114 12,44 60,60" fill={`url(#grad-bottom-${skinId})`} />
      <polygon points="12,44 60,6 60,60" fill={`url(#grad-side-light-${skinId})`} />
    </g>
  );
};

// D8 Octahedron (Diamond with 4 quadrants meeting at apex)
const D8OctahedronGeometry: React.FC<{ skinId: string; edgeColor: string }> = ({
  skinId,
  edgeColor
}) => {
  return (
    <g id="d8-facets" stroke={edgeColor} strokeWidth="1.8" strokeLinejoin="round">
      <polygon points="60,8 110,60 60,112 10,60" fill={`url(#grad-bottom-${skinId})`} />
      <polygon points="60,8 110,60 60,60" fill={`url(#grad-top-${skinId})`} />
      <polygon points="110,60 60,112 60,60" fill={`url(#grad-side-dark-${skinId})`} />
      <polygon points="60,112 10,60 60,60" fill={`url(#grad-bottom-${skinId})`} />
      <polygon points="10,60 60,8 60,60" fill={`url(#grad-side-light-${skinId})`} />
    </g>
  );
};

// D6 Cube (Isometric 3D Cube)
const D6CubeGeometry: React.FC<{ skinId: string; edgeColor: string }> = ({
  skinId,
  edgeColor
}) => {
  return (
    <g id="d6-facets" stroke={edgeColor} strokeWidth="2" strokeLinejoin="round">
      {/* Top Face */}
      <polygon points="60,12 104,36 60,60 16,36" fill={`url(#grad-top-${skinId})`} />
      {/* Right Face */}
      <polygon points="104,36 104,84 60,108 60,60" fill={`url(#grad-side-dark-${skinId})`} />
      {/* Left Face (Front) */}
      <polygon points="16,36 60,60 60,108 16,84" fill={`url(#grad-center-${skinId})`} />
    </g>
  );
};

// D4 Tetrahedron
const D4TetrahedronGeometry: React.FC<{ skinId: string; edgeColor: string }> = ({
  skinId,
  edgeColor
}) => {
  return (
    <g id="d4-facets" stroke={edgeColor} strokeWidth="2" strokeLinejoin="round">
      <polygon points="60,10 110,100 10,100" fill={`url(#grad-center-${skinId})`} />
      <polygon points="60,10 60,65 10,100" fill={`url(#grad-side-light-${skinId})`} opacity="0.6" />
      <polygon points="60,10 110,100 60,65" fill={`url(#grad-top-${skinId})`} opacity="0.6" />
      <polygon points="10,100 110,100 60,65" fill={`url(#grad-bottom-${skinId})`} opacity="0.8" />
    </g>
  );
};

/* =========================================================================
   SKIN THEMES & MATERIAL SHADERS
   ========================================================================= */

function getSkinTheme(skinId: string) {
  switch (skinId) {
    case 'gold':
      return {
        centerFacet: ['#fef08a', '#eab308'],
        topFacet: ['#fef9c3', '#facc15'],
        sideFacetLight: ['#eab308', '#ca8a04'],
        sideFacetDark: ['#ca8a04', '#a16207'],
        bottomFacet: ['#a16207', '#713f12'],
        edgeColor: '#fef08a',
        textColor: '#422006',
        textShadow: 'rgba(254, 240, 138, 0.6)',
        containerFilter: 'drop-shadow(0 4px 12px rgba(234, 179, 8, 0.45))'
      };

    case 'obsidian':
      return {
        centerFacet: ['#1c1917', '#0c0a09'],
        topFacet: ['#292524', '#1c1917'],
        sideFacetLight: ['#1c1917', '#0c0a09'],
        sideFacetDark: ['#0c0a09', '#000000'],
        bottomFacet: ['#0c0a09', '#000000'],
        edgeColor: '#f43f5e',
        textColor: '#fda4af',
        textShadow: 'rgba(244, 63, 94, 0.9)',
        containerFilter: 'drop-shadow(0 0 14px rgba(244, 63, 94, 0.5))'
      };

    case 'molten':
      return {
        centerFacet: ['#ea580c', '#c2410c'],
        topFacet: ['#f97316', '#ea580c'],
        sideFacetLight: ['#ea580c', '#9a3412'],
        sideFacetDark: ['#9a3412', '#7c2d12'],
        bottomFacet: ['#7c2d12', '#431407'],
        edgeColor: '#fde047',
        textColor: '#fef08a',
        textShadow: 'rgba(234, 88, 12, 0.95)',
        containerFilter: 'drop-shadow(0 0 16px rgba(249, 115, 22, 0.6))'
      };

    case 'astral':
      return {
        centerFacet: ['#312e81', '#1e1b4b'],
        topFacet: ['#4338ca', '#3730a3'],
        sideFacetLight: ['#1e1b4b', '#0f172a'],
        sideFacetDark: ['#0f172a', '#082f49'],
        bottomFacet: ['#082f49', '#020617'],
        edgeColor: '#22d3ee',
        textColor: '#67e8f9',
        textShadow: 'rgba(34, 211, 238, 0.9)',
        containerFilter: 'drop-shadow(0 0 16px rgba(34, 211, 238, 0.55))'
      };

    case 'standard':
    default:
      return {
        centerFacet: ['#78350f', '#451a03'],
        topFacet: ['#92400e', '#78350f'],
        sideFacetLight: ['#78350f', '#451a03'],
        sideFacetDark: ['#451a03', '#292524'],
        bottomFacet: ['#292524', '#1c1917'],
        edgeColor: '#d97706',
        textColor: '#fef3c7',
        textShadow: 'rgba(0, 0, 0, 0.8)',
        containerFilter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6))'
      };
  }
}
