
function bd2vector(obj, name) {
  const res = {
    x: obj[`${name}_x`],
    y: obj[`${name}_y`],
    z: obj[`${name}_z`]
  }
  if (res.x && res.y && res.z)
    return res

  return null
}

function wotinspectorURL(vehicle, hitVehicle, hitDistance) {
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

  return "https://wotinspector.com/ru/webapp?data=" + encodeURIComponent(btoa(String.fromCharCode.apply(null, buffer)));
}

export { bd2vector, wotinspectorURL }
