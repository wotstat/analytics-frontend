
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

export { bd2vector }
