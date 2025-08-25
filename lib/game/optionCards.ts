export enum OptionCardType {
  ABLATIVE_COAT = 'ABLATIVE_COAT',
  ABORT_SWITCH = 'ABORT_SWITCH',
  BRAKES = 'BRAKES',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  CONDITIONAL_PROGRAM = 'CONDITIONAL_PROGRAM',
  CRAB_LEGS = 'CRAB_LEGS',
  DOUBLE_BARRELED_LASER = 'DOUBLE_BARRELED_LASER',
  DUAL_PROCESSOR = 'DUAL_PROCESSOR',
  EXTRA_MEMORY = 'EXTRA_MEMORY',
  FIRE_CONTROL = 'FIRE_CONTROL',
  FLYWHEEL = 'FLYWHEEL',
  FOURTH_GEAR = 'FOURTH_GEAR',
  GYROSCOPIC_STABILIZER = 'GYROSCOPIC_STABILIZER',
  HIGH_POWER_LASER = 'HIGH_POWER_LASER',
  MECHANICAL_ARM = 'MECHANICAL_ARM',
  MINI_HOWITZER = 'MINI_HOWITZER',
  POWER_DOWN_SHIELD = 'POWER_DOWN_SHIELD',
  PRESSOR_BEAM = 'PRESSOR_BEAM',
  RADIO_CONTROL = 'RADIO_CONTROL',
  RAMMING_GEAR = 'RAMMING_GEAR',
  REAR_FIRING_LASER = 'REAR_FIRING_LASER',
  RECOMPILE = 'RECOMPILE',
  REVERSE_GEAR = 'REVERSE_GEAR',
  SCRAMBLER = 'SCRAMBLER',
  SHIELD = 'SHIELD',
  SUPERIOR_ARCHIVE = 'SUPERIOR_ARCHIVE',
  TRACTOR_BEAM = 'TRACTOR_BEAM'
}

export interface OptionCard {
  id: string;
  type: OptionCardType;
  name: string;
  description: string;
  damageValue?: number;
}

export const OPTION_CARDS: Record<OptionCardType, Omit<OptionCard, 'id'>> = {
  [OptionCardType.ABLATIVE_COAT]: {
    type: OptionCardType.ABLATIVE_COAT,
    name: 'Ablative Coat',
    description: 'Ablative Coat absorbs the next 3 Damage your robot receives. Put those 3 Damage tokens onto this card instead of onto your Program Sheet. Discard this card and the tokens when you put the third one on.',
    damageValue: 3
  },
  [OptionCardType.ABORT_SWITCH]: {
    type: OptionCardType.ABORT_SWITCH,
    name: 'Abort Switch',
    description: 'Once each turn, you may replace one of the Program cards you reveal with the top card from the deck. If you do, you must play that card this turn, even if it means replacing another Program card.',
  },
  [OptionCardType.BRAKES]: {
    type: OptionCardType.BRAKES,
    name: 'Brakes',
    description: 'Whenever you execute a Move 1, you may move your robot 0 spaces instead of 1. Priority is that of the Move 1.',
  },
  [OptionCardType.CIRCUIT_BREAKER]: {
    type: OptionCardType.CIRCUIT_BREAKER,
    name: 'Circuit Breaker',
    description: 'If you have 3 or more Damage tokens on your Program Sheet at the end of your turn, your robot will begin the next turn powered down.',
  },
  [OptionCardType.CONDITIONAL_PROGRAM]: {
    type: OptionCardType.CONDITIONAL_PROGRAM,
    name: 'Conditional Program',
    description: 'After you program your registers each turn, you may put one of the Program cards left in your hand face down onto this Option instead of discarding it. Later that turn, you can substitute that card for one you had programmed.',
  },
  [OptionCardType.CRAB_LEGS]: {
    type: OptionCardType.CRAB_LEGS,
    name: 'Crab Legs',
    description: 'When executing a Move 1, you may move 1 space left or right, instead of forward. Priority is that of the Move 1.',
  },
  [OptionCardType.DOUBLE_BARRELED_LASER]: {
    type: OptionCardType.DOUBLE_BARRELED_LASER,
    name: 'Double-Barreled Laser',
    description: 'Whenever your robot fires its main laser, it fires two shots instead of one. You may use this Option with Fire Control and/or High-Power Laser.',
  },
  [OptionCardType.DUAL_PROCESSOR]: {
    type: OptionCardType.DUAL_PROCESSOR,
    name: 'Dual Processor',
    description: 'When you execute your Backup, you may execute the Program card in your previous register as well. If that register was locked, you can\'t.',
  },
  [OptionCardType.EXTRA_MEMORY]: {
    type: OptionCardType.EXTRA_MEMORY,
    name: 'Extra Memory',
    description: 'You receive one extra Program card each turn. (You still discard all unused Program cards in front of you at the end of each turn.)',
  },
  [OptionCardType.FIRE_CONTROL]: {
    type: OptionCardType.FIRE_CONTROL,
    name: 'Fire Control',
    description: 'Whenever your robot fires any weapon, you may choose one of the target robot\'s registers and lock it for the rest of the turn.',
  },
  [OptionCardType.FLYWHEEL]: {
    type: OptionCardType.FLYWHEEL,
    name: 'Flywheel',
    description: 'After all players are done programming their registers each turn, you may put one of your remaining Program cards face down onto this card. You can add that Program card to those dealt to you on any subsequent turn.',
  },
  [OptionCardType.FOURTH_GEAR]: {
    type: OptionCardType.FOURTH_GEAR,
    name: 'Fourth Gear',
    description: 'Whenever you execute a Move 3, you may move your robot 4 spaces instead of 3. Priority is that of the Move 3.',
  },
  [OptionCardType.GYROSCOPIC_STABILIZER]: {
    type: OptionCardType.GYROSCOPIC_STABILIZER,
    name: 'Gyroscopic Stabilizer',
    description: 'Before players reveal the cards in their first registers each turn, state whether this Option is active. When it is, your robot isn\'t rotated by gears or rotating conveyor belts for that entire turn.',
  },
  [OptionCardType.HIGH_POWER_LASER]: {
    type: OptionCardType.HIGH_POWER_LASER,
    name: 'High-Power Laser',
    description: 'Your robot\'s main laser can shoot through one wall or robot to get to a target robot. If you shoot through a robot, that robot also receives full damage. You may use this Option with Fire Control and/or Double-Barreled Laser.',
  },
  [OptionCardType.MECHANICAL_ARM]: {
    type: OptionCardType.MECHANICAL_ARM,
    name: 'Mechanical Arm',
    description: 'Your robot can touch a flag or repair site from 1 space away (diagonally or orthogonally), as long as there isn\'t a wall between it and the flag or repair site.',
  },
  [OptionCardType.MINI_HOWITZER]: {
    type: OptionCardType.MINI_HOWITZER,
    name: 'Mini Howitzer',
    description: 'Whenever you could fire your main laser at a robot, you may fire the Mini Howitzer instead. This pushes the target robot 1 space away from your robot (in addition to doing damage). Robots can\'t be pushed through walls.',
  },
  [OptionCardType.POWER_DOWN_SHIELD]: {
    type: OptionCardType.POWER_DOWN_SHIELD,
    name: 'Power-Down Shield',
    description: 'As long as your robot is powered down, each register phase you can prevent up to 1 Damage to it from each of the four directions.',
  },
  [OptionCardType.PRESSOR_BEAM]: {
    type: OptionCardType.PRESSOR_BEAM,
    name: 'Pressor Beam',
    description: 'Whenever you could fire your main laser at a robot, you may instead fire the Pressor Beam. This moves the target robot 1 space away from your robot.',
  },
  [OptionCardType.RADIO_CONTROL]: {
    type: OptionCardType.RADIO_CONTROL,
    name: 'Radio Control',
    description: 'Whenever you could fire your main laser at a robot, you may instead fire the Radio Control beam. This causes the target robot to execute the same Program card your robot executes this register phase.',
  },
  [OptionCardType.RAMMING_GEAR]: {
    type: OptionCardType.RAMMING_GEAR,
    name: 'Ramming Gear',
    description: 'Whenever your robot pushes or is pushed by another robot, that robot receives 1 Damage.',
  },
  [OptionCardType.REAR_FIRING_LASER]: {
    type: OptionCardType.REAR_FIRING_LASER,
    name: 'Rear-Firing Laser',
    description: 'Your robot has a rear-firing laser in addition to its main laser. This laser follows all the same rules as the main laser.',
  },
  [OptionCardType.RECOMPILE]: {
    type: OptionCardType.RECOMPILE,
    name: 'Recompile',
    description: 'Once each turn, you may discard the hand of Program cards dealt to you and draw a new hand from the deck. Your robot then receives 1 Damage token.',
  },
  [OptionCardType.REVERSE_GEAR]: {
    type: OptionCardType.REVERSE_GEAR,
    name: 'Reverse Gear',
    description: 'Whenever you execute a Back Up, you may move your robot back 2 spaces instead of 1. Priority is that of the Back Up.',
  },
  [OptionCardType.SCRAMBLER]: {
    type: OptionCardType.SCRAMBLER,
    name: 'Scrambler',
    description: 'Whenever you could fire your main laser at a robot, you may instead fire the Scrambler. This replaces the target robot\'s next programmed card with the top Program card from the deck.',
  },
  [OptionCardType.SHIELD]: {
    type: OptionCardType.SHIELD,
    name: 'Shield',
    description: 'Each register phase, your robot takes no Damage from the first robot to shoot at it from the front this phase.',
  },
  [OptionCardType.SUPERIOR_ARCHIVE]: {
    type: OptionCardType.SUPERIOR_ARCHIVE,
    name: 'Superior Archive',
    description: 'When reentering play after being destroyed, your robot doesn\'t receive the normal 2 Damage tokens.',
  },
  [OptionCardType.TRACTOR_BEAM]: {
    type: OptionCardType.TRACTOR_BEAM,
    name: 'Tractor Beam',
    description: 'Whenever you could fire your main laser at a robot that isn\'t in an adjacent space, you may instead fire the Tractor Beam. This pulls the target robot 1 space toward your robot.',
  }
};

export function createOptionCard(type: OptionCardType): OptionCard {
  const template = OPTION_CARDS[type];
  return {
    ...template,
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

export function createOptionDeck(): OptionCard[] {
  const deck: OptionCard[] = [];
  
  Object.values(OptionCardType).forEach(type => {
    deck.push(createOptionCard(type));
  });
  
  return shuffleDeck(deck);
}

function shuffleDeck(deck: OptionCard[]): OptionCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}