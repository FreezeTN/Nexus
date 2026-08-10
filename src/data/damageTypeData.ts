export interface DamageTypeMeta {
  name: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const OFFICIAL_DAMAGE_TYPES: DamageTypeMeta[] = [
  { name: 'Acid', icon: '🧪', badgeBg: 'bg-lime-950', badgeText: 'text-lime-300', badgeBorder: 'border-lime-600/50', description: 'Corrosive enzymes, dragon breath, or black pudding' },
  { name: 'Bludgeoning', icon: '🔨', badgeBg: 'bg-stone-800', badgeText: 'text-stone-200', badgeBorder: 'border-stone-600/50', description: 'Blunt force attacks—hammers, falling, or constriction' },
  { name: 'Cold', icon: '❄️', badgeBg: 'bg-cyan-950', badgeText: 'text-cyan-300', badgeBorder: 'border-cyan-600/50', description: 'Infernal frost, ice storms, or cone of cold' },
  { name: 'Fire', icon: '🔥', badgeBg: 'bg-orange-950', badgeText: 'text-orange-300', badgeBorder: 'border-orange-600/50', description: 'Flame, intense heat, or dragon breath' },
  { name: 'Force', icon: '🌀', badgeBg: 'bg-indigo-950', badgeText: 'text-indigo-300', badgeBorder: 'border-indigo-600/50', description: 'Pure magic focused into damaging pressure (e.g. Eldritch Blast)' },
  { name: 'Lightning', icon: '⚡', badgeBg: 'bg-amber-950', badgeText: 'text-amber-300', badgeBorder: 'border-amber-600/50', description: 'Electrical energy bolts or lightning bolts' },
  { name: 'Necrotic', icon: '💀', badgeBg: 'bg-purple-950', badgeText: 'text-purple-300', badgeBorder: 'border-purple-600/50', description: 'Withered vitality, shadow energy, or undead decay' },
  { name: 'Piercing', icon: '🗡️', badgeBg: 'bg-zinc-800', badgeText: 'text-zinc-200', badgeBorder: 'border-zinc-500/50', description: 'Puncturing attacks—arrows, spears, or monster fangs' },
  { name: 'Poison', icon: '☣️', badgeBg: 'bg-emerald-950', badgeText: 'text-emerald-300', badgeBorder: 'border-emerald-600/50', description: 'Venoms, toxic gases, or poisonous stings' },
  { name: 'Psychic', icon: '🧠', badgeBg: 'bg-fuchsia-950', badgeText: 'text-fuchsia-300', badgeBorder: 'border-fuchsia-600/50', description: 'Psionic strikes or mental anguish' },
  { name: 'Radiant', icon: '✨', badgeBg: 'bg-yellow-950', badgeText: 'text-yellow-300', badgeBorder: 'border-yellow-600/50', description: 'Searing holy light, celestial radiance, or divine smites' },
  { name: 'Slashing', icon: '⚔️', badgeBg: 'bg-rose-950', badgeText: 'text-rose-300', badgeBorder: 'border-rose-600/50', description: 'Cutting weapons—swords, axes, or claws' },
  { name: 'Thunder', icon: '💥', badgeBg: 'bg-sky-950', badgeText: 'text-sky-300', badgeBorder: 'border-sky-600/50', description: 'Concussive burst of sound, shockwaves, or thunderwave' }
];

export function getDamageTypeMeta(typeName?: string): DamageTypeMeta {
  if (!typeName) {
    return { name: 'Untyped', icon: '⚔️', badgeBg: 'bg-stone-800', badgeText: 'text-stone-300', badgeBorder: 'border-stone-700', description: 'Standard damage' };
  }
  const found = OFFICIAL_DAMAGE_TYPES.find(d => d.name.toLowerCase() === typeName.toLowerCase());
  if (found) return found;
  return { name: typeName, icon: '✨', badgeBg: 'bg-stone-800', badgeText: 'text-amber-200', badgeBorder: 'border-stone-700', description: `${typeName} damage` };
}
