import React from 'react';
import {
  Sparkles,
  Flame,
  Zap,
  Snowflake,
  Shield,
  Circle,
  Triangle,
  Square,
  Maximize2,
  Compass,
  RotateCw,
  Trash2,
  Lock,
  Unlock,
  Dices,
  Ruler,
  Eye,
  CheckCircle2
} from 'lucide-react';
import {
  AoETemplate,
  AoEShape,
  STANDARD_SPELL_AOE_PRESETS,
  SpellAoEPreset
} from './battlemapTypes';
import { Combatant } from '../combat/encounter/encounterTypes';

interface AoEControlPaletteProps {
  activeTemplate: AoETemplate | null;
  onUpdateTemplate: (template: AoETemplate | null) => void;
  caughtCombatants: Combatant[];
  isRulerActive: boolean;
  onToggleRuler: () => void;
  onRollSavesForTargets?: (saveType: string, dc: number, targets: Combatant[]) => void;
  onApplyDamageToTargets?: (damageDice: string, damageType: string, targets: Combatant[]) => void;
  onClose: () => void;
}

export const AoEControlPalette: React.FC<AoEControlPaletteProps> = ({
  activeTemplate,
  onUpdateTemplate,
  caughtCombatants,
  isRulerActive,
  onToggleRuler,
  onRollSavesForTargets,
  onApplyDamageToTargets,
  onClose
}) => {
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>('fireball');
  const [saveDc, setSaveDc] = React.useState<number>(14);

  // Apply a spell preset
  const handleApplyPreset = (preset: SpellAoEPreset) => {
    setSelectedPresetId(preset.id);
    const newTemplate: AoETemplate = {
      id: `aoe-${Date.now()}`,
      name: preset.name,
      shape: preset.shape,
      originX: activeTemplate ? activeTemplate.originX : 10,
      originY: activeTemplate ? activeTemplate.originY : 8,
      radiusFeet: preset.shape === 'circle' ? preset.sizeFeet : preset.sizeFeet / 2,
      lengthFeet: preset.sizeFeet,
      widthFeet: preset.widthFeet || (preset.shape === 'cube' ? preset.sizeFeet : 5),
      angleDegrees: activeTemplate ? activeTemplate.angleDegrees : 0,
      color: preset.color,
      borderColor: preset.borderColor,
      saveType: preset.saveType,
      saveDc: saveDc,
      damageDice: preset.damageDice,
      damageType: preset.damageType,
      description: preset.description,
      isLocked: false
    };
    onUpdateTemplate(newTemplate);
  };

  // Change basic shape
  const handleChangeShape = (shape: AoEShape) => {
    if (!activeTemplate) {
      const defaultSize = shape === 'line' ? 60 : shape === 'cone' ? 30 : 20;
      onUpdateTemplate({
        id: `aoe-${Date.now()}`,
        name: `Custom ${shape.toUpperCase()}`,
        shape,
        originX: 10,
        originY: 8,
        radiusFeet: shape === 'circle' ? defaultSize : defaultSize / 2,
        lengthFeet: defaultSize,
        widthFeet: shape === 'line' ? 5 : defaultSize,
        angleDegrees: 0,
        color: 'rgba(239, 68, 68, 0.35)',
        borderColor: '#ef4444',
        saveType: 'DEX',
        saveDc,
        isLocked: false
      });
      return;
    }

    onUpdateTemplate({
      ...activeTemplate,
      shape,
      name: `Custom ${shape.toUpperCase()}`
    });
  };

  // Quick size adjust
  const handleAdjustSize = (deltaFeet: number) => {
    if (!activeTemplate) return;
    const currentSize = activeTemplate.shape === 'circle' ? activeTemplate.radiusFeet : activeTemplate.lengthFeet;
    const newSize = Math.max(5, Math.min(120, currentSize + deltaFeet));

    onUpdateTemplate({
      ...activeTemplate,
      radiusFeet: newSize,
      lengthFeet: newSize,
      widthFeet: activeTemplate.shape === 'cube' ? newSize : activeTemplate.widthFeet
    });
  };

  // Rotate template
  const handleRotate = (degrees: number) => {
    if (!activeTemplate) return;
    let newAngle = (activeTemplate.angleDegrees + degrees) % 360;
    if (newAngle < 0) newAngle += 360;
    onUpdateTemplate({
      ...activeTemplate,
      angleDegrees: newAngle
    });
  };

  const alliesCaught = caughtCombatants.filter((c) => c.type === 'player' || c.type === 'ally');
  const enemiesCaught = caughtCombatants.filter((c) => c.type === 'enemy');

  return (
    <div
      id="aoe-control-palette"
      className="bg-stone-900 border-b border-stone-800 p-3 text-xs text-stone-300 shadow-xl animate-fadeIn z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Presets & Shape Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 pr-2 border-r border-stone-700">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-serif">Tactical Spells & AoE</span>
          </div>

          {/* Quick Spell Presets */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[420px] scrollbar-none">
            {STANDARD_SPELL_AOE_PRESETS.slice(0, 6).map((preset) => {
              const isSelected = selectedPresetId === preset.id && activeTemplate;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-bold shadow'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                  }`}
                  title={`${preset.name} (${preset.sizeFeet}ft ${preset.shape}): ${preset.description}`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Shape Buttons */}
          <div className="flex items-center gap-0.5 bg-stone-950 p-0.5 rounded border border-stone-800 ml-1">
            <button
              type="button"
              onClick={() => handleChangeShape('circle')}
              className={`p-1 rounded text-[10px] flex items-center gap-0.5 ${
                activeTemplate?.shape === 'circle' ? 'bg-amber-600 text-white font-bold' : 'hover:text-amber-300'
              }`}
              title="Sphere / Circle Radius"
            >
              <Circle className="w-3 h-3" />
              <span>Sphere</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeShape('cone')}
              className={`p-1 rounded text-[10px] flex items-center gap-0.5 ${
                activeTemplate?.shape === 'cone' ? 'bg-amber-600 text-white font-bold' : 'hover:text-amber-300'
              }`}
              title="Directional Cone"
            >
              <Triangle className="w-3 h-3 rotate-90" />
              <span>Cone</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeShape('cube')}
              className={`p-1 rounded text-[10px] flex items-center gap-0.5 ${
                activeTemplate?.shape === 'cube' ? 'bg-amber-600 text-white font-bold' : 'hover:text-amber-300'
              }`}
              title="Cube / Box"
            >
              <Square className="w-3 h-3" />
              <span>Cube</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeShape('line')}
              className={`p-1 rounded text-[10px] flex items-center gap-0.5 ${
                activeTemplate?.shape === 'line' ? 'bg-amber-600 text-white font-bold' : 'hover:text-amber-300'
              }`}
              title="Line Ray"
            >
              <Maximize2 className="w-3 h-3 rotate-45" />
              <span>Line</span>
            </button>
          </div>

          {/* Ruler Mode Toggle */}
          <button
            type="button"
            onClick={onToggleRuler}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition border ${
              isRulerActive
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-cyan-300 border-stone-700'
            }`}
            title="Measure Line-of-Sight & Cover Ruler"
          >
            <Ruler className="w-3 h-3" />
            <span>Ruler</span>
          </button>
        </div>

        {/* Center/Right: Active Template Controls & Target Counter */}
        {activeTemplate && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Template Size Adjuster */}
            <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded border border-stone-800 text-[11px]">
              <span className="text-stone-400 font-mono">Size:</span>
              <button
                type="button"
                onClick={() => handleAdjustSize(-5)}
                className="w-5 h-5 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded text-stone-200 font-bold"
              >
                -
              </button>
              <span className="font-bold font-mono text-amber-300 px-1">
                {activeTemplate.shape === 'circle' ? activeTemplate.radiusFeet : activeTemplate.lengthFeet} ft
              </span>
              <button
                type="button"
                onClick={() => handleAdjustSize(5)}
                className="w-5 h-5 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded text-stone-200 font-bold"
              >
                +
              </button>
            </div>

            {/* Rotation Controls for Cone and Line */}
            {(activeTemplate.shape === 'cone' || activeTemplate.shape === 'line') && (
              <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded border border-stone-800 text-[11px]">
                <Compass className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-mono text-amber-300">{activeTemplate.angleDegrees}°</span>
                <button
                  type="button"
                  onClick={() => handleRotate(-45)}
                  className="p-1 hover:text-amber-300"
                  title="Rotate 45° CCW"
                >
                  <RotateCw className="w-3 h-3 -scale-x-100" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(45)}
                  className="p-1 hover:text-amber-300"
                  title="Rotate 45° CW"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Lock in place */}
            <button
              type="button"
              onClick={() => onUpdateTemplate({ ...activeTemplate, isLocked: !activeTemplate.isLocked })}
              className={`p-1.5 rounded border transition ${
                activeTemplate.isLocked
                  ? 'bg-stone-800 text-amber-400 border-amber-600'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
              title={activeTemplate.isLocked ? 'Template is locked in place' : 'Lock template position'}
            >
              {activeTemplate.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            {/* Target Catch Count & Quick Actions */}
            <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
              <span className="text-[11px] font-bold">
                Targets: <span className="text-amber-400 font-mono">{caughtCombatants.length}</span>
              </span>
              {enemiesCaught.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 rounded text-[10px] font-mono border border-rose-800">
                  {enemiesCaught.length} Enemies
                </span>
              )}
              {alliesCaught.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded text-[10px] font-mono border border-emerald-800">
                  {alliesCaught.length} Allies
                </span>
              )}

              {/* Roll Saves Button */}
              {caughtCombatants.length > 0 && activeTemplate.saveType && (
                <button
                  type="button"
                  onClick={() =>
                    onRollSavesForTargets?.(
                      activeTemplate.saveType || 'DEX',
                      activeTemplate.saveDc || saveDc,
                      caughtCombatants
                    )
                  }
                  className="flex items-center gap-1 px-2 py-0.5 bg-purple-900 hover:bg-purple-800 text-purple-200 rounded text-[10px] font-bold border border-purple-700 transition ml-1"
                  title={`Roll DC ${activeTemplate.saveDc || saveDc} ${activeTemplate.saveType} saving throw for all ${caughtCombatants.length} targets`}
                >
                  <Dices className="w-3 h-3" />
                  <span>DC {activeTemplate.saveDc || saveDc} {activeTemplate.saveType} Save</span>
                </button>
              )}

              {/* Roll Damage Button */}
              {caughtCombatants.length > 0 && activeTemplate.damageDice && (
                <button
                  type="button"
                  onClick={() =>
                    onApplyDamageToTargets?.(
                      activeTemplate.damageDice || '8d6',
                      activeTemplate.damageType || 'Fire',
                      caughtCombatants
                    )
                  }
                  className="flex items-center gap-1 px-2 py-0.5 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded text-[10px] font-bold border border-rose-700 transition"
                  title={`Roll ${activeTemplate.damageDice} ${activeTemplate.damageType} damage`}
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{activeTemplate.damageDice}</span>
                </button>
              )}
            </div>

            {/* Clear Template */}
            <button
              type="button"
              onClick={() => onUpdateTemplate(null)}
              className="p-1.5 text-stone-400 hover:text-rose-400 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded transition"
              title="Remove AoE template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Close Drawer button */}
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};
