import React, { useState } from 'react';
import {
  X,
  CloudRain,
  Wind,
  Flame,
  Shield,
  Eye,
  AlertTriangle,
  Zap,
  Info,
  Check,
  Sparkles,
  Wand2
} from 'lucide-react';
import {
  WeatherEffectType,
  WeatherDefinition,
  WEATHER_DEFINITIONS
} from './weatherDefinitions';
import { WEATHER_ABILITY_TRIGGERS, WeatherTrigger } from './weatherAbilityTriggers';
import { eventBus } from '../../events/eventBus';

interface WeatherTacticalRulesModalProps {
  currentWeather: WeatherEffectType;
  onSelectWeather: (weather: WeatherEffectType) => void;
  onClose: () => void;
}

export const WeatherTacticalRulesModal: React.FC<WeatherTacticalRulesModalProps> = ({
  currentWeather,
  onSelectWeather,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'triggers'>('catalog');
  const [triggerFilter, setTriggerFilter] = useState<'all' | 'spell' | 'monster'>('all');
  const activeDef: WeatherDefinition = WEATHER_DEFINITIONS[currentWeather] || WEATHER_DEFINITIONS.none;

  const categories: Array<{
    title: string;
    icon: string;
    items: WeatherDefinition[];
  }> = [
    {
      title: 'Atmospheric & Wind',
      icon: '💨',
      items: [
        WEATHER_DEFINITIONS.none,
        WEATHER_DEFINITIONS.wind,
        WEATHER_DEFINITIONS.mist,
        WEATHER_DEFINITIONS.sunbeams
      ]
    },
    {
      title: 'Precipitation',
      icon: '🌧️',
      items: [
        WEATHER_DEFINITIONS.rain,
        WEATHER_DEFINITIONS.snow
      ]
    },
    {
      title: 'Severe Storms & Gales (5e RAW)',
      icon: '⛈️',
      items: [
        WEATHER_DEFINITIONS.storm,
        WEATHER_DEFINITIONS.blizzard,
        WEATHER_DEFINITIONS.hail,
        WEATHER_DEFINITIONS.sandstorm
      ]
    },
    {
      title: 'Planar Hazards & Supernatural',
      icon: '🔮',
      items: [
        WEATHER_DEFINITIONS.embers,
        WEATHER_DEFINITIONS.ashfall,
        WEATHER_DEFINITIONS.acid_rain,
        WEATHER_DEFINITIONS.blood_rain,
        WEATHER_DEFINITIONS.arcane
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activeDef.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-100 font-mono">
                  Tactical Weather & Atmospheric Conditions
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${activeDef.badgeBg} ${activeDef.badgeBorder} ${activeDef.badgeText}`}
                >
                  Active: {activeDef.name}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Official D&D 5e / 3.5e Rules As Written (DMG pp. 109–111) & Planar Hazards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-stone-950 border-b border-stone-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span>🌦️</span>
            <span>Weather Catalog & Rules (15 Types)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('triggers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'triggers'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span>⚡</span>
            <span>RAW Weather Abilities & Spells</span>
            <span className="text-[10px] bg-amber-900/60 text-amber-200 px-1.5 py-0.2 rounded border border-amber-600/40">
              {WEATHER_ABILITY_TRIGGERS.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'catalog' && (
            <>
              {/* Active Weather Highlight Card */}
          <div
            className={`p-4 rounded-xl border ${activeDef.badgeBg} ${activeDef.badgeBorder} shadow-lg`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{activeDef.icon}</span>
                <div>
                  <h4 className="text-base font-bold text-stone-100 font-mono">
                    {activeDef.name}
                  </h4>
                  <p className="text-xs text-stone-300 italic">{activeDef.tagline}</p>
                </div>
              </div>
              {activeDef.id !== 'none' && (
                <button
                  type="button"
                  onClick={() => onSelectWeather('none')}
                  className="px-2.5 py-1 text-xs rounded-lg font-mono font-bold bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 transition cursor-pointer"
                >
                  Clear Weather
                </button>
              )}
            </div>

            {/* Tactical Rules Banner */}
            <div className="mt-3 p-3 bg-stone-950/70 rounded-lg border border-stone-800/80 text-xs text-stone-200 leading-relaxed font-sans">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold uppercase text-[11px] mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>Tactical Rules & Combat Mechanics</span>
              </div>
              {activeDef.tacticalRules}
            </div>

            {/* Tactical Modifier Badges */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
              {activeDef.disadvantageRangedAttacks && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Ranged Attacks: Disadvantage
                </span>
              )}
              {activeDef.disadvantageHearingPerception && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-amber-200">
                  <Eye className="w-3 h-3 text-amber-400" />
                  Hearing/Perception: Disadvantage
                </span>
              )}
              {activeDef.extinguishesFlames && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-950/80 border border-sky-500/50 text-sky-200">
                  <Flame className="w-3 h-3 text-sky-400" />
                  Torches & Open Flames: Extinguished
                </span>
              )}
              {activeDef.difficultTerrainGround && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-950/80 border border-teal-500/50 text-teal-200">
                  <Wind className="w-3 h-3 text-teal-400" />
                  Ground: Slippery Difficult Terrain
                </span>
              )}
              {activeDef.concentrationDC && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950/80 border border-purple-500/50 text-purple-200">
                  <Shield className="w-3 h-3 text-purple-400" />
                  Concentration Check: {activeDef.concentrationDC}
                </span>
              )}
              {activeDef.forcesFlyLandingOrDC && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/50 text-indigo-200">
                  <Zap className="w-3 h-3 text-indigo-400" />
                  Flying: Must Land or DC 10 Str
                </span>
              )}
              {activeDef.extremeCold && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-200">
                  ❄️ Extreme Cold: DC 10 Con / Hour vs Exhaustion
                </span>
              )}
              {activeDef.extremeHeat && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-950/80 border border-orange-500/50 text-orange-200">
                  🔥 Extreme Heat: Con Save vs Exhaustion
                </span>
              )}
            </div>
          </div>

          {/* Weather Catalog & Quick Switcher */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase text-stone-400 tracking-wider">
              Switch Weather & Atmosphere (15 Conditions)
            </h4>

            {categories.map((cat) => (
              <div key={cat.title} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-stone-300 font-bold border-b border-stone-800 pb-1">
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item) => {
                    const isSelected = item.id === currentWeather;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectWeather(item.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? `${item.badgeBg} ${item.badgeBorder} ring-2 ring-amber-500/50`
                            : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
                        }`}
                      >
                        <span className="text-xl pt-0.5 shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold font-mono truncate ${
                                isSelected ? item.badgeText : 'text-stone-200'
                              }`}
                            >
                              {item.name}
                            </span>
                            {isSelected && (
                              <span className="shrink-0 flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 line-clamp-1">
                            {item.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'triggers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-stone-800">
            <div>
              <h4 className="text-sm font-bold text-stone-100 font-mono flex items-center gap-1.5">
                <span>⚡</span>
                <span>RAW Environmental Abilities, Spells & Lair Triggers</span>
              </h4>
              <p className="text-xs text-stone-400">
                Official 5e spells and monster traits that summon, alter, or command battlemap weather.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setTriggerFilter('all')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  triggerFilter === 'all' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                All ({WEATHER_ABILITY_TRIGGERS.length})
              </button>
              <button
                type="button"
                onClick={() => setTriggerFilter('spell')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  triggerFilter === 'spell' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Spells
              </button>
              <button
                type="button"
                onClick={() => setTriggerFilter('monster')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  triggerFilter === 'monster' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Monsters & Lairs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WEATHER_ABILITY_TRIGGERS.filter(trig => {
              if (triggerFilter === 'spell') return trig.type === 'spell';
              if (triggerFilter === 'monster') return trig.type !== 'spell';
              return true;
            }).map((trig) => {
              const targetDef = WEATHER_DEFINITIONS[trig.weatherEffect] || WEATHER_DEFINITIONS.none;
              const isActive = currentWeather === trig.weatherEffect;

              return (
                <div
                  key={trig.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition ${
                    isActive
                      ? 'bg-sky-950/40 border-sky-500/50 shadow-md ring-1 ring-sky-400/40'
                      : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{trig.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-stone-100 font-mono flex items-center gap-1.5">
                            <span>{trig.name}</span>
                            {trig.type === 'spell' ? (
                              <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-600/40 font-sans">
                                Spell
                              </span>
                            ) : (
                              <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded border border-red-600/40 font-sans">
                                Monster / Lair
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">{trig.source}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${targetDef.badgeBg} ${targetDef.badgeBorder} ${targetDef.badgeText}`}
                      >
                        <span>{targetDef.icon}</span>
                        <span>{targetDef.name}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-300 leading-tight">
                      {trig.description}
                    </p>

                    {trig.suggestedDuration && (
                      <div className="text-[10px] text-stone-400 font-mono">
                        Duration: <span className="text-stone-300 font-bold">{trig.suggestedDuration}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                    {isActive ? (
                      <div className="text-[11px] text-sky-300 font-bold flex items-center gap-1 font-mono">
                        <Check className="w-3.5 h-3.5" />
                        <span>Currently Active on Map</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-500 font-mono">
                        Target: {targetDef.name}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onSelectWeather(trig.weatherEffect);
                        eventBus.emit('WeatherChanged', {
                          weather: trig.weatherEffect,
                          sourceName: trig.name,
                          sourceType: trig.type,
                          reason: `Triggered ${trig.name} (${trig.source}): Changed battlemap atmospheric weather to ${targetDef.name}`
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow ${
                        isActive
                          ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          : 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white'
                      }`}
                    >
                      <span>{trig.icon}</span>
                      <span>{isActive ? 'Re-Apply' : 'Trigger Weather Shift'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-stone-400">
            5e RAW: Sheltered indoor areas (🏠) & entirely indoor maps are automatically masked from weather effects and ceiling-constrained.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs font-mono transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
