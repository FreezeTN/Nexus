import React, { useState } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { SupportedEdition, FANTASY_CREATURE_TYPES, CR_XP_MAP } from './ForgeTypes';
import { getMonsterPortraitUrl } from '../../../data/monsterPortraits';
import { Skull, Save, Plus, Trash2, Shield, Heart, Zap, Crosshair, Sparkles } from 'lucide-react';

interface MonsterStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
}

export const MonsterStudio: React.FC<MonsterStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose
}) => {
  // Shared
  const [name, setName] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Fantasy & PF2e Core Stats
  const [size, setSize] = useState('Medium');
  const [creatureType, setCreatureType] = useState('Monstrosity');
  const [alignment, setAlignment] = useState('Neutral Evil');
  const [cr, setCr] = useState('3');
  const [ac, setAc] = useState(15);
  const [acType, setAcType] = useState('Natural Armor');
  const [hp, setHp] = useState(52);
  const [hitDice, setHitDice] = useState('8d8 + 16');
  const [speed, setSpeed] = useState('30 ft.');

  // Ability Scores
  const [str, setStr] = useState(16);
  const [dex, setDex] = useState(14);
  const [con, setCon] = useState(15);
  const [intScore, setIntScore] = useState(10);
  const [wis, setWis] = useState(12);
  const [cha, setCha] = useState(8);

  // 3.5e Specifics
  const [bab, setBab] = useState(4);
  const [fortSave, setFortSave] = useState(5);
  const [refSave, setRefSave] = useState(4);
  const [willSave, setWillSave] = useState(3);
  const [touchAc, setTouchAc] = useState(12);
  const [flatFootedAc, setFlatFootedAc] = useState(13);
  const [spellResist, setSpellResist] = useState('');

  // PF2e Specifics
  const [pf2Level, setPf2Level] = useState(3);
  const [pf2Perception, setPf2Perception] = useState(9);
  const [pf2Weakness, setPf2Weakness] = useState('');
  const [pf2Resistance, setPf2Resistance] = useState('');

  // Shadowrun NPC / Critter Fields
  const [srArchetype, setSrArchetype] = useState('Street Samurai / Combat Grunt');
  const [srProfRating, setSrProfRating] = useState(3);
  const [srBod, setSrBod] = useState(5);
  const [srAgi, setSrAgi] = useState(5);
  const [srRea, setSrRea] = useState(4);
  const [srStr, setSrStr] = useState(4);
  const [srWil, setSrWil] = useState(3);
  const [srLog, setSrLog] = useState(3);
  const [srInt, setSrInt] = useState(4);
  const [srCha, setSrCha] = useState(2);
  const [srEdg, setSrEdg] = useState(2);
  const [srEss, setSrEss] = useState(4.5);
  const [srMag, setSrMag] = useState(0);
  const [srRes, setSrRes] = useState(0);
  const [srInit, setSrInit] = useState('9 + 2d6');
  const [srPhysBoxes, setSrPhysBoxes] = useState(11);
  const [srStunBoxes, setSrStunBoxes] = useState(10);
  const [srArmor, setSrArmor] = useState(12);
  const [srSkillsText, setSrSkillsText] = useState('Automatics 12, Longarms 10, Blades 9, Perception 8, Athletics 7');
  const [srCyberText, setSrCyberText] = useState('Wired Reflexes 1, Smartlink, Cybereyes II, Bone Lacing');
  const [srWeaponsText, setSrWeaponsText] = useState('Ares Predator V (Damage: 8P, AP: -1, SA), Ares Alpha (Damage: 11P, AP: -2, SA/BF/FA)');

  // Call of Cthulhu NPC / Monster Fields
  const [cocCategory, setCocCategory] = useState<'Servitor Monster' | 'Eldritch Deity' | 'Cultist Leader' | 'Investigator NPC'>('Servitor Monster');
  const [cocStr, setCocStr] = useState(80);
  const [cocCon, setCocCon] = useState(70);
  const [cocSiz, setCocSiz] = useState(90);
  const [cocDex, setCocDex] = useState(50);
  const [cocApp, setCocApp] = useState(10);
  const [cocInt, setCocInt] = useState(65);
  const [cocPow, setCocPow] = useState(75);
  const [cocEdu, setCocEdu] = useState(40);
  const [cocHp, setCocHp] = useState(16);
  const [cocMp, setCocMp] = useState(15);
  const [cocDb, setCocDb] = useState('+1d6');
  const [cocBuild, setCocBuild] = useState(2);
  const [cocMove, setCocMove] = useState(8);
  const [cocArmor, setCocArmor] = useState('3-point thick hide / chitin');
  const [cocSanLoss, setCocSanLoss] = useState('1/1d8 Sanity');
  const [cocAttacksText, setCocAttacksText] = useState('Tentacle Lash 60% (30/12), damage 1d6 + DB; Bite 45% (22/9), damage 2d6');
  const [cocSpellsText, setCocSpellsText] = useState('Dread Curse of Azathoth, Voorish Sign');

  // Fantasy Dynamic Action Lists
  const [actions, setActions] = useState([
    { id: '1', name: 'Claw Slash', attackBonus: 5, reachRange: '5 ft.', damage: '2d6 + 3', damageType: 'Slashing', notes: 'Target must succeed on a DC 13 STR save or be knocked prone.' }
  ]);

  const addAction = () => {
    setActions(prev => [...prev, {
      id: String(Date.now()),
      name: 'New Attack Action',
      attackBonus: 4,
      reachRange: '5 ft.',
      damage: '1d8 + 2',
      damageType: 'Piercing',
      notes: ''
    }]);
  };

  const removeAction = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const updateAction = (id: string, field: string, val: any) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let monsterDataPayload: any = {};
    let descSummary = '';
    let itemTags: string[] = ['monsters', edition, 'Homebrew'];

    if (edition === 'shadowrun') {
      itemTags.push(srArchetype, `PR ${srProfRating}`);
      monsterDataPayload = {
        name: name.trim(),
        race: srArchetype,
        characterClass: `Professional Rating ${srProfRating}`,
        subclass: `PR ${srProfRating}`,
        armorClass: srArmor,
        hpMax: srPhysBoxes,
        speed: 10,
        abilities: {
          STR: { score: srStr },
          DEX: { score: srAgi },
          CON: { score: srBod },
          INT: { score: srLog },
          WIS: { score: srInt },
          CHA: { score: srCha }
        },
        playerClassDetails: `Initiative: ${srInit} | Stun Boxes: ${srStunBoxes} | Essence: ${srEss} | Edge: ${srEdg}`,
        multiattack: srSkillsText,
        attacks: srWeaponsText.split(',').map((w, idx) => ({
          id: `sr-wpn-${idx}`,
          name: w.trim(),
          notes: w.trim()
        })),
        portraitUrl: portraitUrl.trim() || undefined,
        edition: 'shadowrun'
      };
      descSummary = `${srArchetype} (PR ${srProfRating}). Armor: ${srArmor}, Phys: ${srPhysBoxes} boxes, Stun: ${srStunBoxes} boxes. Init: ${srInit}. Cyberware: ${srCyberText}.`;
    } else if (edition === 'cthulhu') {
      itemTags.push(cocCategory, 'Cthulhu Mythos');
      monsterDataPayload = {
        name: name.trim(),
        race: cocCategory,
        characterClass: `SAN Loss: ${cocSanLoss}`,
        subclass: `Build ${cocBuild}, MOV ${cocMove}`,
        armorClass: 0,
        hpMax: cocHp,
        abilities: {
          STR: { score: cocStr },
          DEX: { score: cocDex },
          CON: { score: cocCon },
          INT: { score: cocInt },
          WIS: { score: cocPow },
          CHA: { score: cocApp }
        },
        playerClassDetails: `HP: ${cocHp}, MP: ${cocMp}, DB: ${cocDb}, Build: ${cocBuild}, MOV: ${cocMove}. Armor: ${cocArmor}. Sanity Loss: ${cocSanLoss}.`,
        attacks: cocAttacksText.split(';').map((atk, idx) => ({
          id: `coc-atk-${idx}`,
          name: atk.trim(),
          notes: atk.trim()
        })),
        portraitUrl: portraitUrl.trim() || undefined,
        edition: 'cthulhu'
      };
      descSummary = `${cocCategory}. HP: ${cocHp}, MP: ${cocMp}, DB: ${cocDb}, Sanity Loss: ${cocSanLoss}. Armor: ${cocArmor}. Attacks: ${cocAttacksText}.`;
    } else if (edition === 'pathfinder') {
      itemTags.push(`Level ${pf2Level}`, creatureType, alignment);
      monsterDataPayload = {
        name: name.trim(),
        race: creatureType,
        subclass: `Level ${pf2Level}`,
        challengeRating: String(pf2Level),
        sizeCategory: size as any,
        armorClass: ac,
        hpMax: hp,
        speed: parseInt(speed, 10) || 30,
        abilities: {
          STR: { score: str },
          DEX: { score: dex },
          CON: { score: con },
          INT: { score: intScore },
          WIS: { score: wis },
          CHA: { score: cha }
        },
        playerClassDetails: `Perception: +${pf2Perception} | Fort: +${fortSave}, Ref: +${refSave}, Will: +${willSave} | Weaknesses: ${pf2Weakness || 'None'}`,
        attacks: actions.map(a => ({
          id: a.id,
          name: a.name,
          attackBonus: a.attackBonus,
          range: a.reachRange,
          damage: a.damage,
          damageType: a.damageType,
          notes: a.notes
        })),
        portraitUrl: portraitUrl.trim() || undefined,
        edition: 'pathfinder'
      };
      descSummary = `Level ${pf2Level} ${size} ${creatureType}, ${alignment}. AC ${ac}, HP ${hp}, Speed ${speed}. Perception +${pf2Perception}.`;
    } else if (edition === '3.5e') {
      itemTags.push(`CR ${cr}`, creatureType, size);
      monsterDataPayload = {
        name: name.trim(),
        race: creatureType,
        subclass: `CR ${cr}`,
        challengeRating: cr,
        sizeCategory: size as any,
        armorClass: ac,
        touchAcOverride: touchAc,
        flatFootedAcOverride: flatFootedAc,
        hpMax: hp,
        hitDiceTotal: hitDice,
        speed: parseInt(speed, 10) || 30,
        bab,
        fortSaveBase: fortSave,
        refSaveBase: refSave,
        willSaveBase: willSave,
        spellResist: spellResist ? parseInt(spellResist, 10) : undefined,
        abilities: {
          STR: { score: str },
          DEX: { score: dex },
          CON: { score: con },
          INT: { score: intScore },
          WIS: { score: wis },
          CHA: { score: cha }
        },
        attacks: actions.map(a => ({
          id: a.id,
          name: a.name,
          attackBonus: a.attackBonus,
          range: a.reachRange,
          damage: a.damage,
          damageType: a.damageType,
          notes: a.notes
        })),
        portraitUrl: portraitUrl.trim() || undefined,
        edition: '3.5e'
      };
      descSummary = `CR ${cr} ${size} ${creatureType}. AC ${ac} (Touch ${touchAc}, Flat-Footed ${flatFootedAc}), HP ${hp} (${hitDice}), BAB +${bab}.`;
    } else {
      // 5e
      const xpVal = CR_XP_MAP[cr] || 100;
      itemTags.push(`CR ${cr}`, creatureType, size);
      monsterDataPayload = {
        name: name.trim(),
        race: creatureType,
        subclass: `CR ${cr}`,
        challengeRating: cr,
        monsterXpReward: xpVal,
        sizeCategory: size as any,
        alignment,
        armorClass: ac,
        hpMax: hp,
        hitDiceTotal: hitDice,
        speed: parseInt(speed, 10) || 30,
        abilities: {
          STR: { score: str },
          DEX: { score: dex },
          CON: { score: con },
          INT: { score: intScore },
          WIS: { score: wis },
          CHA: { score: cha }
        },
        attacks: actions.map(a => ({
          id: a.id,
          name: a.name,
          attackBonus: a.attackBonus,
          range: a.reachRange,
          damage: a.damage,
          damageType: a.damageType,
          notes: a.notes
        })),
        portraitUrl: portraitUrl.trim() || undefined,
        edition: '5e'
      };
      descSummary = `CR ${cr} (${xpVal} XP) ${size} ${creatureType}, ${alignment}. AC ${ac} (${acType}), HP ${hp} (${hitDice}), Speed ${speed}.`;
    }

    const newItem: CompendiumItem = {
      id: `custom-monster-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category: 'monsters',
      edition,
      source: sourceAuthor.trim() || 'Custom Homebrew',
      description: descSummary + (notes ? ` Notes: ${notes}` : ''),
      isCustom: true,
      tags: itemTags,
      monsterData: monsterDataPayload
    };

    onSave(newItem);
    setName('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {/* SHADOWRUN GRUNTS & NPCS */}
      {edition === 'shadowrun' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-cyan-300 font-bold mb-1">
                Grunt / NPC / Critter Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Renraku Red Samurai, NeoNET Decker, Street Thug Boss"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-cyan-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Professional Rating (PR)</label>
              <select
                value={srProfRating}
                onChange={(e) => setSrProfRating(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value={0}>PR 0 - Civilians / Gutter punks</option>
                <option value={1}>PR 1 - Gangers & Low-level Thugs</option>
                <option value={2}>PR 2 - Local Cops & Gang Enforcers</option>
                <option value={3}>PR 3 - Standard Corp Security</option>
                <option value={4}>PR 4 - Elite HTR & Veteran Mercs</option>
                <option value={5}>PR 5 - Special Forces & Prime Runners</option>
                <option value={6}>PR 6 - Red Samurai / Tir Ghosts</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Archetype</label>
              <input
                type="text"
                value={srArchetype}
                onChange={(e) => setSrArchetype(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Initiative</label>
              <input
                type="text"
                value={srInit}
                onChange={(e) => setSrInit(e.target.value)}
                placeholder="9 + 1d6"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Armor Value</label>
              <input
                type="number"
                value={srArmor}
                onChange={(e) => setSrArmor(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Condition Boxes</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={srPhysBoxes}
                  onChange={(e) => setSrPhysBoxes(parseInt(e.target.value, 10) || 0)}
                  placeholder="Phys"
                  className="w-1/2 px-2 py-2 bg-stone-950 border border-stone-700 rounded-xl text-rose-300 font-mono text-xs text-center"
                />
                <input
                  type="number"
                  value={srStunBoxes}
                  onChange={(e) => setSrStunBoxes(parseInt(e.target.value, 10) || 0)}
                  placeholder="Stun"
                  className="w-1/2 px-2 py-2 bg-stone-950 border border-stone-700 rounded-xl text-cyan-300 font-mono text-xs text-center"
                />
              </div>
            </div>
          </div>

          {/* Shadowrun Attributes Grid */}
          <div className="space-y-1 bg-stone-900/60 border border-stone-800 p-3 rounded-2xl">
            <div className="text-[11px] font-mono text-cyan-300 font-bold mb-2">Primary Attributes</div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center font-mono">
              {[
                { label: 'BOD', val: srBod, set: setSrBod },
                { label: 'AGI', val: srAgi, set: setSrAgi },
                { label: 'REA', val: srRea, set: setSrRea },
                { label: 'STR', val: srStr, set: setSrStr },
                { label: 'WIL', val: srWil, set: setSrWil },
                { label: 'LOG', val: srLog, set: setSrLog },
                { label: 'INT', val: srInt, set: setSrInt },
                { label: 'CHA', val: srCha, set: setSrCha },
              ].map(attr => (
                <div key={attr.label} className="bg-stone-950 p-1.5 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-bold">{attr.label}</div>
                  <input
                    type="number"
                    value={attr.val}
                    onChange={(e) => attr.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center bg-transparent text-cyan-300 font-bold text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Key Skills & Dice Pools</label>
            <input
              type="text"
              value={srSkillsText}
              onChange={(e) => setSrSkillsText(e.target.value)}
              placeholder="e.g. Automatics 12, Blades 10, Perception 9, Sneaking 8"
              className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Weapons & Augmentations</label>
            <input
              type="text"
              value={srWeaponsText}
              onChange={(e) => setSrWeaponsText(e.target.value)}
              placeholder="e.g. Ares Predator V (8P, AP -1), Cyberarm (STR 8), Wired Reflexes 1"
              className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}

      {/* CALL OF CTHULHU MONSTERS & NPCS */}
      {edition === 'cthulhu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-emerald-400 font-bold mb-1">
                Entity / Cultist / Monster Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Deep One Hybrid, Byakhee, Cult High Priest, Dimensional Shambler"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-emerald-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Entity Category</label>
              <select
                value={cocCategory}
                onChange={(e) => setCocCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
              >
                <option value="Servitor Monster">Servitor Monster</option>
                <option value="Eldritch Deity">Great Old One / Deity</option>
                <option value="Cultist Leader">Cultist / Antagonist</option>
                <option value="Investigator NPC">Investigator NPC</option>
              </select>
            </div>
          </div>

          {/* CoC Characteristics Grid */}
          <div className="space-y-1 bg-stone-900/60 border border-stone-800 p-3 rounded-2xl">
            <div className="text-[11px] font-mono text-emerald-300 font-bold mb-2">Characteristics (CoC 7e Percentile)</div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center font-mono">
              {[
                { label: 'STR', val: cocStr, set: setCocStr },
                { label: 'CON', val: cocCon, set: setCocCon },
                { label: 'SIZ', val: cocSiz, set: setCocSiz },
                { label: 'DEX', val: cocDex, set: setCocDex },
                { label: 'APP', val: cocApp, set: setCocApp },
                { label: 'INT', val: cocInt, set: setCocInt },
                { label: 'POW', val: cocPow, set: setCocPow },
                { label: 'EDU', val: cocEdu, set: setCocEdu },
              ].map(attr => (
                <div key={attr.label} className="bg-stone-950 p-1.5 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-bold">{attr.label}</div>
                  <input
                    type="number"
                    value={attr.val}
                    onChange={(e) => attr.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center bg-transparent text-emerald-300 font-bold text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Hit Points (HP)</label>
              <input
                type="number"
                value={cocHp}
                onChange={(e) => setCocHp(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-rose-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Damage Bonus (DB)</label>
              <input
                type="text"
                value={cocDb}
                onChange={(e) => setCocDb(e.target.value)}
                placeholder="+1d4, +1d6"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Sanity Loss</label>
              <input
                type="text"
                value={cocSanLoss}
                onChange={(e) => setCocSanLoss(e.target.value)}
                placeholder="1/1d8 Sanity"
                className="w-full px-2.5 py-2 bg-stone-950 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Armor / Protection</label>
              <input
                type="text"
                value={cocArmor}
                onChange={(e) => setCocArmor(e.target.value)}
                placeholder="2-pt rubbery hide"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Attacks per Round & Skills</label>
            <input
              type="text"
              value={cocAttacksText}
              onChange={(e) => setCocAttacksText(e.target.value)}
              placeholder="e.g. Tentacle Grab 60% (30/12), damage 1d6+DB; Bite 50% (25/10), damage 1d10"
              className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* FANTASY & PATHFINDER 2E MONSTERS */}
      {(edition === '5e' || edition === '3.5e' || edition === 'pathfinder') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Creature Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shadow Drake, Iron Golem, Dread Lich"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Tiny">Tiny</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Huge">Huge</option>
                <option value="Gargantuan">Gargantuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">
                {edition === 'pathfinder' ? 'Creature Level' : 'Challenge Rating (CR)'}
              </label>
              {edition === 'pathfinder' ? (
                <select
                  value={pf2Level}
                  onChange={(e) => setPf2Level(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
                >
                  <option value={-1}>Level -1</option>
                  <option value={0}>Level 0</option>
                  {Array.from({ length: 25 }, (_, i) => i + 1).map(lvl => (
                    <option key={lvl} value={lvl}>Level {lvl}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={cr}
                  onChange={(e) => setCr(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
                >
                  {Object.keys(CR_XP_MAP).map(k => (
                    <option key={k} value={k}>CR {k} ({CR_XP_MAP[k]} XP)</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Defense & HP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Armor Class (AC)</label>
              <input
                type="number"
                value={ac}
                onChange={(e) => setAc(parseInt(e.target.value, 10) || 10)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Hit Points (HP)</label>
              <input
                type="number"
                value={hp}
                onChange={(e) => setHp(parseInt(e.target.value, 10) || 10)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-emerald-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Hit Dice Formula</label>
              <input
                type="text"
                value={hitDice}
                onChange={(e) => setHitDice(e.target.value)}
                placeholder="8d8 + 16"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Speed</label>
              <input
                type="text"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="30 ft., fly 60 ft."
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>

          {/* Ability Scores */}
          <div className="bg-stone-900/60 border border-stone-800 p-3 rounded-2xl space-y-1">
            <div className="text-[11px] font-mono text-amber-300 font-bold mb-2">Ability Scores</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
              {[
                { label: 'STR', val: str, set: setStr },
                { label: 'DEX', val: dex, set: setDex },
                { label: 'CON', val: con, set: setCon },
                { label: 'INT', val: intScore, set: setIntScore },
                { label: 'WIS', val: wis, set: setWis },
                { label: 'CHA', val: cha, set: setCha },
              ].map(attr => {
                const mod = Math.floor((attr.val - 10) / 2);
                return (
                  <div key={attr.label} className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                    <div className="text-[10px] text-stone-400 font-bold">{attr.label}</div>
                    <input
                      type="number"
                      value={attr.val}
                      onChange={(e) => attr.set(parseInt(e.target.value, 10) || 10)}
                      className="w-full text-center bg-transparent text-stone-100 font-bold text-xs focus:outline-none"
                    />
                    <div className="text-[10px] text-amber-400 font-bold">{mod >= 0 ? `+${mod}` : mod}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3.5e Specific Combat Parameters */}
          {edition === '3.5e' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Base Attack Bonus (BAB)</label>
                <input
                  type="number"
                  value={bab}
                  onChange={(e) => setBab(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Touch AC / Flat-Footed</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={touchAc}
                    onChange={(e) => setTouchAc(parseInt(e.target.value, 10) || 10)}
                    placeholder="Touch"
                    className="w-1/2 px-2 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono text-center"
                  />
                  <input
                    type="number"
                    value={flatFootedAc}
                    onChange={(e) => setFlatFootedAc(parseInt(e.target.value, 10) || 10)}
                    placeholder="Flat"
                    className="w-1/2 px-2 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Fort / Ref / Will Saves</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={fortSave}
                    onChange={(e) => setFortSave(parseInt(e.target.value, 10) || 0)}
                    className="w-1/3 px-1 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono text-center"
                  />
                  <input
                    type="number"
                    value={refSave}
                    onChange={(e) => setRefSave(parseInt(e.target.value, 10) || 0)}
                    className="w-1/3 px-1 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono text-center"
                  />
                  <input
                    type="number"
                    value={willSave}
                    onChange={(e) => setWillSave(parseInt(e.target.value, 10) || 0)}
                    className="w-1/3 px-1 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Spell Resistance (SR)</label>
                <input
                  type="text"
                  value={spellResist}
                  onChange={(e) => setSpellResist(e.target.value)}
                  placeholder="e.g. 18, None"
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Attacks / Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                ⚔️ Actions & Attack Moves
              </span>
              <button
                type="button"
                onClick={addAction}
                className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold hover:bg-amber-500/30 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Attack</span>
              </button>
            </div>

            <div className="space-y-2">
              {actions.map((act) => (
                <div key={act.id} className="p-3 bg-stone-900/80 border border-stone-800 rounded-xl space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={act.name}
                        onChange={(e) => updateAction(act.id, 'name', e.target.value)}
                        placeholder="Action Name (e.g. Bite, Greatsword)"
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-stone-100 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={act.attackBonus}
                        onChange={(e) => updateAction(act.id, 'attackBonus', parseInt(e.target.value, 10) || 0)}
                        placeholder="To Hit (+5)"
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-300 font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={act.damage}
                        onChange={(e) => updateAction(act.id, 'damage', e.target.value)}
                        placeholder="2d6 + 3"
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-emerald-300 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeAction(act.id)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={act.notes}
                    onChange={(e) => updateAction(act.id, 'notes', e.target.value)}
                    placeholder="Additional rider effect (e.g. DC 13 CON save against poison...)"
                    className="w-full px-2.5 py-1 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portrait URL & Lore Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-mono text-stone-400 mb-1">Portrait Image URL (Optional)</label>
          <input
            type="url"
            value={portraitUrl}
            onChange={(e) => setPortraitUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-stone-400 mb-1">DM Lore & Ecology Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ecology, tactics, encounter triggers..."
            className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-bold font-mono transition border border-stone-800 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Statblock to Compendium</span>
        </button>
      </div>
    </form>
  );
};
