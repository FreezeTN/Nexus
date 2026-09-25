import { CharacterData, Party, RuleEdition } from '../types';
import { WorldLocation, CampaignQuest, CampaignJournalEntry } from '../types/campaign';
import { eventBus } from '../events/eventBus';
import { addCampaignJournalEntry, loadCampaignJournal } from './campaignService';
import { askAssistant } from './geminiService';
import { systemRegistry } from '../systems/registry';

export interface SessionReplayEvent {
  id: string;
  timestamp: string;
  type: 'session_start' | 'session_end' | 'combat' | 'dice_nat20' | 'dice_nat1' | 'damage_heal' | 'quest' | 'travel' | 'lore' | 'custom';
  title: string;
  details: string;
  actor?: string;
  locationName?: string;
  roundNumber?: number;
  highlight?: boolean;
}

export interface SessionAiSuggestions {
  openingNarration: string;
  immediateComplications: Array<{
    title: string;
    description: string;
    type: 'combat' | 'hazard' | 'social';
    suggestedEnemies?: string[];
  }>;
  dmSecretIntel: {
    perceptionClue: string;
    environmentalFactor: string;
    pacingAdvice: string;
  };
  generatedAt: string;
}

export interface PreviouslyOnRecap {
  episodeTitle: string;
  monologue: string;
  keyEvents: string[];
  unresolvedCliffhangers: string[];
  spotlightHero?: string;
  generatedAt: string;
}

export interface ActiveSessionOrchestration {
  sessionId: string;
  sessionNumber: number;
  sessionTitle: string;
  startedAt: string;
  status: 'planning' | 'live' | 'completed';
  startingLocationName?: string;
  startingLocationId?: string;
  activeQuestId?: string;
  activeQuestTitle?: string;
  inGameTime: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'midnight';
  weatherCondition: string;
  openingNarration?: string;
  ambienceTrack?: string;
  aiSuggestions?: SessionAiSuggestions;
  recap?: PreviouslyOnRecap;
  eventsCount?: number;
}

const STORAGE_ACTIVE_SESSION = 'nexus_session_orchestration_active_v1';
const STORAGE_REPLAY_EVENTS = 'nexus_session_replay_events_v1';

export function loadActiveSessionOrchestration(): ActiveSessionOrchestration | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_SESSION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load active session orchestration from localStorage', e);
  }
  return null;
}

export function saveActiveSessionOrchestration(state: ActiveSessionOrchestration | null): void {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_ACTIVE_SESSION);
    } else {
      localStorage.setItem(STORAGE_ACTIVE_SESSION, JSON.stringify(state));
    }
  } catch (e) {
    console.warn('Failed to save active session orchestration to localStorage', e);
  }
}

export function loadSessionReplayEvents(): SessionReplayEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_REPLAY_EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load session replay events from localStorage', e);
  }
  return [];
}

export function saveSessionReplayEvents(events: SessionReplayEvent[]): void {
  try {
    localStorage.setItem(STORAGE_REPLAY_EVENTS, JSON.stringify(events.slice(0, 300)));
  } catch (e) {
    console.warn('Failed to save session replay events to localStorage', e);
  }
}

export function recordSessionReplayEvent(
  event: Omit<SessionReplayEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): SessionReplayEvent {
  const existing = loadSessionReplayEvents();
  const newEvt: SessionReplayEvent = {
    id: event.id || `evt-rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: event.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: event.type,
    title: event.title,
    details: event.details,
    actor: event.actor,
    locationName: event.locationName,
    roundNumber: event.roundNumber,
    highlight: event.highlight
  };

  const updated = [newEvt, ...existing];
  saveSessionReplayEvents(updated);

  // Dispatch to registered system plugins
  systemRegistry.dispatchReplayEvent({
    eventId: newEvt.id,
    eventType: newEvt.type,
    title: newEvt.title,
    details: newEvt.details,
    timestamp: newEvt.timestamp,
    metadata: {
      actor: newEvt.actor,
      locationName: newEvt.locationName,
      roundNumber: newEvt.roundNumber,
      highlight: newEvt.highlight
    }
  });

  return newEvt;
}

export function clearSessionReplayEvents(): void {
  saveSessionReplayEvents([]);
}

/**
 * Initializes and starts a new live tabletop session.
 */
export function startSessionOrchestrator(params: {
  sessionNumber: number;
  sessionTitle: string;
  startingLocation?: WorldLocation | null;
  activeQuest?: CampaignQuest | null;
  inGameTime?: ActiveSessionOrchestration['inGameTime'];
  weatherCondition?: string;
  ambienceTrack?: string;
  activeCharacters?: CharacterData[];
}): ActiveSessionOrchestration {
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const startedAt = new Date().toISOString();

  const newSession: ActiveSessionOrchestration = {
    sessionId,
    sessionNumber: params.sessionNumber,
    sessionTitle: params.sessionTitle,
    startedAt,
    status: 'live',
    startingLocationName: params.startingLocation?.name || 'Local Outpost',
    startingLocationId: params.startingLocation?.id,
    activeQuestId: params.activeQuest?.id,
    activeQuestTitle: params.activeQuest?.title,
    inGameTime: params.inGameTime || 'morning',
    weatherCondition: params.weatherCondition || 'Clear Skies',
    ambienceTrack: params.ambienceTrack,
    eventsCount: 1
  };

  saveActiveSessionOrchestration(newSession);

  // Dispatch session start to system plugins
  systemRegistry.dispatchSessionLifecycle({
    action: 'start',
    sessionId: newSession.sessionId,
    sessionNumber: newSession.sessionNumber,
    sessionTitle: newSession.sessionTitle,
    startingLocation: newSession.startingLocationName,
    timestamp: startedAt
  });

  // Record initial Session Start event in Replay log
  recordSessionReplayEvent({
    type: 'session_start',
    title: `Session ${newSession.sessionNumber}: ${newSession.sessionTitle}`,
    details: `Session opened at ${newSession.startingLocationName}. Objective: ${newSession.activeQuestTitle || 'Open Exploration'}. Time of Day: ${newSession.inGameTime}. Weather: ${newSession.weatherCondition}.`,
    locationName: newSession.startingLocationName,
    highlight: true
  });

  // Automatically record Chronicle in Campaign Lore Vault
  addCampaignJournalEntry({
    title: `Session ${newSession.sessionNumber} Launch: ${newSession.sessionTitle}`,
    category: 'exploration',
    locationName: newSession.startingLocationName,
    locationId: newSession.startingLocationId,
    summary: `The adventurers embarked on Session ${newSession.sessionNumber}. Starting rendezvous established at ${newSession.startingLocationName} under ${newSession.weatherCondition.toLowerCase()} skies (${newSession.inGameTime}). Primary pursuit: "${newSession.activeQuestTitle || 'General regional adventuring'}".`,
    participants: (params.activeCharacters || []).map(c => c.name)
  });

  // Emit eventBus notification
  eventBus.emit('SessionStarted', {
    sessionId: newSession.sessionId,
    sessionTitle: newSession.sessionTitle
  });

  return newSession;
}

/**
 * Concludes an active session.
 */
export function endSessionOrchestrator(current: ActiveSessionOrchestration, summaryNotes?: string): void {
  const completed: ActiveSessionOrchestration = {
    ...current,
    status: 'completed'
  };
  saveActiveSessionOrchestration(null);

  // Dispatch session end to system plugins
  systemRegistry.dispatchSessionLifecycle({
    action: 'end',
    sessionId: current.sessionId,
    sessionNumber: current.sessionNumber,
    sessionTitle: current.sessionTitle,
    startingLocation: current.startingLocationName,
    timestamp: new Date().toISOString(),
    notes: summaryNotes
  });

  recordSessionReplayEvent({
    type: 'session_end',
    title: `Session ${current.sessionNumber} Concluded`,
    details: summaryNotes || `Session ended successfully. All progress, chronicles, and combat logs safely stored.`,
    locationName: current.startingLocationName,
    highlight: true
  });

  addCampaignJournalEntry({
    title: `Session ${current.sessionNumber} Conclusion`,
    category: 'lore',
    locationName: current.startingLocationName,
    summary: summaryNotes || `Session ${current.sessionNumber} (${current.sessionTitle}) was completed. Heroes rested and recorded their tales.`,
  });
}

/**
 * AI Generation: Context-Aware Session Prep & Dynamic Suggestions (Phase 3)
 */
export async function generateContextAwareSessionPrep(context: {
  sessionTitle: string;
  startingLocation?: WorldLocation | null;
  activeQuest?: CampaignQuest | null;
  partyMembers: CharacterData[];
  ruleEdition: RuleEdition;
  recentJournal?: CampaignJournalEntry[];
}): Promise<SessionAiSuggestions> {
  const partyRosterDesc = context.partyMembers.map(c => `${c.name} (Lvl ${c.level} ${c.race} ${c.characterClass})`).join(', ');
  const locDesc = context.startingLocation
    ? `Location: "${context.startingLocation.name}" (Type: ${context.startingLocation.type}, Climate: ${context.startingLocation.climate || 'temperate'}, Danger: ${context.startingLocation.dangerLevel || 'moderate'}). Lore: ${context.startingLocation.description || ''}. Boss: ${context.startingLocation.dungeonDetails?.bossName || 'None'}`
    : 'Location: Forgotten Tavern near old ruins';

  const questDesc = context.activeQuest
    ? `Current Main Objective: "${context.activeQuest.title}". Description: ${context.activeQuest.summary}`
    : 'Open overland sandbox exploration';

  const recentHistory = (context.recentJournal || [])
    .slice(0, 3)
    .map(j => `[${j.category}] ${j.title}: ${j.summary}`)
    .join('\n');

  const prompt = `You are an elite tabletop RPG Game Master Director for ${context.ruleEdition}.
Analyze this campaign state and prepare an immersive "Session Start" Game Master Dossier.

PARTY: ${partyRosterDesc || 'A band of seasoned adventurers'}
${locDesc}
${questDesc}
RECENT CAMPAIGN CHRONICLES:
${recentHistory || 'The party recently completed a rest and restocked provisions.'}

Format your response strictly as valid JSON matching this schema with NO extra commentary or markdown codeblocks:
{
  "openingNarration": "2-3 paragraphs of visceral, sensory read-aloud description (sights, acoustics, weather, scent, immediate tension) setting the stage right where the players start.",
  "immediateComplications": [
    {
      "title": "Short title",
      "description": "Specific tactical ambush, sudden complication, or dilemma",
      "type": "combat",
      "suggestedEnemies": ["Monster 1", "Monster 2"]
    },
    {
      "title": "Short title",
      "description": "Hazardous environmental puzzle or trap",
      "type": "hazard",
      "suggestedEnemies": []
    },
    {
      "title": "Short title",
      "description": "Intriguing NPC arrival, moral dilemma, or rumor",
      "type": "social",
      "suggestedEnemies": []
    }
  ],
  "dmSecretIntel": {
    "perceptionClue": "DC 14 Perception/Investigation secret that high-passive perception heroes notice immediately",
    "environmentalFactor": "How weather, lighting, or terrain gives a tactical edge or challenge",
    "pacingAdvice": "1-sentence tip on how to pace the opening 45 minutes of the game"
  }
}`;

  try {
    const raw = await askAssistant(prompt, [], `You are a professional tabletop RPG Game Master AI generating clean JSON schemas.`);
    const cleanJson = raw.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      openingNarration: parsed.openingNarration || 'A tense silence hangs in the air as your party gathers equipment and takes their first steps into the unknown.',
      immediateComplications: Array.isArray(parsed.immediateComplications) ? parsed.immediateComplications : [
        {
          title: 'Skulking Ambushers',
          description: 'A forward scout detachment of regional monsters tracks the party from the shadows.',
          type: 'combat',
          suggestedEnemies: ['Goblin Archer', 'Bugbear Thug']
        }
      ],
      dmSecretIntel: parsed.dmSecretIntel || {
        perceptionClue: 'Scratched warning sigils on the cobblestones point towards an ancient burial chamber.',
        environmentalFactor: 'Dim lighting imposes disadvantage on sight-based Perception checks beyond torchlight.',
        pacingAdvice: 'Kick off with immediate action before letting the party engage in lengthy inventory discussions.'
      },
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (e) {
    console.warn('AI context prep fallback invoked:', e);
    return {
      openingNarration: `The air is thick with anticipation as the party readies their gear at ${context.startingLocation?.name || 'the crossroads'}. Whispers of danger echo across the surrounding stones, and every shadow seems to conceal watchful eyes.`,
      immediateComplications: [
        {
          title: 'Ambush at the Threshold',
          description: 'A skirmish pack bursts from concealment to test the party’s readiness.',
          type: 'combat',
          suggestedEnemies: ['Goblin Skirmisher', 'Wolf Companion']
        },
        {
          title: 'Unstable Foundation',
          description: 'A section of crumbled masonry threatens to collapse under heavy armor.',
          type: 'hazard'
        },
        {
          title: 'Wounded Messenger',
          description: 'A breathless traveler stumbles into camp bearing dire warnings of a warlord’s advance.',
          type: 'social'
        }
      ],
      dmSecretIntel: {
        perceptionClue: 'A faint scent of ozone lingers near the northern passageway.',
        environmentalFactor: 'Chilling draft causes torch flame to flicker violently.',
        pacingAdvice: 'Prompt player initiative quickly to build early session momentum.'
      },
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

/**
 * AI Generation: "Previously On..." Cinematic Story Generator (Phase 4)
 */
export async function generatePreviouslyOnStory(context: {
  sessionTitle?: string;
  partyMembers: CharacterData[];
  ruleEdition: RuleEdition;
  journalEntries: CampaignJournalEntry[];
}): Promise<PreviouslyOnRecap> {
  const partyNames = context.partyMembers.map(c => `${c.name} (${c.characterClass})`).join(', ');
  const logs = context.journalEntries.slice(0, 6).map(j => {
    const enemies = j.enemiesVanquished?.map(e => `${e.count}x ${e.name}`).join(', ');
    const loot = j.lootHarvested?.map(l => l.name).join(', ');
    return `- [${j.category.toUpperCase()}] "${j.title}" at ${j.locationName || 'Unknown'}: ${j.summary} ${enemies ? `(Defeated: ${enemies})` : ''} ${loot ? `(Loot: ${loot})` : ''}`;
  }).join('\n');

  const prompt = `You are a dramatic, cinematic television narrator writing a "PREVIOUSLY ON..." audio recap for a high-stakes ${context.ruleEdition} tabletop campaign.

HEROES: ${partyNames || 'The Party'}
RECENT CAMPAIGN CHRONICLE LOGS:
${logs || 'The party descended into treacherous ruins and barely survived ancient traps.'}

Write an electrifying, serialized narrative recap. Capture the heroics, near-death rolls, vanquished monsters, and looming threats in a style reminiscent of "Previously on Battlestar Galactica / Game of Thrones".

Format your response strictly as valid JSON matching this schema with NO extra commentary or markdown codeblocks:
{
  "episodeTitle": "Catchy Episode Recap Title (e.g. 'Episode 4: Blood Upon the Altar')",
  "monologue": "Dramatic 2-3 paragraph spoken monologue that begins with 'Previously, on our adventure...' recounting the trials, key battles, and high stakes.",
  "keyEvents": [
    "Short bullet 1 summarizing a major clash or milestone",
    "Short bullet 2 summarizing a discovery or treasure",
    "Short bullet 3 summarizing an escape or defeat"
  ],
  "unresolvedCliffhangers": [
    "Immediate unresolved peril or mystery awaiting the party right now",
    "Secondary looming threat or ticking clock"
  ],
  "spotlightHero": "Name of one character and a sentence praising their decisive action or narrow escape"
}`;

  try {
    const raw = await askAssistant(prompt, [], `You are a cinematic fantasy narrator outputting clean JSON schemas.`);
    const cleanJson = raw.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      episodeTitle: parsed.episodeTitle || 'Previously On Our Adventure...',
      monologue: parsed.monologue || 'Previously, on our adventure: the party delved into shadowed depths, clashing with relentless foes and uncovering forgotten secrets.',
      keyEvents: Array.isArray(parsed.keyEvents) ? parsed.keyEvents : ['Clashed against subterranean horrors.', 'Recovered ancient relics.'],
      unresolvedCliffhangers: Array.isArray(parsed.unresolvedCliffhangers) ? parsed.unresolvedCliffhangers : ['An ominous tremor rattles the foundation as deeper horrors awaken.'],
      spotlightHero: parsed.spotlightHero || (context.partyMembers[0]?.name ? `${context.partyMembers[0].name} held the vanguard with unyielding resolve.` : undefined),
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (e) {
    console.warn('AI previously on recap fallback invoked:', e);
    return {
      episodeTitle: 'Previously On The Campaign...',
      monologue: 'Previously, on our adventure: our heroes faced the unknown with blade and spell. Foes were tested, secrets unearthed, and danger mounted with every passing hour. Now, as the dust settles, the next chapter beckons.',
      keyEvents: [
        'Vanquished enemy vanguards in tactical combat.',
        'Claimed hard-fought spoils and ancient coins.',
        'Established a temporary sanctuary to regroup.'
      ],
      unresolvedCliffhangers: [
        'The primary lair master remains at large in the lower chambers.',
        'Supplies and torches dwindle as night draws near.'
      ],
      spotlightHero: context.partyMembers[0]?.name ? `${context.partyMembers[0].name} led the charge into the fray.` : undefined,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

/**
 * Exports entire session timeline & previously-on story to a clean Markdown format.
 */
export function exportSessionReplayMarkdown(session: ActiveSessionOrchestration | null, events: SessionReplayEvent[], recap?: PreviouslyOnRecap | null): string {
  const title = session ? `Session ${session.sessionNumber}: ${session.sessionTitle}` : 'Tabletop Campaign Session Chronicle';
  const started = session?.startedAt ? new Date(session.startedAt).toLocaleString() : new Date().toLocaleString();

  let md = `# ⚔️ ${title}\n\n`;
  md += `**Date:** ${started}  \n`;
  if (session?.startingLocationName) md += `**Starting Location:** ${session.startingLocationName}  \n`;
  if (session?.activeQuestTitle) md += `**Active Quest:** ${session.activeQuestTitle}  \n`;
  if (session?.inGameTime) md += `**In-Game Time:** ${session.inGameTime} | **Weather:** ${session.weatherCondition || 'Fair'}  \n\n`;

  if (recap) {
    md += `## 🎬 Previously On... (${recap.episodeTitle})\n\n`;
    md += `> ${recap.monologue.replace(/\n\n/g, '\n>\n> ')}\n\n`;
    if (recap.keyEvents.length > 0) {
      md += `### Highlights of Past Exploits\n`;
      recap.keyEvents.forEach(k => { md += `- ${k}\n`; });
      md += `\n`;
    }
    if (recap.unresolvedCliffhangers.length > 0) {
      md += `### Active Threats & Cliffhangers\n`;
      recap.unresolvedCliffhangers.forEach(c => { md += `⚠️ ${c}\n`; });
      md += `\n`;
    }
  }

  if (events.length > 0) {
    md += `## 📜 Session Timeline Replay\n\n`;
    events.forEach(evt => {
      const icon = evt.type === 'dice_nat20' ? '🌟' : evt.type === 'dice_nat1' ? '💀' : evt.type === 'combat' ? '⚔️' : evt.type === 'quest' ? '🏆' : '•';
      md += `### ${icon} ${evt.timestamp} - ${evt.title}\n`;
      if (evt.actor) md += `**Actor:** ${evt.actor}  \n`;
      if (evt.locationName) md += `**Location:** ${evt.locationName}  \n`;
      if (evt.roundNumber) md += `**Combat Round:** ${evt.roundNumber}  \n`;
      md += `${evt.details}\n\n`;
    });
  }

  return md;
}

// Auto-subscribe to eventBus to mirror live tabletop rolls and combat events into Session Replay
if (typeof window !== 'undefined') {
  eventBus.on('DiceRolled', (payload) => {
    if (payload.isNat20) {
      recordSessionReplayEvent({
        type: 'dice_nat20',
        title: `Natural 20! (${payload.formula})`,
        details: `${payload.rollerName || 'Hero'} rolled a Natural 20! Total: ${payload.total}. ${payload.label || ''}`,
        actor: payload.rollerName,
        highlight: true
      });
    } else if (payload.isNat1) {
      recordSessionReplayEvent({
        type: 'dice_nat1',
        title: `Natural 1 Critical Fumble! (${payload.formula})`,
        details: `${payload.rollerName || 'Hero'} rolled a critical fumble (Nat 1)! Total: ${payload.total}. ${payload.label || ''}`,
        actor: payload.rollerName,
        highlight: true
      });
    }
  });

  eventBus.on('ApplyDamageOrHeal', (payload) => {
    const isHeal = payload.amount > 0;
    recordSessionReplayEvent({
      type: 'damage_heal',
      title: isHeal ? `Healing (+${payload.amount} HP)` : `Damage (${payload.amount} HP)`,
      details: `${payload.targetName || 'Target'} received ${Math.abs(payload.amount)} ${payload.damageType || ''} ${isHeal ? 'healing' : 'damage'}. ${payload.sourceLabel ? `(${payload.sourceLabel})` : ''}`,
      actor: payload.sourceLabel,
      highlight: Math.abs(payload.amount) >= 25
    });
  });

  eventBus.on('QuestCompleted', (payload) => {
    recordSessionReplayEvent({
      type: 'quest',
      title: `Quest Completed: ${payload.questTitle}`,
      details: `The adventurers completed quest objectives! ${payload.xpReward ? `Awarded +${payload.xpReward} XP.` : ''}`,
      highlight: true
    });
  });
}

