import {
  WorldCalendarState,
  WorldSeason,
  TimeOfDay,
  WorldTickResult,
  WorldGazetteItem,
  WorldLocation,
  Faction,
  CampaignQuest
} from '../types/campaign';
import {
  loadCampaignLocations,
  loadCampaignFactions,
  saveCampaignFactions,
  loadCampaignQuests,
  saveCampaignQuests,
  addCampaignJournalEntry
} from './campaignService';
import { eventBus } from '../events/eventBus';
import { GoogleGenAI } from '@google/genai';
import { systemRegistry } from '../systems/registry';

const STORAGE_WORLD_CALENDAR = 'nexus_living_world_calendar_v1';
const STORAGE_WORLD_GAZETTE = 'nexus_living_world_gazette_v1';

export const DEFAULT_CALENDAR_STATE: WorldCalendarState = {
  currentDay: 14,
  currentYear: 1492,
  season: 'spring',
  timeOfDay: 'morning',
  weather: 'Brisk Clear Skies',
  weatherDescription: 'Mild spring breezes with clear visibility across trade roads.',
  temperatureFahrenheit: 64,
  activeMoonPhase: 'Waxing Crescent',
  ambientHazardActive: false
};

const SEASONS: WorldSeason[] = ['spring', 'summer', 'autumn', 'winter'];
const TIME_OF_DAYS: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night', 'midnight'];

const SEASONAL_WEATHERS: Record<WorldSeason, Array<{ weather: string; desc: string; tempRange: [number, number]; hazard?: boolean }>> = {
  spring: [
    { weather: 'Gentle Spring Showers', desc: 'Mild rain nurtures roadside flora; roads slightly damp.', tempRange: [52, 65] },
    { weather: 'Crisp Sunny Morning', desc: 'Vibrant sunshine, crisp clear vistas.', tempRange: [58, 70] },
    { weather: 'Rumbling Spring Thunderstorm', desc: 'Sudden downpours churn dirt roads into mud, reducing travel speed.', tempRange: [50, 62], hazard: true },
    { weather: 'Overcast Mist', desc: 'Low-hanging damp fog cloaks valleys and ruins.', tempRange: [48, 60] }
  ],
  summer: [
    { weather: 'Scorching Sun & Heatwave', desc: 'Intense heat parches streams. Extra rations and water needed.', tempRange: [85, 102], hazard: true },
    { weather: 'Warm Golden Sunshine', desc: 'Warm balmy breezes perfect for overland march.', tempRange: [75, 88] },
    { weather: 'Violent Summer Squall', desc: 'Fierce winds and flash flooding along low riverbeds.', tempRange: [70, 82], hazard: true },
    { weather: 'Clear Starlit Night', desc: 'Warm dry night with high celestial visibility.', tempRange: [65, 75] }
  ],
  autumn: [
    { weather: 'Amber Autumn Gale', desc: 'Strong gusts strip leaves and obscure ranged line of sight.', tempRange: [48, 62] },
    { weather: 'Chilling Grey Drizzle', desc: 'Cold relentless rain seeps into cloaks and leather armor.', tempRange: [42, 54] },
    { weather: 'Dense Ground Fog', desc: 'Heavy fog restricts passive perception to 30 feet.', tempRange: [40, 52], hazard: true },
    { weather: 'Crisp Harvest Chill', desc: 'Brisk, fragrant air with high clarity.', tempRange: [45, 58] }
  ],
  winter: [
    { weather: 'Freezing Blizzard & Whiteout', desc: 'Blinding snowstorm. Difficult terrain everywhere; hypothermia danger.', tempRange: [8, 24], hazard: true },
    { weather: 'Icy Sleet & Frozen Mire', desc: 'Treacherous footing and iced equipment.', tempRange: [22, 34], hazard: true },
    { weather: 'Pale Winter Sun', desc: 'Cold still air with frozen ground and sparkling frost.', tempRange: [25, 38] },
    { weather: 'Subzero Arctic Winds', desc: 'Penetrating gales howling from the mountains.', tempRange: [12, 28], hazard: true }
  ]
};

const MOON_PHASES: Array<NonNullable<WorldCalendarState['activeMoonPhase']>> = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent'
];

export function loadWorldCalendarState(): WorldCalendarState {
  try {
    const raw = localStorage.getItem(STORAGE_WORLD_CALENDAR);
    if (raw) {
      return { ...DEFAULT_CALENDAR_STATE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load world calendar state', e);
  }
  return DEFAULT_CALENDAR_STATE;
}

export function saveWorldCalendarState(state: WorldCalendarState): void {
  try {
    localStorage.setItem(STORAGE_WORLD_CALENDAR, JSON.stringify(state));
    eventBus.emit('WorldTimeAdvanced' as any, { calendar: state });
  } catch (e) {
    console.warn('Failed to save world calendar state', e);
  }
}

export function loadCampaignGazette(): WorldGazetteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_WORLD_GAZETTE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load campaign gazette', e);
  }
  return [];
}

export function saveCampaignGazette(items: WorldGazetteItem[]): void {
  try {
    localStorage.setItem(STORAGE_WORLD_GAZETTE, JSON.stringify(items.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save campaign gazette', e);
  }
}

export async function advanceWorldSimulation(days: number): Promise<WorldTickResult> {
  const currentCalendar = loadWorldCalendarState();
  const locations = loadCampaignLocations();
  const factions = loadCampaignFactions();
  const quests = loadCampaignQuests();

  const newDay = currentCalendar.currentDay + days;
  const daysInSeason = 90;
  const seasonIndex = Math.floor((newDay % 360) / daysInSeason);
  const nextSeason = SEASONS[seasonIndex % 4];
  const nextYear = currentCalendar.currentYear + Math.floor(newDay / 360);
  const moonIndex = (newDay + 2) % MOON_PHASES.length;
  const nextMoon = MOON_PHASES[moonIndex];

  // Weather selection
  const weatherPool = SEASONAL_WEATHERS[nextSeason];
  const weatherPick = weatherPool[Math.floor(Math.random() * weatherPool.length)];
  const tempOffset = Math.floor(Math.random() * 6) - 3;
  const calculatedTemp = Math.round((weatherPick.tempRange[0] + weatherPick.tempRange[1]) / 2) + tempOffset;

  const newCalendar: WorldCalendarState = {
    ...currentCalendar,
    currentDay: newDay,
    currentYear: nextYear,
    season: nextSeason,
    weather: weatherPick.weather,
    weatherDescription: weatherPick.desc,
    temperatureFahrenheit: calculatedTemp,
    activeMoonPhase: nextMoon,
    ambientHazardActive: weatherPick.hazard || false
  };

  saveWorldCalendarState(newCalendar);

  // 1. Simulate Faction Reactions & Autonomous Shifts
  const factionShifts: WorldTickResult['factionShifts'] = [];
  const updatedFactions = [...factions];
  const gazetteItems: WorldGazetteItem[] = [];

  if (updatedFactions.length > 0) {
    const activeFaction = updatedFactions[Math.floor(Math.random() * updatedFactions.length)];
    const tensionDelta = Math.random() > 0.4 ? (Math.random() > 0.5 ? 5 : -5) : 0;
    activeFaction.standing = Math.max(-100, Math.min(100, (activeFaction.standing || 0) + tensionDelta));

    const moveTemplates = [
      {
        title: `${activeFaction.name} Deploys Border Patrols`,
        body: `Spies report that ${activeFaction.name} has reinforced armed outposts and tightened checkpoints on major trade routes.`,
        urgency: 'moderate' as const
      },
      {
        title: `Diplomatic Overture from ${activeFaction.name}`,
        body: `Envoys bearing heraldic seals have arrived in local settlements seeking alliances and raw materials.`,
        urgency: 'low' as const
      },
      {
        title: `Shadow Maneuvers by ${activeFaction.name}`,
        body: `Under cover of night, covert operatives were sighted staking out rival strongholds and gathering tactical intelligence.`,
        urgency: 'high' as const
      },
      {
        title: `Economic Pressure from ${activeFaction.name}`,
        body: `Merchants whisper that ${activeFaction.name} is stockpiling healing elixirs and heavy crossbow bolts, driving up local prices.`,
        urgency: 'low' as const
      }
    ];

    const chosenMove = moveTemplates[Math.floor(Math.random() * moveTemplates.length)];
    factionShifts.push({
      factionId: activeFaction.id,
      factionName: activeFaction.name,
      changeText: `${chosenMove.title}. Standing shifted to ${activeFaction.standing >= 0 ? '+' : ''}${activeFaction.standing}.`,
      tensionDelta
    });

    gazetteItems.push({
      id: `gazette-${Date.now()}-fac`,
      headline: chosenMove.title,
      category: 'faction',
      body: chosenMove.body,
      urgency: chosenMove.urgency,
      affectedFactionId: activeFaction.id,
      timestampDay: newDay
    });

    saveCampaignFactions(updatedFactions);
  }

  // 2. Simulate Quest Deadlines & Environmental Consequences
  const questUpdates: WorldTickResult['questUpdates'] = [];
  const activeQuests = quests.filter(q => q.status === 'active');

  if (activeQuests.length > 0) {
    const targetQuest = activeQuests[Math.floor(Math.random() * activeQuests.length)];
    const isWarning = days >= 3;
    const warningText = isWarning
      ? `While the party rested (${days} days elapsed), rumors stir that the situation regarding "${targetQuest.title}" has escalated!`
      : `Scouts note minor enemy repositioning regarding "${targetQuest.title}".`;

    questUpdates.push({
      questId: targetQuest.id,
      questTitle: targetQuest.title,
      changeText: warningText,
      deadlineWarning: isWarning
    });

    gazetteItems.push({
      id: `gazette-${Date.now()}-qst`,
      headline: `Urgency Mounts: ${targetQuest.title}`,
      category: 'quest',
      body: warningText,
      urgency: isWarning ? 'high' : 'moderate',
      timestampDay: newDay
    });
  }

  // 3. Ambient Weather Gazette
  gazetteItems.push({
    id: `gazette-${Date.now()}-wth`,
    headline: `Weather Front: ${weatherPick.weather}`,
    category: 'weather',
    body: `${weatherPick.desc} Season: ${nextSeason.toUpperCase()} (Day ${newDay}, Year ${nextYear}). Temperature holds near ${calculatedTemp}°F under a ${nextMoon}.`,
    urgency: weatherPick.hazard ? 'high' : 'low',
    timestampDay: newDay
  });

  // 4. Generate Town Gossip / NPC Rumors
  const npcRumors: WorldTickResult['npcRumors'] = [];
  const allNpcNames: string[] = [];
  locations.forEach(loc => {
    (loc.linkedNpcNames || []).forEach(name => allNpcNames.push(name));
  });

  const rumorTemplates = [
    'overheard strange chanting echoing from the hollow hills after midnight.',
    'claims that a cloaked merchant was paying triple the going rate for ancient silver coins.',
    'warns travelers that river bridges further north are being watched by heavily armed brigands.',
    'swears they saw the dead walking the sunken cemetery beneath the last moon.'
  ];

  if (allNpcNames.length > 0) {
    const randomNpc = allNpcNames[Math.floor(Math.random() * allNpcNames.length)];
    const rumorText = rumorTemplates[Math.floor(Math.random() * rumorTemplates.length)];
    npcRumors.push({
      npcName: randomNpc,
      rumor: `${randomNpc} ${rumorText}`
    });

    gazetteItems.push({
      id: `gazette-${Date.now()}-rumor`,
      headline: `Tavern Whispers: Tale from ${randomNpc}`,
      category: 'rumor',
      body: `${randomNpc} ${rumorText}`,
      urgency: 'low',
      timestampDay: newDay
    });
  }

  // Save to persistent Gazette history
  const existingGazette = loadCampaignGazette();
  saveCampaignGazette([...gazetteItems, ...existingGazette]);

  // Dispatch to system plugins
  systemRegistry.dispatchTimelineEvent({
    type: 'worldTick',
    timestampDay: newDay,
    title: `Campaign Time Advanced by ${days} Days`,
    description: `Season: ${nextSeason.toUpperCase()}, Weather: ${weatherPick.weather} (${calculatedTemp}°F), Moon: ${nextMoon}. Events simulated: ${gazetteItems.length}`,
    metadata: {
      days,
      newDay,
      season: nextSeason,
      weather: weatherPick.weather
    }
  });

  return {
    daysAdvanced: days,
    newCalendar,
    gazette: gazetteItems,
    factionShifts,
    questUpdates,
    npcRumors
  };
}

// AI-enhanced World Evolution using Gemini if available
export async function generateAiWorldEvolution(days: number): Promise<WorldTickResult> {
  const standardResult = await advanceWorldSimulation(days);
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '');

  if (!apiKey) {
    return standardResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const factions = loadCampaignFactions();
    const quests = loadCampaignQuests();

    const factionSummary = factions.map(f => `${f.name} (Standing: ${f.standing})`).join(', ');
    const questSummary = quests.filter(q => q.status === 'active').map(q => q.title).join(', ');

    const prompt = `You are the Living World simulation engine for a dark fantasy TTRPG campaign.
Between sessions, ${days} days have passed.
Current Calendar: Day ${standardResult.newCalendar.currentDay}, Season: ${standardResult.newCalendar.season}, Weather: ${standardResult.newCalendar.weather} (${standardResult.newCalendar.temperatureFahrenheit}°F).
Factions: ${factionSummary || 'Local guilds and nobility'}
Active Quests: ${questSummary || 'Regional exploration'}

Generate 2-3 vivid, emergent world events formatted strictly as JSON:
{
  "events": [
    {
      "headline": "Punchy newspaper/town crier headline",
      "category": "faction",
      "body": "2 sentences describing an evolving consequence, NPC rumor, or faction maneuver that happened while heroes were resting.",
      "urgency": "moderate"
    }
  ]
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (res.text) {
      const parsed = JSON.parse(res.text);
      if (parsed.events && Array.isArray(parsed.events)) {
        const aiItems: WorldGazetteItem[] = parsed.events.map((evt: any, idx: number) => ({
          id: `ai-gazette-${Date.now()}-${idx}`,
          headline: evt.headline || 'World Event',
          category: evt.category || 'rumor',
          body: evt.body || '',
          urgency: evt.urgency || 'moderate',
          timestampDay: standardResult.newCalendar.currentDay
        }));

        const existing = loadCampaignGazette();
        saveCampaignGazette([...aiItems, ...existing]);
        standardResult.gazette = [...aiItems, ...standardResult.gazette];
      }
    }
  } catch (e) {
    console.warn('Gemini World Evolution generation failed, using standard procedural simulation', e);
  }

  return standardResult;
}

// Log world tick directly to the Campaign Lore Vault / Chronicle
export function logWorldTickToChronicle(tick: WorldTickResult): void {
  const headlines = tick.gazette.map(g => `• [${g.category.toUpperCase()}] **${g.headline}**: ${g.body}`).join('\n');
  addCampaignJournalEntry({
    title: `World Pulse: ${tick.daysAdvanced} Days Elapsed (Day ${tick.newCalendar.currentDay})`,
    category: 'downtime',
    summary: `Campaign time advanced by ${tick.daysAdvanced} days into ${tick.newCalendar.season.toUpperCase()} under ${tick.newCalendar.weather}. World events, faction maneuvers, and rumors developed across the realm.`,
    notes: `### Gazette Dispatches\n${headlines}\n\n**Weather:** ${tick.newCalendar.weather} (${tick.newCalendar.temperatureFahrenheit}°F, ${tick.newCalendar.activeMoonPhase})`
  });
}
