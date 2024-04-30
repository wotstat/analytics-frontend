
export const shellNames = {
  'ARMOR_PIERCING': ['ББ', 'Бронебойный'],
  'ARMOR_PIERCING_CR': ['БП', 'Подкалиберный'],
  // 'ARMOR_PIERCING_HE': ['БК', 'Бронебойный каморный'],
  'FLAME': ['ОС', 'Огнемётная смесь'],
  'HIGH_EXPLOSIVE': ['ОФ', 'Осколочно-фугасный'],
  'HOLLOW_CHARGE': ['КС', 'Кумулятивный']
} as const

export const customBattleModes = {
  'normalAny': { title: 'Случайный бой', mode: 'REGULAR' },
  'normalCft': { title: 'Случайный бой (Стандартный)', mode: 'REGULAR', gameplay: 'ctf' },
  'normalDomination': { title: 'Случайный бой (Встречный)', mode: 'REGULAR', gameplay: 'domination' },
  'normalAssault': { title: 'Случайный бой (Штурм)', mode: 'REGULAR', gameplay: 'assault' },
  'epicRandom': { title: 'Генеральное сражение', mode: 'EPIC_RANDOM' },
  'epicBattle': { title: 'Линия фронта', mode: 'EPIC_BATTLE' },
  'historical': { title: 'Исторический ивент', mode: 'HISTORICAL_BATTLES' },
  'battleRoyaleSolo': { title: 'Стальной охотник (соло)', mode: 'BATTLE_ROYALE_SOLO' },
  'battleRoyaleSquad': { title: 'Стальной охотник (взвод)', mode: 'BATTLE_ROYALE_SQUAD' },
  'ranked': { title: 'Ранги', mode: 'RANKED' },
  'comp7': { title: 'Натиск', mode: 'COMP7' },
  'globalMap': { title: 'Глобальная карта', mode: 'GLOBAL_MAP' },
  'sortie': { title: 'Укрепрайон (вылазка)', mode: 'SORTIE_2' },
  'fortBattle': { title: 'Битва за укрепрайон', mode: 'FORT_BATTLE_2' },
  'mapsTraining': { title: 'Топография', mode: 'MAPS_TRAINING' },
  'cosmic': { title: 'Космический режим', mode: 'COSMIC_EVENT' },
  'funRandom': { title: 'Фан рандом', mode: 'FUN_RANDOM' },
  'training': { title: 'Тренировочные комнаты', mode: 'TRAINING' },
} as const

export const gameplayTypes = {
  'ctf': 'Стандартный',
  'domination': 'Встречный',
  'assault': 'Штурм',
  'maps_training': 'Топография',
  'assault2': 'Штурм 2',
  'ctf30x30': 'Стандартный 30x30',
  'epic': 'Генеральное сражение',
} as const

export const modeCount = {
  'normalAny': 15,
  'normalCft': 15,
  'normalDomination': 15,
  'normalAssault': 15,
  'ranked': 10,
  'epicRandom': 30,
  'comp7': 7,
} as const

export const customBattleModesKeys = Object.keys(customBattleModes) as (keyof typeof customBattleModes)[];

type VehicleDescriptor = {
  vehicle: number,
  chassis: number,
  turret: number,
  gun: number,
}

type VehicleHit = {
  turretPitch: number,
  turretYaw: number,
  segment: string
}

export function wotinspectorLog(vehicle: VehicleDescriptor & { shell: number },
  hitVehicle: VehicleDescriptor & VehicleHit,
  hitDistance: number, isWOT: boolean = false) {
  console.debug(`
ATTACKER:
    vehicle: ${vehicle.vehicle}
    chassis: ${vehicle.chassis}
    gun: ${vehicle.gun}
    shell: ${vehicle.shell}
    turret: ${vehicle.turret}

TARGET:
    vehicle: ${hitVehicle.vehicle}
    chassis: ${hitVehicle.chassis}
    gun: ${hitVehicle.gun}
    segment: ${hitVehicle.segment}
    turret: ${hitVehicle.turret}
    turretPitch: ${hitVehicle.turretPitch}
    turretYaw: ${hitVehicle.turretYaw}
    distance: ${hitDistance}

URL: ${wotinspectorURL(vehicle, hitVehicle, hitDistance, isWOT)}
  `);
}
export function wotinspectorURL(vehicle: VehicleDescriptor & { shell: number },
  hitVehicle: VehicleDescriptor & VehicleHit,
  hitDistance: number, isWOT: boolean = false) {
  const dataLen = /*version*/ 1 + /*platform*/ +1 + /*shooter*/ 2 + 2 + 2 + 2 + 2 + /*target*/ 2 + 2 + 2 + 2 + /*gun yaw/pitch*/ 4 + 4 + /*segment*/ 8 + /*distance*/ 4
  const buffer = new Uint8Array(dataLen)
  const view = new DataView(buffer.buffer)
  view.setUint8(0, 1)
  view.setUint8(1, 0)
  view.setUint16(2, vehicle.vehicle, true)
  view.setUint16(4, vehicle.chassis, true)
  view.setUint16(6, vehicle.turret, true)
  view.setUint16(8, vehicle.gun, true)
  view.setUint16(10, vehicle.shell, true)

  view.setUint16(12, hitVehicle.vehicle, true)
  view.setUint16(14, hitVehicle.chassis, true)
  view.setUint16(16, hitVehicle.turret, true)
  view.setUint16(18, hitVehicle.gun, true)

  view.setFloat32(20, hitVehicle.turretPitch, true)
  view.setFloat32(24, hitVehicle.turretYaw, true)

  view.setBigUint64(28, BigInt(hitVehicle.segment), true)
  view.setFloat32(36, hitDistance, true)

  return `https://armor.wotinspector.com/ru/${isWOT ? 'pc' : 'mirtankov'}?data=${encodeURIComponent(btoa(String.fromCharCode.apply(null, Array.from(buffer))))}`;
}
