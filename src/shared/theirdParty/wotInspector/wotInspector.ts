
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

URL: ${wotinspectorURLNew(vehicle, hitVehicle, hitDistance, isWOT)}
  `)
}


function rad2deg(rad: number) {
  return rad * 180 / Math.PI
}

export function wotinspectorURLNew(vehicle: VehicleDescriptor & { shell: number },
  hitVehicle: VehicleDescriptor & VehicleHit,
  hitDistance: number, isWOT: boolean = false) {

  const query = {
    'distance': hitDistance,
    'pkg': isWOT ? 'pc' : 'mirtankov',
    'segment': hitVehicle.segment,
    'shooter.chassis': vehicle.chassis,
    'shooter.gun': vehicle.gun,
    'shooter.shell': vehicle.shell,
    'shooter.turret': vehicle.turret,
    'shooter.vehicle': vehicle.vehicle,
    'target.chassis': hitVehicle.chassis,
    'target.gun': hitVehicle.gun,
    'target.gun.pitch': rad2deg(hitVehicle.turretPitch),
    'target.turret': hitVehicle.turret,
    'target.turret.yaw': rad2deg(hitVehicle.turretYaw),
    'target.vehicle': hitVehicle.vehicle,
  }

  return `https://api.wotinspector.com/v2/ai/shotsimulate?${Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')}`
}


export function wotinspectorURLOld(vehicle: VehicleDescriptor & { shell: number },
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

  return `https://armor.wotinspector.com/ru/${isWOT ? 'pc' : 'mirtankov'}?data=${encodeURIComponent(btoa(String.fromCharCode.apply(null, Array.from(buffer))))}`
}
