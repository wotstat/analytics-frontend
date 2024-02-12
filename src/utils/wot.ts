
export const shellNames = {
  'ARMOR_PIERCING': ['ББ', 'Бронебойный'],
  'ARMOR_PIERCING_CR': ['БП', 'Подкалиберный'],
  // 'ARMOR_PIERCING_HE': ['БК', 'Бронебойный каморный'],
  'FLAME': ['ОС', 'Огнемётная смесь'],
  'HIGH_EXPLOSIVE': ['ОФ', 'Осколочно-фугасный'],
  'HOLLOW_CHARGE': ['КС', 'Кумулятивный']
} as const

export const customBattleModes = {
  'normalAny': { title: 'Обычный режим', mode: 'REGULAR' },
  'normalCft': { title: 'Обычный (Стандартный)', mode: 'REGULAR', gameplay: 'ctf' },
  'normalDomination': { title: 'Обычный (Встречный)', mode: 'REGULAR', gameplay: 'domination' },
  'normalAssault': { title: 'Обычный (Штурм)', mode: 'REGULAR', gameplay: 'assault' },
  'ranked': { title: 'Ранги', mode: 'RANKED' },
  'mapsTraining': { title: 'Топография', mode: 'MAPS_TRAINING' },
  'epicRandom': { title: 'Линия фронта', mode: 'EPIC_RANDOM' },
} as const

export const modeCount = {
  'normalAny': 15,
  'normalCft': 15,
  'normalDomination': 15,
  'normalAssault': 15,
  'ranked': 10,
  'epicRandom': 30,
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

export function wotinspectorURL(vehicle: VehicleDescriptor & { shell: number },
  hitVehicle: VehicleDescriptor & VehicleHit,
  hitDistance: number) {
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

  return "https://armor.wotinspector.com/ru/pc?data=" + encodeURIComponent(btoa(String.fromCharCode.apply(null, Array.from(buffer))));
}
