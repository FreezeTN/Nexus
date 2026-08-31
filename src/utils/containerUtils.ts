import { CharacterData, GearItem, ItemContainer, ContainerType } from '../types';

export const PRESET_CONTAINERS: Omit<ItemContainer, 'id'>[] = [
  {
    name: '🎒 Backpack',
    type: 'backpack',
    capacityLbs: 30,
    isExtradimensional: false,
    fixedWeightLbs: 5,
    notes: 'Standard adventurer backpack. Holds up to 30 lbs.'
  },
  {
    name: '✨ Bag of Holding',
    type: 'bag_of_holding',
    capacityLbs: 500,
    isExtradimensional: true,
    fixedWeightLbs: 15,
    notes: 'Extradimensional space. Holds up to 500 lbs (64 cubic ft), always weighs 15 lbs.'
  },
  {
    name: '🎒 Handy Haversack',
    type: 'handy_haversack',
    capacityLbs: 120,
    isExtradimensional: true,
    fixedWeightLbs: 5,
    notes: 'Extradimensional haversack. Holds 120 lbs across 3 pouches, always weighs 5 lbs.'
  },
  {
    name: '🕳️ Portable Hole',
    type: 'portable_hole',
    capacityLbs: 1000,
    isExtradimensional: true,
    fixedWeightLbs: 0.1,
    notes: 'Circular cloth that creates an extradimensional hole 6ft in diameter and 10ft deep.'
  },
  {
    name: '👝 Belt Pouch',
    type: 'pouch',
    capacityLbs: 6,
    isExtradimensional: false,
    fixedWeightLbs: 1,
    notes: 'Leather belt pouch for coins, components, and small curios.'
  },
  {
    name: '📦 Camp Chest / Stash',
    type: 'chest',
    capacityLbs: 300,
    isExtradimensional: false,
    fixedWeightLbs: 25,
    notes: 'Heavy wooden or iron chest left at camp or mount.'
  },
  {
    name: '🏹 Quiver / Scabbard',
    type: 'quiver',
    capacityLbs: 10,
    isExtradimensional: false,
    fixedWeightLbs: 1,
    notes: 'Holds up to 20 arrows or bolts.'
  }
];

export function getCharacterContainers(char: CharacterData): ItemContainer[] {
  const existing = char.containers || [];
  
  // Also scan inventory for items marked as containers or named like bags of holding
  const inventoryContainers: ItemContainer[] = [];
  for (const item of (char.inventory || [])) {
    if (item.isContainer || isItemRecognizedContainer(item)) {
      const containerType = detectContainerType(item);
      const isExtradimensional = item.isExtradimensional ?? (containerType === 'bag_of_holding' || containerType === 'handy_haversack' || containerType === 'portable_hole');
      const capacity = item.containerCapacityLbs || getDefaultCapacityForType(containerType);
      
      const alreadyInList = existing.some(c => c.id === `item-${item.id}` || c.name.toLowerCase() === item.name.toLowerCase());
      if (!alreadyInList) {
        inventoryContainers.push({
          id: `item-${item.id}`,
          name: item.name,
          type: containerType,
          capacityLbs: capacity,
          isExtradimensional,
          fixedWeightLbs: item.weight || (isExtradimensional ? 15 : 5),
          notes: item.notes
        });
      }
    }
  }

  // Ensure there is at least a default backpack if no containers exist
  if (existing.length === 0 && inventoryContainers.length === 0) {
    return [
      {
        id: 'container-backpack-default',
        name: '🎒 Backpack',
        type: 'backpack',
        capacityLbs: 30,
        isExtradimensional: false,
        fixedWeightLbs: 5,
        notes: 'Standard 30 lb adventurer backpack.'
      }
    ];
  }

  return [...existing, ...inventoryContainers];
}

export function isItemRecognizedContainer(item: GearItem): boolean {
  const name = (item.name || '').toLowerCase();
  return (
    name.includes('bag of holding') ||
    name.includes('handy haversack') ||
    name.includes('portable hole') ||
    name.includes('backpack') ||
    name.includes('pouch') ||
    name.includes('chest') ||
    name.includes('haversack') ||
    name.includes('quiver')
  );
}

export function detectContainerType(item: GearItem): ContainerType {
  const name = (item.name || '').toLowerCase();
  if (name.includes('bag of holding')) return 'bag_of_holding';
  if (name.includes('handy haversack')) return 'handy_haversack';
  if (name.includes('portable hole')) return 'portable_hole';
  if (name.includes('pouch')) return 'pouch';
  if (name.includes('chest')) return 'chest';
  if (name.includes('quiver')) return 'quiver';
  if (name.includes('backpack')) return 'backpack';
  return 'custom';
}

export function getDefaultCapacityForType(type: ContainerType): number {
  switch (type) {
    case 'bag_of_holding': return 500;
    case 'handy_haversack': return 120;
    case 'portable_hole': return 1000;
    case 'backpack': return 30;
    case 'pouch': return 6;
    case 'chest': return 300;
    case 'quiver': return 10;
    default: return 50;
  }
}

export interface ContainerWeightSummary {
  container: ItemContainer;
  items: GearItem[];
  currentWeightLbs: number;
  isOverCapacity: boolean;
  effectiveCarriedContributionLbs: number;
}

export function getContainerWeightSummaries(char: CharacterData): {
  containers: ContainerWeightSummary[];
  unassignedItems: GearItem[];
  equippedItems: GearItem[];
  storedItems: GearItem[];
} {
  const containers = getCharacterContainers(char);
  const containerMap = new Map<string, ItemContainer>();
  containers.forEach(c => containerMap.set(c.id, c));

  const itemsByContainer = new Map<string, GearItem[]>();
  const unassignedItems: GearItem[] = [];
  const equippedItems: GearItem[] = [];
  const storedItems: GearItem[] = [];

  for (const item of (char.inventory || [])) {
    if (item.equipped) {
      equippedItems.push(item);
    } else if (item.stored) {
      storedItems.push(item);
    } else if (item.containerId && containerMap.has(item.containerId)) {
      const list = itemsByContainer.get(item.containerId) || [];
      list.push(item);
      itemsByContainer.set(item.containerId, list);
    } else {
      unassignedItems.push(item);
    }
  }

  const summaries: ContainerWeightSummary[] = containers.map(container => {
    const items = itemsByContainer.get(container.id) || [];
    const currentWeightLbs = items.reduce((sum, it) => sum + (it.weight || 0) * (it.quantity || 1), 0);
    const isOverCapacity = currentWeightLbs > container.capacityLbs;

    // Extradimensional containers (Bag of Holding, Haversack, Portable Hole) do NOT add contents weight to the bearer!
    const effectiveCarriedContributionLbs = container.isExtradimensional
      ? container.fixedWeightLbs
      : currentWeightLbs + container.fixedWeightLbs;

    return {
      container,
      items,
      currentWeightLbs: Number(currentWeightLbs.toFixed(1)),
      isOverCapacity,
      effectiveCarriedContributionLbs: Number(effectiveCarriedContributionLbs.toFixed(1))
    };
  });

  return {
    containers: summaries,
    unassignedItems,
    equippedItems,
    storedItems
  };
}
