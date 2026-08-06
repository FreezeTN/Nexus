// Official D&D 5e SRD monster artwork portraits and high-resolution SVG vector token generator.
// Uses open-access GitHub raw SRD artwork and instant vector SVG fallback to ensure 100% reliable rendering.

/**
 * Embedded SVG Data URI generator for monsters when external images are unavailable or loading.
 * Generates custom thematic vector tokens for D&D monsters with artwork paths, elemental runes,
 * glowing borders, and crisp typography.
 */
export function generateMonsterSvgPortrait(monsterName?: string): string {
  const name = (monsterName && typeof monsterName === 'string' && monsterName.trim()) ? monsterName.trim() : 'Monster';
  const lower = name.toLowerCase();

  let c1 = '#450a0a';
  let c2 = '#0f172a';
  let border = '#f59e0b';
  let badgeText = name.toUpperCase().slice(0, 10);
  let glyphSvg = '';

  // 1. DRAGONS & TARRASQUE
  if (lower.includes('dragon') || lower.includes('tarrasque') || lower.includes('wyrm')) {
    c1 = '#7f1d1d'; c2 = '#1c1917'; border = '#fbbf24';
    badgeText = lower.includes('red') ? 'RED DRAGON' : lower.includes('tarrasque') ? 'TARRASQUE' : 'DRAGON';
    glyphSvg = `
      <path d="M100 45 L115 75 L145 65 L125 90 L150 115 L120 115 L100 155 L80 115 L50 115 L75 90 L55 65 L85 75 Z" fill="#fbbf24" opacity="0.95" />
      <circle cx="88" cy="82" r="4" fill="#1c1917" />
      <circle cx="112" cy="82" r="4" fill="#1c1917" />
      <path d="M75 125 Q100 145 125 125" stroke="#ef4444" stroke-width="4" fill="none" stroke-linecap="round" />
    `;
  }
  // 2. MUMMY / MUMMY LORD
  else if (lower.includes('mummy')) {
    c1 = '#78350f'; c2 = '#1c1917'; border = '#f59e0b';
    badgeText = lower.includes('lord') ? 'MUMMY LORD' : 'MUMMY';
    glyphSvg = `
      <rect x="50" y="55" width="100" height="90" rx="20" fill="#292524" stroke="#d97706" stroke-width="2" />
      <line x1="55" y1="70" x2="145" y2="70" stroke="#fef08a" stroke-width="5" stroke-linecap="round" opacity="0.9" />
      <line x1="60" y1="85" x2="140" y2="85" stroke="#fef08a" stroke-width="6" stroke-linecap="round" opacity="0.9" />
      <line x1="55" y1="100" x2="145" y2="100" stroke="#fef08a" stroke-width="5" stroke-linecap="round" opacity="0.9" />
      <line x1="65" y1="115" x2="135" y2="115" stroke="#fef08a" stroke-width="5" stroke-linecap="round" opacity="0.9" />
      <circle cx="78" cy="85" r="5" fill="#ef4444" />
      <circle cx="122" cy="85" r="5" fill="#ef4444" />
      <polygon points="100,40 110,55 90,55" fill="#f59e0b" />
    `;
  }
  // 3. BANSHEE / SPECTER / GHOST / WRAITH
  else if (lower.includes('banshee') || lower.includes('specter') || lower.includes('ghost') || lower.includes('wraith')) {
    c1 = '#083344'; c2 = '#2e1065'; border = '#06b6d4';
    badgeText = 'BANSHEE';
    glyphSvg = `
      <path d="M100 45 C70 45 60 75 60 110 C60 140 80 155 100 155 C120 155 140 140 140 110 C140 75 130 45 100 45 Z" fill="#155e75" opacity="0.75" stroke="#22d3ee" stroke-width="2" />
      <circle cx="82" cy="85" r="8" fill="#0284c7" />
      <circle cx="118" cy="85" r="8" fill="#0284c7" />
      <circle cx="82" cy="85" r="3" fill="#a5f3fc" />
      <circle cx="118" cy="85" r="3" fill="#a5f3fc" />
      <ellipse cx="100" cy="120" rx="14" ry="20" fill="#083344" stroke="#a5f3fc" stroke-width="2" />
    `;
  }
  // 4. VAMPIRE / VAMPIRE SPAWN
  else if (lower.includes('vampire')) {
    c1 = '#450a0a'; c2 = '#0f172a'; border = '#f43f5e';
    badgeText = lower.includes('spawn') ? 'VAMP. SPAWN' : 'VAMPIRE';
    glyphSvg = `
      <path d="M40 70 Q100 30 160 70 Q130 140 100 155 Q70 140 40 70 Z" fill="#881337" opacity="0.85" stroke="#fda4af" stroke-width="2" />
      <circle cx="80" cy="80" r="6" fill="#f43f5e" />
      <circle cx="120" cy="80" r="6" fill="#f43f5e" />
      <path d="M85 110 L90 125 L95 110" fill="#ffffff" />
      <path d="M105 110 L110 125 L115 110" fill="#ffffff" />
      <path d="M80 105 Q100 115 120 105" stroke="#ffffff" stroke-width="2" fill="none" />
    `;
  }
  // 5. AIR ELEMENTAL
  else if (lower.includes('air elemental')) {
    c1 = '#0c4a6e'; c2 = '#0284c7'; border = '#38bdf8';
    badgeText = 'AIR ELEM';
    glyphSvg = `
      <path d="M50 60 Q100 40 150 60 Q120 90 140 110 Q100 130 60 110 Q80 90 50 60 Z" fill="none" stroke="#7dd3fc" stroke-width="5" stroke-linecap="round" />
      <path d="M65 85 Q100 70 135 85 Q115 110 85 110 Z" fill="none" stroke="#bae6fd" stroke-width="3" />
      <circle cx="100" cy="100" r="45" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8,6" />
    `;
  }
  // 6. EARTH ELEMENTAL
  else if (lower.includes('earth elemental')) {
    c1 = '#1c1917'; c2 = '#3f6212'; border = '#84cc16';
    badgeText = 'EARTH ELEM';
    glyphSvg = `
      <polygon points="100,45 145,70 135,125 100,150 65,125 55,70" fill="#3f6212" stroke="#a3e635" stroke-width="3" />
      <line x1="100" y1="45" x2="100" y2="150" stroke="#a3e635" stroke-width="2" opacity="0.6" />
      <line x1="55" y1="70" x2="145" y2="70" stroke="#a3e635" stroke-width="2" opacity="0.6" />
      <line x1="65" y1="125" x2="135" y2="125" stroke="#a3e635" stroke-width="2" opacity="0.6" />
    `;
  }
  // 7. FIRE ELEMENTAL
  else if (lower.includes('fire elemental')) {
    c1 = '#7f1d1d'; c2 = '#c2410c'; border = '#f97316';
    badgeText = 'FIRE ELEM';
    glyphSvg = `
      <path d="M100 35 C120 70 145 80 145 110 C145 135 125 155 100 155 C75 155 55 135 55 110 C55 80 80 70 100 35 Z" fill="#ea580c" stroke="#fde047" stroke-width="3" />
      <path d="M100 65 C112 88 128 95 128 115 C128 130 115 142 100 142 C85 142 72 130 72 115 C72 95 88 88 100 65 Z" fill="#facc15" />
      <circle cx="100" cy="115" r="12" fill="#ffffff" />
    `;
  }
  // 8. WATER ELEMENTAL
  else if (lower.includes('water elemental')) {
    c1 = '#1e3a8a'; c2 = '#06b6d4'; border = '#22d3ee';
    badgeText = 'WATER ELEM';
    glyphSvg = `
      <path d="M100 40 C100 40 145 90 145 115 C145 140 125 155 100 155 C75 155 55 140 55 115 C55 90 100 40 100 40 Z" fill="#0284c7" stroke="#67e8f9" stroke-width="3" />
      <path d="M70 120 Q100 100 130 120" stroke="#a5f3fc" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M75 135 Q100 115 125 135" stroke="#a5f3fc" stroke-width="3" fill="none" stroke-linecap="round" />
    `;
  }
  // 9. BANDIT
  else if (lower.includes('bandit') || lower.includes('outlaw') || lower.includes('thug')) {
    c1 = '#1c1917'; c2 = '#334155'; border = '#38bdf8';
    badgeText = 'BANDIT';
    glyphSvg = `
      <path d="M50 140 L100 60 L150 140 Z" fill="#334155" stroke="#94a3b8" stroke-width="3" />
      <line x1="45" y1="140" x2="155" y2="140" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
      <line x1="60" y1="65" x2="140" y2="135" stroke="#f1f5f9" stroke-width="4" stroke-linecap="round" />
      <line x1="140" y1="65" x2="60" y2="135" stroke="#f1f5f9" stroke-width="4" stroke-linecap="round" />
    `;
  }
  // 10. CULTIST
  else if (lower.includes('cultist')) {
    c1 = '#3b0764'; c2 = '#701a75'; border = '#e11d48';
    badgeText = 'CULTIST';
    glyphSvg = `
      <path d="M100 45 L135 145 L65 145 Z" fill="#581c87" stroke="#f43f5e" stroke-width="3" />
      <circle cx="100" cy="95" r="22" fill="#1e1b4b" stroke="#fb7185" stroke-width="2" />
      <circle cx="100" cy="95" r="8" fill="#e11d48" />
      <polygon points="100,55 108,80 135,80 113,95 121,120 100,105 79,120 87,95 65,80 92,80" fill="none" stroke="#f43f5e" stroke-width="1.5" />
    `;
  }
  // 11. ABOLETH / BEHOLDER / MIND FLAYER
  else if (lower.includes('aboleth') || lower.includes('beholder') || lower.includes('mind flayer') || lower.includes('illithid')) {
    c1 = '#3b0764'; c2 = '#032b38'; border = '#c084fc';
    badgeText = lower.includes('aboleth') ? 'ABOLETH' : lower.includes('beholder') ? 'BEHOLDER' : 'MIND FLAYER';
    glyphSvg = `
      <circle cx="100" cy="95" r="42" fill="#581c87" stroke="#a855f7" stroke-width="3" />
      <circle cx="100" cy="95" r="18" fill="#1e1b4b" stroke="#e879f9" stroke-width="2" />
      <ellipse cx="100" cy="95" rx="6" ry="14" fill="#f43f5e" />
      <path d="M60 70 Q40 40 50 30" stroke="#c084fc" stroke-width="4" fill="none" />
      <path d="M140 70 Q160 40 150 30" stroke="#c084fc" stroke-width="4" fill="none" />
      <path d="M75 55 Q60 25 75 15" stroke="#c084fc" stroke-width="4" fill="none" />
      <path d="M125 55 Q140 25 125 15" stroke="#c084fc" stroke-width="4" fill="none" />
    `;
  }
  // 12. GOBLIN / ORC / KOBOLD / OGRE / TROLL
  else if (lower.includes('goblin') || lower.includes('orc') || lower.includes('kobold') || lower.includes('ogre') || lower.includes('troll')) {
    c1 = '#14532d'; c2 = '#064e3b'; border = '#4ade80';
    badgeText = lower.includes('goblin') ? 'GOBLIN' : lower.includes('orc') ? 'ORC' : lower.includes('kobold') ? 'KOBOLD' : 'MONSTER';
    glyphSvg = `
      <path d="M60 65 L140 65 L155 125 L100 150 L45 125 Z" fill="#166534" stroke="#86efac" stroke-width="3" />
      <polygon points="75,80 88,80 81,100" fill="#ffffff" />
      <polygon points="112,80 125,80 118,100" fill="#ffffff" />
      <polygon points="85,120 92,105 100,120 108,105 115,120" fill="#ffffff" />
    `;
  }
  // 13. DEFAULT GENERIC MONSTER
  else {
    c1 = '#450a0a'; c2 = '#1c1917'; border = '#f59e0b';
    glyphSvg = `
      <circle cx="100" cy="95" r="40" fill="#7f1d1d" stroke="#f59e0b" stroke-width="3" />
      <path d="M75 90 L85 90 L80 105 Z" fill="#ffffff" />
      <path d="M115 90 L125 90 L120 105 Z" fill="#ffffff" />
      <circle cx="82" cy="80" r="5" fill="#fef08a" />
      <circle cx="118" cy="80" r="5" fill="#fef08a" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="200" height="200" rx="28" fill="url(#bgGrad)" stroke="${border}" stroke-width="3" />
    <circle cx="100" cy="95" r="78" fill="none" stroke="${border}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5" />
    <g filter="url(#glow)">
      ${glyphSvg}
    </g>
    <rect x="20" y="158" width="160" height="26" rx="8" fill="#09090b" opacity="0.9" stroke="${border}" stroke-width="1.5" />
    <text x="100" y="175" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="11" fill="#fef08a" text-anchor="middle" letter-spacing="1.2">${badgeText}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Open-access GitHub raw 5e SRD artwork repository URLs
const SRD_RAW_BASE = 'https://raw.githubusercontent.com/5e-bits/5e-srd-api/master/src/images';

export const MONSTER_PORTRAITS_MAP: Record<string, string> = {
  // Dragons & Bosses
  'Aboleth': `${SRD_RAW_BASE}/aboleth.jpg`,
  'Adult Red Dragon': `${SRD_RAW_BASE}/adult-red-dragon.jpg`,
  'Ancient Red Dragon': `${SRD_RAW_BASE}/adult-red-dragon.jpg`,
  'Young Red Dragon': `${SRD_RAW_BASE}/adult-red-dragon.jpg`,
  'Red Dragon': `${SRD_RAW_BASE}/adult-red-dragon.jpg`,
  'The Tarrasque': `${SRD_RAW_BASE}/tarrasque.jpg`,
  'Tarrasque': `${SRD_RAW_BASE}/tarrasque.jpg`,

  // Goblins, Orcs & Humanoids
  'Goblin': `${SRD_RAW_BASE}/goblin.jpg`,
  'Goblin Warchief': `${SRD_RAW_BASE}/goblin.jpg`,
  'Kobold Spear Hunter': `${SRD_RAW_BASE}/kobold.jpg`,
  'Kobold': `${SRD_RAW_BASE}/kobold.jpg`,
  'Orc Warrior': `${SRD_RAW_BASE}/orc.jpg`,
  'Orc': `${SRD_RAW_BASE}/orc.jpg`,
  'Ogre': `${SRD_RAW_BASE}/ogre.jpg`,
  'Bandit': `${SRD_RAW_BASE}/bandit.jpg`,
  'Cultist': `${SRD_RAW_BASE}/cultist.jpg`,

  // Beasts, Monstrosities & Giants
  'Minotaur': `${SRD_RAW_BASE}/minotaur.jpg`,
  'Troll': `${SRD_RAW_BASE}/troll.jpg`,
  'Owlbear': `${SRD_RAW_BASE}/owlbear.jpg`,
  'Chimera': `${SRD_RAW_BASE}/chimera.jpg`,
  'Gelatinous Cube': `${SRD_RAW_BASE}/gelatinous-cube.jpg`,
  'Bulette': `${SRD_RAW_BASE}/bulette.jpg`,
  'Hydra': `${SRD_RAW_BASE}/hydra.jpg`,
  'Manticore': `${SRD_RAW_BASE}/manticore.jpg`,
  'Wyvern': `${SRD_RAW_BASE}/wyvern.jpg`,
  'Gorgon': `${SRD_RAW_BASE}/gorgon.jpg`,
  'Basilisk': `${SRD_RAW_BASE}/basilisk.jpg`,
  'Balor': `${SRD_RAW_BASE}/balor.jpg`,
  'Bugbear': `${SRD_RAW_BASE}/bugbear.jpg`,
  'Hobgoblin': `${SRD_RAW_BASE}/hobgoblin.jpg`,
  'Medusa': `${SRD_RAW_BASE}/medusa.jpg`,
  'Remorhaz': `${SRD_RAW_BASE}/remorhaz.jpg`,
  'Roper': `${SRD_RAW_BASE}/roper.jpg`,
  'Iron Golem': `${SRD_RAW_BASE}/iron-golem.jpg`,
  'Rust Monster': `${SRD_RAW_BASE}/rust-monster.jpg`,
  'Gargoyle': `${SRD_RAW_BASE}/gargoyle.jpg`,
  'Displacer Beast': `${SRD_RAW_BASE}/displacer-beast.jpg`,
  'Night Hag': `${SRD_RAW_BASE}/night-hag.jpg`,

  'Gibbering Mouther': `${SRD_RAW_BASE}/gibbering-mouther.jpg`,
  'Cloaker': `${SRD_RAW_BASE}/cloaker.jpg`,
  'Shambling Mound': `${SRD_RAW_BASE}/shambling-mound.jpg`,
  'Phase Spider': `${SRD_RAW_BASE}/phase-spider.jpg`,
  'Ghost': `${SRD_RAW_BASE}/ghost.jpg`,
  'Nightmare': `${SRD_RAW_BASE}/nightmare.jpg`,
  'Succubus / Incubus': `${SRD_RAW_BASE}/succubus.jpg`,
  'Succubus': `${SRD_RAW_BASE}/succubus.jpg`,
  'Ethereal Filcher': `${SRD_RAW_BASE}/ethereal-filcher.jpg`,
  'Blink Dog': `${SRD_RAW_BASE}/blink-dog.jpg`,
  'Flameskull': `${SRD_RAW_BASE}/flameskull.jpg`,
  'Shadow': `${SRD_RAW_BASE}/shadow.jpg`,
  'Cockatrice': `${SRD_RAW_BASE}/cockatrice.jpg`,

  // Aberrations & Undead
  'Beholder': `${SRD_RAW_BASE}/beholder.jpg`,
  'Lich': `${SRD_RAW_BASE}/lich.jpg`,
  'Vampire': `${SRD_RAW_BASE}/vampire.jpg`,
  'Skeleton': `${SRD_RAW_BASE}/skeleton.jpg`,
  'Zombie': `${SRD_RAW_BASE}/zombie.jpg`,
  'Ghoul': `${SRD_RAW_BASE}/ghoul.jpg`,
  'Mummy': `${SRD_RAW_BASE}/mummy.jpg`,

  // Elementals
  'Air Elemental': `${SRD_RAW_BASE}/air-elemental.jpg`,
  'Earth Elemental': `${SRD_RAW_BASE}/earth-elemental.jpg`,
  'Fire Elemental': `${SRD_RAW_BASE}/fire-elemental.jpg`,
  'Water Elemental': `${SRD_RAW_BASE}/water-elemental.jpg`
};

/**
 * Returns a high-resolution monster artwork portrait URL or generated vector token SVG.
 */
export function getMonsterPortraitUrl(monsterName?: string, _id?: string): string {
  if (!monsterName) {
    return generateMonsterSvgPortrait('Monster');
  }

  const trimmed = monsterName.trim();

  // 1. Check exact map match
  if (MONSTER_PORTRAITS_MAP[trimmed]) {
    return MONSTER_PORTRAITS_MAP[trimmed];
  }

  // 2. Check partial name match in map
  for (const [key, url] of Object.entries(MONSTER_PORTRAITS_MAP)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  // 3. Instant vector SVG token avatar fallback
  return generateMonsterSvgPortrait(trimmed);
}
