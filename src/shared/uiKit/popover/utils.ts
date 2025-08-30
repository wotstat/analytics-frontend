
export type Placement =
  'top' | 'top-start' | 'top-end' |
  'bottom' | 'bottom-start' | 'bottom-end' |
  'left' | 'left-start' | 'left-end' |
  'right' | 'right-start' | 'right-end';

export type PlacementWithModifiers = Placement | `${Placement}-float`;

export type Params = {
  target: { x: number, y: number, width: number, height: number }
  popup: { width: number, height: number }
}

export function isParamsEqual(left: Params, right: Params) {
  if (!left || !right) return false
  return left.target.x === right.target.x &&
    left.target.y === right.target.y &&
    left.target.width === right.target.width &&
    left.target.height === right.target.height &&
    left.popup.width === right.popup.width &&
    left.popup.height === right.popup.height
}

export function getParams(target: HTMLElement | null, popup: HTMLElement | null) {

  if (!target || !popup) return null

  const targetRect = target.getBoundingClientRect()
  const popupRect = popup.getBoundingClientRect()

  return {
    target: {
      x: targetRect.x,
      y: targetRect.y,
      width: targetRect.width,
      height: targetRect.height
    },
    popup: {
      width: popupRect.width,
      height: popupRect.height
    }
  } as Params
}

export type OffsetValue =
  number |
  [number] |
  [number, number] |
  [number, number, number] |
  [number, number, number, number] |
  { x?: number, y?: number } |
  { top?: number, left?: number, right?: number, bottom?: number };

type Offset = { top: number, left: number, right: number, bottom: number }

export function generateOffset(value: OffsetValue): Offset {
  if (typeof value === 'number') {
    return { top: value, left: value, right: value, bottom: value }
  }

  if (Array.isArray(value)) {
    switch (value.length) {
      case 1:
        return { top: value[0], left: value[0], right: value[0], bottom: value[0] }
      case 2:
        return { top: value[0], left: value[1], right: value[1], bottom: value[0] }
      case 3:
        return { top: value[0], left: value[1], right: value[1], bottom: value[2] }
      case 4:
        return { top: value[0], left: value[1], right: value[2], bottom: value[3] }
    }
  }

  if (typeof value === 'object') {
    if ('x' in value || 'y' in value) {
      return {
        top: 'y' in value ? value.y ?? 0 : 0,
        left: 'x' in value ? value.x ?? 0 : 0,
        right: 'x' in value ? value.x ?? 0 : 0,
        bottom: 'y' in value ? value.y ?? 0 : 0
      }
    }

    return {
      top: 'top' in value ? value.top ?? 0 : 0,
      left: 'left' in value ? value.left ?? 0 : 0,
      right: 'right' in value ? value.right ?? 0 : 0,
      bottom: 'bottom' in value ? value.bottom ?? 0 : 0
    }
  }

  return { top: 0, left: 0, right: 0, bottom: 0 }
}

type Bbox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function generateBbox(bbox: DOMRect | 'window' | false | null | undefined, offset: Offset): Bbox | null {
  if (bbox === 'window') {
    return {
      left: 0 + offset.left,
      top: 0 + offset.top,
      right: document.documentElement.clientWidth - offset.right,
      bottom: document.documentElement.clientHeight - offset.bottom
    }
  }

  if (bbox instanceof DOMRect) {
    return {
      left: bbox.left + offset.left,
      top: bbox.top + offset.top,
      right: bbox.right - offset.right,
      bottom: bbox.bottom - offset.bottom
    }
  }

  return null
}

function calculateBasePosition(placement: Placement, offset: Offset, params: Params) {

  const { target, popup } = params

  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2

  switch (placement) {
    case 'top': return { x: targetCenterX - popup.width / 2, y: target.y - popup.height - offset.bottom }
    case 'bottom': return { x: targetCenterX - popup.width / 2, y: target.y + target.height + offset.top }
    case 'left': return { x: target.x - popup.width - offset.right, y: targetCenterY - popup.height / 2 }
    case 'right': return { x: target.x + target.width + offset.left, y: targetCenterY - popup.height / 2 }
    case 'top-start': return { x: target.x, y: target.y - popup.height - offset.bottom }
    case 'top-end': return { x: target.x + target.width - popup.width, y: target.y - popup.height - offset.bottom }
    case 'bottom-start': return { x: target.x, y: target.y + target.height + offset.top }
    case 'bottom-end': return { x: target.x + target.width - popup.width, y: target.y + target.height + offset.top }
    case 'left-start': return { x: target.x - popup.width - offset.right, y: target.y }
    case 'left-end': return { x: target.x - popup.width - offset.right, y: target.y + target.height - popup.height }
    case 'right-start': return { x: target.x + target.width + offset.left, y: target.y }
    case 'right-end': return { x: target.x + target.width + offset.left, y: target.y + target.height - popup.height }
  }
}

const horizontalPlacements = new Set<Placement>(['left', 'right', 'left-start', 'left-end', 'right-start', 'right-end'])
const verticalPlacements = new Set<Placement>(['top', 'bottom', 'top-start', 'top-end', 'bottom-start', 'bottom-end'])

function calculatePosition(placement: Placement, offset: Offset, params: Params, floatModifier: boolean, bbox: Bbox | null) {
  const { popup, target } = params

  let { x, y } = calculateBasePosition(placement, offset, params)

  if (bbox && floatModifier) {
    if (!verticalPlacements.has(placement)) {
      if (y + popup.height > bbox.bottom) {
        y = bbox.bottom - popup.height

        if (target.height > popup.height) {
          if (y < target.y) y = target.y
        } else {
          if (target.y + target.height > y + popup.height) y = target.y + target.height - popup.height
        }

      } else if (y < bbox.top) {
        y = bbox.top

        if (target.height > popup.height) {
          if (y + popup.height > target.y + target.height) y = target.y + target.height - popup.height
        } else {
          if (y > target.y) y = target.y
        }
      }
    }

    if (!horizontalPlacements.has(placement)) {
      if (x + popup.width > bbox.right) {
        x = bbox.right - popup.width

        if (target.width > popup.width) {
          if (x < target.x) x = target.x
        } else {
          if (target.x + target.width > x + popup.width) x = target.x + target.width - popup.width
        }

      } else if (x < bbox.left) {
        x = bbox.left

        if (target.width > popup.width) {
          if (x + popup.width > target.x + target.width) x = target.x + target.width - popup.width
        } else {
          if (x > target.x) x = target.x
        }
      }
    }
  }

  return { x, y }
}

function isInside(x: number, y: number, bbox: Bbox, params: Params) {
  const { popup } = params

  return x + popup.width <= bbox.right &&
    x >= bbox.left &&
    y + popup.height <= bbox.bottom &&
    y >= bbox.top
}

function getPlacement(placementWithModifiers: PlacementWithModifiers) {
  const placement = placementWithModifiers.replace(/-float$/, '') as Placement
  const floatModifier = placementWithModifiers.match(/-float$/) !== null

  return {
    placement,
    float: floatModifier
  }
}

export type PlacementParam = PlacementWithModifiers[] | PlacementWithModifiers;
export function calculatePopoverPosition(params: Params, preferredPlacement: PlacementWithModifiers[],
  options: {
    bbox?: DOMRect | 'window' | false | null
    lastPlacement?: PlacementWithModifiers
    preserveLastPlacement?: boolean
    offset: Offset,
    viewportOffset: Offset
  }): { x: number, y: number, placement?: PlacementWithModifiers } {

  const { offset, lastPlacement, preserveLastPlacement, viewportOffset } = options

  const bbox = generateBbox(options.bbox, viewportOffset)

  const checkedPlacements = [...preferredPlacement]
  if (preserveLastPlacement && lastPlacement) checkedPlacements.splice(0, 0, lastPlacement)

  for (const placementWithModifiers of checkedPlacements) {
    const { placement, float: floatModifier } = getPlacement(placementWithModifiers)
    const { x, y } = calculatePosition(placement, offset, params, floatModifier, bbox)

    if (!bbox) return { x, y, placement: placementWithModifiers }
    if (isInside(x, y, bbox, params)) return { x, y, placement: placementWithModifiers }
  }

  if (!lastPlacement) {
    const { placement, float: floatModifier } = getPlacement(checkedPlacements[0])
    const { x, y } = calculatePosition(placement, offset, params, floatModifier, bbox)
    return { x, y, placement }
  }

  const { placement, float: floatModifier } = getPlacement(lastPlacement)
  const { x, y } = calculatePosition(placement, offset, params, floatModifier, bbox)
  return { x, y, placement: lastPlacement }
}

export function getArrowPosition(position: ReturnType<typeof calculatePopoverPosition>, params: Params) {
  const { target, popup } = params

  if (!position.placement) return null

  const { placement } = getPlacement(position.placement)

  let x = 0
  let y = 0

  let direction: 'top' | 'bottom' | 'left' | 'right' = 'top'

  switch (placement) {
    case 'top': case 'top-start': case 'top-end': direction = 'bottom'; break
    case 'bottom': case 'bottom-start': case 'bottom-end': direction = 'top'; break
    case 'left': case 'left-start': case 'left-end': direction = 'right'; break
    case 'right': case 'right-start': case 'right-end': direction = 'left'; break
  }


  if (direction == 'left') x = 0
  else if (direction == 'right') x = popup.width
  else if (direction == 'top') y = 0
  else if (direction == 'bottom') y = popup.height

  if (horizontalPlacements.has(placement)) {
    if (popup.height > target.height) y = target.y + target.height / 2 - position.y
    else y = popup.height / 2
  }

  if (verticalPlacements.has(placement)) {
    if (popup.width > target.width) x = target.x + target.width / 2 - position.x
    else x = popup.width / 2
  }


  return { x, y, direction }
}