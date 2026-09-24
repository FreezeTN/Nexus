import React, { useState, useEffect } from 'react';
import { CharacterData, Party, RuleEdition } from '../../types';
import { UserProfile, GameSession } from '../../lib/firebase';
import { ShadowrunCombatPanel } from '../shadowrun/ShadowrunCombatPanel';
import { EncounterTracker } from '../combat/EncounterTracker';
import { AttackResolver } from '../combat/AttackResolver';
import { useEncounterState } from '../combat/encounter/useEncounterState';
import { MaxHpInspectorModal } from '../modals/MaxHpInspectorModal';
import { ModifierInspectorModal } from '../modals/ModifierInspectorModal';
import { SpellTargetModal } from '../modals/SpellTargetModal';
import { TransformationModal } from '../modals/TransformationModal';
import { CompanionModal } from '../modals/CompanionModal';

import { CombatDefensesPanel } from './sheet2/CombatDefensesPanel';
import { AttacksSpellsPanel } from './sheet2/AttacksSpellsPanel';
import { TurnActionEconomyBar } from '../combat/TurnActionEconomyBar';
import { CombatStickyMiniHud } from '../combat/CombatStickyMiniHud';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import { EmptyLayoutState } from '../common/EmptyLayoutState';
import { ModifierTarget } from '../../domain/modifierEngine';
import { get35eArmorClass, getArmorClassBreakdown } from '../../utils/dndCalculations';
import { Swords, Map, Crosshair, Layers, Sparkles, LayoutList } from 'lucide-react';

type CombatViewPreference = 'auto' | 'tabbed' | 'stacked';
type CombatActiveTab = 'attacks' | 'encounter' | 'resolver' | 'stacked';

interface Sheet2Props {
  character: CharacterData;
  edition?: RuleEdition;
  allCharacters?: CharacterData[];
  parties?: Party[];
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  activeSessionCode?: string | null;
  onOpenPartyManager?: () => void;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
}

export const Sheet2Combat: React.FC<Sheet2Props> = ({
  character,
  edition,
  allCharacters = [],
  parties = [],
  currentUser,
  activeSession,
  activeSessionCode,
  onOpenPartyManager,
  onUpdateCharacter,
  onAddMonsterToRoster,
  onRoll,
  onRollDamage,
  onOpenGenerators
}) => {
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showMaxHpInspector, setShowMaxHpInspector] = useState(false);
  const [showModifierInspector, setShowModifierInspector] = useState(false);
  const [inspectedTarget, setInspectedTarget] = useState<ModifierTarget>('ac');
  const [targetModalSpell, setTargetModalSpell] = useState<any | null>(null);

  const encounter = useEncounterState({
    character,
    allCharacters,
    parties,
    currentUser,
    activeSession,
    activeSessionCode,
    onUpdateCharacter,
    onRoll
  });

  const handleConfirmCastSpellTarget = (
    spellToCast: any,
    selectedTargetIds: string[],
    condName: string,
    slotLevelToExpend?: number,
    scaledDamage?: string
  ) => {
    const levelToDeduct = slotLevelToExpend !== undefined ? slotLevelToExpend : spellToCast.level;
    const updatedSlots = levelToDeduct > 0
      ? (character.spellSlots || []).map(s => s.level === levelToDeduct ? { ...s, current: Math.max(0, s.current - 1) } : s)
      : character.spellSlots;

    const availableTargets = allCharacters.length > 0 ? allCharacters : [character];
    const targetList = availableTargets.filter(c => selectedTargetIds.includes(c.id));
    const targetNamesStr = targetList.map(c => c.name).join(', ') || character.name;

    targetList.forEach(target => {
      const currentConds = target.conditions || [];
      const updatedConds = currentConds.includes(condName) ? currentConds : [...currentConds, condName];

      onUpdateCharacter({
        ...target,
        ...(target.id === character.id ? { spellSlots: updatedSlots } : {}),
        conditions: updatedConds
      });
    });

    if (targetList.length === 0) {
      onUpdateCharacter({
        ...character,
        spellSlots: updatedSlots
      });
    }

    const activeDmg = scaledDamage || spellToCast.damage;
    const isUpcast = levelToDeduct > (spellToCast.level || 1);
    const upcastPrefix = isUpcast ? ` [Upcast Lvl ${levelToDeduct}]` : '';

    if (activeDmg) {
      onRollDamage(`✨ Cast ${spellToCast.name}${upcastPrefix} on ${targetNamesStr} (Damage: ${activeDmg}) - Applied '${condName}'!`, activeDmg);
    } else {
      onRollDamage(`✨ Cast ${spellToCast.name}${upcastPrefix} on ${targetNamesStr} - Applied '${condName}' status!`, '1d20');
    }

    setTargetModalSpell(null);
  };

  const { isVisible } = useLayoutCustomization();

  // View preference (persisted: 'auto' | 'tabbed' | 'stacked')
  const [viewPreference, setViewPreference] = useState<CombatViewPreference>(() => {
    try {
      const saved = localStorage.getItem('nexus_combat_view_preference');
      if (saved === 'tabbed' || saved === 'stacked' || saved === 'auto') return saved;
    } catch {}
    return 'auto';
  });

  // Responsive Viewport measurement (for resolution auto-detection)
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Screen is compact if height < 900px (standard laptop with bookmarks/chrome) or width < 1024px (tablets/split screen)
  const isScreenCompact = viewportSize.height < 900 || viewportSize.width < 1024;
  const effectiveLayoutMode: 'tabbed' | 'stacked' =
    viewPreference === 'auto'
      ? (isScreenCompact ? 'tabbed' : 'stacked')
      : viewPreference;

  // Active tab in tabbed mode (persisted)
  const [activeTab, setActiveTab] = useState<CombatActiveTab>(() => {
    try {
      const saved = localStorage.getItem('nexus_combat_active_tab');
      if (saved === 'attacks' || saved === 'encounter' || saved === 'resolver' || saved === 'stacked') return saved;
    } catch {}
    return 'attacks';
  });

  const handleSetViewPreference = (pref: CombatViewPreference) => {
    setViewPreference(pref);
    try {
      localStorage.setItem('nexus_combat_view_preference', pref);
    } catch {}
  };

  const handleSelectTab = (tab: CombatActiveTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('nexus_combat_active_tab', tab);
    } catch {}
  };

  // AC stats for Mini HUD
  const is35e = character.edition === '3.5e' || edition === '3.5e';
  const ac35 = is35e ? get35eArmorClass(character) : null;
  const effectiveAc = is35e ? (ac35?.totalAc ?? character.armorClass ?? 10) : getArmorClassBreakdown(character).total;
  const touchAc = ac35?.touchAc;
  const flatFootedAc = ac35?.flatFootedAc;

  const hasDefensesVisible =
    isVisible('s2_vitalityHpOrb') ||
    isVisible('s2_defenseStats') ||
    isVisible('s2_deathSavesForm') ||
    isVisible('s2_conditionsPanel');

  const hasAttacksVisible =
    isVisible('s2_attacksWeapons') ||
    isVisible('s2_combatSpellsPotions');

  const hasEncounterVisible =
    isVisible('s2_encounterTracker') ||
    isVisible('s2_attackResolver');

  const hasAnyVisible = character.edition === 'shadowrun'
    ? isVisible('sr_combat')
    : (hasDefensesVisible || hasEncounterVisible || hasAttacksVisible);

  if (!hasAnyVisible) {
    return <EmptyLayoutState sheetName="Combat & Actions" />;
  }

  if (character.edition === 'shadowrun') {
    return (
      <ShadowrunCombatPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Floating / Sticky Mini-HUD for Mobile & Scrolled Combat View */}
      <CombatStickyMiniHud
        character={character}
        edition={edition}
        onUpdateCharacter={onUpdateCharacter}
        effectiveAc={effectiveAc}
        touchAc={touchAc}
        flatFootedAc={flatFootedAc}
      />

      {/* Real-time Turn & Action Economy Bar */}
      <TurnActionEconomyBar
        character={character}
        edition={edition}
        onUpdateCharacter={onUpdateCharacter}
      />

      {/* Combat Defenses, HP & Saves */}
      {hasDefensesVisible && (
        <CombatDefensesPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
          setShowMaxHpInspector={setShowMaxHpInspector}
          setShowTransformationModal={setShowTransformationModal}
          setShowCompanionModal={setShowCompanionModal}
          setShowModifierInspector={(target) => {
            if (target) setInspectedTarget(target);
            setShowModifierInspector(true);
          }}
        />
      )}

      {/* Combat Suite Mode Selector & Tab Navigation Bar */}
      {(hasEncounterVisible || hasAttacksVisible) && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Navigation Tabs (Active in Tabbed Mode) */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {effectiveLayoutMode === 'tabbed' && (
              <>
                {hasAttacksVisible && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab('attacks')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'attacks'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                        : 'bg-stone-950 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Attacks & Spells</span>
                  </button>
                )}

                {isVisible('s2_encounterTracker') && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab('encounter')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'encounter'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                        : 'bg-stone-950 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Encounter & Map</span>
                    {encounter.combatants.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === 'encounter' ? 'bg-stone-900 text-amber-300' : 'bg-stone-800 text-stone-300'
                      }`}>
                        {encounter.combatants.length}
                      </span>
                    )}
                  </button>
                )}

                {isVisible('s2_attackResolver') && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab('resolver')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'resolver'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                        : 'bg-stone-950 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Attack Resolver</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSelectTab('stacked')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'stacked'
                      ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                      : 'bg-stone-950 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800'
                  }`}
                  title="Display all combat panels stacked together"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Show All</span>
                </button>
              </>
            )}

            {effectiveLayoutMode === 'stacked' && (
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-stone-300">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Combat Engines & Attack Suites (Stacked View)</span>
              </div>
            )}
          </div>

          {/* View Mode Auto/Manual Switcher */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-[11px] font-mono shrink-0 ml-auto">
            <span className="text-[10px] text-stone-500 uppercase px-1.5 font-bold">Mode:</span>
            <button
              type="button"
              onClick={() => handleSetViewPreference('auto')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewPreference === 'auto'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/70 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title={`Resolution Auto-detect (${viewportSize.width}×${viewportSize.height}px → ${isScreenCompact ? 'Compact: Tabbed' : 'Desktop: Stacked'})`}
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Auto</span>
              <span className="text-[9px] opacity-75">({isScreenCompact ? 'Compact' : 'Desktop'})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewPreference('tabbed')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                viewPreference === 'tabbed'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/70 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Lock to Tabbed view"
            >
              Tabs
            </button>

            <button
              type="button"
              onClick={() => handleSetViewPreference('stacked')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                viewPreference === 'stacked'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/70 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Lock to Stacked view"
            >
              Stacked
            </button>
          </div>
        </div>
      )}

      {/* Render Combat Panels according to Layout Mode */}
      {effectiveLayoutMode === 'stacked' || activeTab === 'stacked' ? (
        <>
          {/* Interactive Encounter & Initiative Tracker */}
          {isVisible('s2_encounterTracker') && (
            <EncounterTracker
              character={character}
              allCharacters={allCharacters}
              parties={parties}
              currentUser={currentUser}
              activeSession={activeSession}
              activeSessionCode={activeSessionCode}
              onOpenPartyManager={onOpenPartyManager}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
              encounterState={encounter}
              onOpenGenerators={onOpenGenerators}
            />
          )}

          {/* Target AC Hit & Attack Resolver (Separate Box) */}
          {isVisible('s2_attackResolver') && (
            <AttackResolver
              character={encounter.activeAttackerCharacter}
              allCharacters={allCharacters}
              combatants={encounter.combatants}
              activeCombatantId={encounter.activeCombatant?.id}
              encounterEnvironment={encounter.encounterEnvironment}
              weatherEffect={encounter.battlemapWeatherEffect}
              onApplyDamageToCombatant={(targetId, damageAmount) => {
                encounter.handleAdjustHp(targetId, -damageAmount);
              }}
              onRoll={onRoll}
              onLogAction={(category, message, actor) => encounter.addLogEntry(category, message, actor)}
            />
          )}

          {/* Attacks, Spells & Quick Combat Panel */}
          {hasAttacksVisible && (
            <AttacksSpellsPanel
              character={character}
              edition={edition}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
              onRollDamage={onRollDamage}
              setTargetModalSpell={setTargetModalSpell}
              onOpenShapeshift={() => setShowTransformationModal(true)}
              onOpenSummonCompanion={() => setShowCompanionModal(true)}
            />
          )}
        </>
      ) : (
        <>
          {activeTab === 'attacks' && hasAttacksVisible && (
            <AttacksSpellsPanel
              character={character}
              edition={edition}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
              onRollDamage={onRollDamage}
              setTargetModalSpell={setTargetModalSpell}
              onOpenShapeshift={() => setShowTransformationModal(true)}
              onOpenSummonCompanion={() => setShowCompanionModal(true)}
            />
          )}

          {activeTab === 'encounter' && isVisible('s2_encounterTracker') && (
            <EncounterTracker
              character={character}
              allCharacters={allCharacters}
              parties={parties}
              currentUser={currentUser}
              activeSession={activeSession}
              activeSessionCode={activeSessionCode}
              onOpenPartyManager={onOpenPartyManager}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
              encounterState={encounter}
              onOpenGenerators={onOpenGenerators}
            />
          )}

          {activeTab === 'resolver' && isVisible('s2_attackResolver') && (
            <AttackResolver
              character={encounter.activeAttackerCharacter}
              allCharacters={allCharacters}
              combatants={encounter.combatants}
              activeCombatantId={encounter.activeCombatant?.id}
              encounterEnvironment={encounter.encounterEnvironment}
              weatherEffect={encounter.battlemapWeatherEffect}
              onApplyDamageToCombatant={(targetId, damageAmount) => {
                encounter.handleAdjustHp(targetId, -damageAmount);
              }}
              onRoll={onRoll}
              onLogAction={(category, message, actor) => encounter.addLogEntry(category, message, actor)}
            />
          )}
        </>
      )}

      {/* MODALS */}
      {showMaxHpInspector && (
        <MaxHpInspectorModal
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowMaxHpInspector(false)}
        />
      )}

      {showModifierInspector && (
        <ModifierInspectorModal
          isOpen={true}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          initialTarget={inspectedTarget}
          onClose={() => setShowModifierInspector(false)}
        />
      )}

      {showTransformationModal && (
        <TransformationModal
          isOpen={true}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowTransformationModal(false)}
        />
      )}

      {showCompanionModal && (
        <CompanionModal
          isOpen={true}
          character={character}
          edition={character.edition}
          onUpdateCharacter={onUpdateCharacter}
          onAddMonsterToRoster={onAddMonsterToRoster}
          onClose={() => setShowCompanionModal(false)}
          onRoll={onRoll}
          onRollDamage={onRollDamage}
        />
      )}

      {targetModalSpell && (
        <SpellTargetModal
          spell={targetModalSpell}
          caster={character}
          allCharacters={allCharacters.length > 0 ? allCharacters : [character]}
          onConfirmCast={(spell, targetIds, conditionName) => handleConfirmCastSpellTarget(spell, targetIds, conditionName)}
          onClose={() => setTargetModalSpell(null)}
        />
      )}
    </div>
  );
};
