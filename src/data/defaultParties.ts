import { Party } from '../types';

export const DEFAULT_PARTIES: Party[] = [
  {
    id: 'party-heroes-phandalin',
    name: 'Heroes of Phandalin',
    description: 'The brave adventuring party exploring Wave Echo Cave and defending the realm.',
    characterIds: ['char-fighter-freeze', 'char-wizard-chaosdwarf'],
    createdAt: new Date().toISOString()
  }
];
