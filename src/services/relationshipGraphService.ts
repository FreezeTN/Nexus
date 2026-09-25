import { CampaignEntity } from '../utils/searchIndexer';
import {
  loadCampaignLocations,
  loadCampaignFactions,
  loadCampaignQuests
} from './campaignService';
import { CharacterData } from '../types';

const STORAGE_GRAPH_NODES = 'penpaper_campaign_graph_nodes';

export function buildLiveCampaignGraphNodes(activeCharacters: CharacterData[] = []): CampaignEntity[] {
  const locations = loadCampaignLocations();
  const factions = loadCampaignFactions();
  const quests = loadCampaignQuests();

  const entityMap = new Map<string, CampaignEntity>();

  // 1. Locations
  locations.forEach(loc => {
    const connections: NonNullable<CampaignEntity['connections']> = [];

    if (loc.controllingFactionName) {
      connections.push({
        targetId: `fac-${loc.controllingFactionName.toLowerCase().replace(/\s+/g, '-')}`,
        targetName: loc.controllingFactionName,
        relationship: 'Controlled by',
        targetType: 'faction'
      });
    }

    (loc.linkedNpcNames || []).forEach(npc => {
      connections.push({
        targetId: `npc-${npc.toLowerCase().replace(/\s+/g, '-')}`,
        targetName: npc,
        relationship: 'Inhabited by',
        targetType: 'npc'
      });
    });

    if (loc.dungeonDetails?.bossName) {
      connections.push({
        targetId: `mon-${loc.dungeonDetails.bossName.toLowerCase().replace(/\s+/g, '-')}`,
        targetName: loc.dungeonDetails.bossName,
        relationship: 'Lair of Boss',
        targetType: 'monster'
      });
    }

    entityMap.set(loc.id, {
      id: loc.id,
      name: loc.name,
      type: 'location',
      summary: loc.description || `A ${loc.type} in ${loc.climate || 'the realm'}. Danger: ${loc.dangerLevel}`,
      region: loc.climate,
      status: loc.isDiscovered ? 'Discovered' : 'Uncharted',
      faction: loc.controllingFactionName,
      tags: loc.tags || [loc.type],
      connections
    });
  });

  // 2. Factions
  factions.forEach(fac => {
    const connections: NonNullable<CampaignEntity['connections']> = [];

    if (fac.headquartersLocationName) {
      const matchLoc = locations.find(l => l.name.toLowerCase() === fac.headquartersLocationName?.toLowerCase());
      if (matchLoc) {
        connections.push({
          targetId: matchLoc.id,
          targetName: matchLoc.name,
          relationship: 'Headquarters At',
          targetType: 'location'
        });
      }
    }

    if (fac.leaderName) {
      connections.push({
        targetId: `npc-${fac.leaderName.toLowerCase().replace(/\s+/g, '-')}`,
        targetName: fac.leaderName,
        relationship: 'Led by',
        targetType: 'npc'
      });
    }

    // Inter-faction rivalries
    (fac.rivalFactionNames || []).forEach(rivalName => {
      const other = factions.find(f => f.name.toLowerCase() === rivalName.toLowerCase());
      if (other) {
        connections.push({
          targetId: other.id,
          targetName: other.name,
          relationship: 'Rival of',
          targetType: 'faction'
        });
      }
    });

    entityMap.set(fac.id, {
      id: fac.id,
      name: fac.name,
      type: 'faction',
      summary: fac.description || `${fac.name} - Standing: ${fac.standing || 0}. Headquarters: ${fac.headquartersLocationName || 'Secret'}`,
      status: `Standing ${fac.standing >= 0 ? '+' : ''}${fac.standing || 0}`,
      tags: [fac.category || 'guild', 'faction'],
      connections
    });
  });

  // 3. Quests
  quests.forEach(qst => {
    const connections: NonNullable<CampaignEntity['connections']> = [];

    if (qst.giverLocationId) {
      const loc = locations.find(l => l.id === qst.giverLocationId);
      if (loc) {
        connections.push({
          targetId: loc.id,
          targetName: loc.name,
          relationship: 'Origin Location',
          targetType: 'location'
        });
      }
    }

    if (qst.giverFactionId) {
      const fac = factions.find(f => f.id === qst.giverFactionId);
      if (fac) {
        connections.push({
          targetId: fac.id,
          targetName: fac.name,
          relationship: 'Commissioned by',
          targetType: 'faction'
        });
      }
    }

    if (qst.giverName) {
      connections.push({
        targetId: `npc-${qst.giverName.toLowerCase().replace(/\s+/g, '-')}`,
        targetName: qst.giverName,
        relationship: 'Offered by',
        targetType: 'npc'
      });
    }

    (qst.connectedCharacterNames || []).forEach(charName => {
      connections.push({
        targetId: `pc-${charName.toLowerCase().replace(/\s+/g, '-')}`,
        targetName: charName,
        relationship: 'Undertaken by',
        targetType: 'pc'
      });
    });

    entityMap.set(qst.id, {
      id: qst.id,
      name: qst.title,
      type: 'quest',
      summary: qst.summary || 'Campaign objective.',
      status: qst.status,
      tags: [qst.category, qst.status],
      connections
    });
  });

  // 4. Inferred NPCs
  locations.forEach(loc => {
    (loc.linkedNpcNames || []).forEach(npcName => {
      const npcId = `npc-${npcName.toLowerCase().replace(/\s+/g, '-')}`;
      if (!entityMap.has(npcId)) {
        entityMap.set(npcId, {
          id: npcId,
          name: npcName,
          type: 'npc',
          summary: `Notable resident or contact encountered in ${loc.name}.`,
          region: loc.name,
          faction: loc.controllingFactionName,
          connections: [
            {
              targetId: loc.id,
              targetName: loc.name,
              relationship: 'Resides at',
              targetType: 'location'
            }
          ]
        });
      }
    });
  });

  // 5. Player Characters
  let playerChars = activeCharacters;
  if (!playerChars || playerChars.length === 0) {
    try {
      const allRaw = localStorage.getItem('dnd_all_characters');
      if (allRaw) {
        playerChars = JSON.parse(allRaw);
      }
    } catch (e) {
      // fallback
    }
  }

  (playerChars || []).forEach(pc => {
    const pcId = `pc-${pc.name.toLowerCase().replace(/\s+/g, '-')}`;
    const pcConnections: NonNullable<CampaignEntity['connections']> = [];

    // Connect to quests assigned to this PC
    quests.forEach(q => {
      if ((q.connectedCharacterNames || []).some(cn => cn.toLowerCase() === pc.name.toLowerCase())) {
        pcConnections.push({
          targetId: q.id,
          targetName: q.title,
          relationship: 'Active Quest',
          targetType: 'quest'
        });
      }
    });

    entityMap.set(pcId, {
      id: pcId,
      name: pc.name,
      type: 'pc',
      summary: `Level ${pc.level} ${pc.race} ${pc.characterClass} (${pc.edition || '5e'}). Player Character.`,
      status: `HP ${pc.hpCurrent}/${pc.hpMax}`,
      tags: ['Player Character', pc.characterClass, pc.race],
      connections: pcConnections
    });
  });

  // 6. Merge any custom user-added nodes from localStorage
  try {
    const customRaw = localStorage.getItem(STORAGE_GRAPH_NODES);
    if (customRaw) {
      const customList = JSON.parse(customRaw);
      if (Array.isArray(customList)) {
        customList.forEach((c: CampaignEntity) => {
          if (!entityMap.has(c.id)) {
            entityMap.set(c.id, c);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to merge custom graph nodes', e);
  }

  return Array.from(entityMap.values());
}
