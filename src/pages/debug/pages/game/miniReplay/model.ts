import type {
  LifeFrame,
  MiniReplay,
  PlayerResultRow,
  PreparedImpact,
  PreparedLife,
  PreparedReplay,
  PreparedShot,
  PreparedSnapshot,
  ProjectileEvent,
  ReplayParticipant,
  Vec3,
  VehicleDescription,
  VehicleResult,
} from './types'

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function latestValue<T extends { tick: number }>(items: T[], tick: number): T | undefined {
  let low = 0
  let high = items.length - 1
  let found: T | undefined

  while (low <= high) {
    const middle = (low + high) >> 1
    const item = items[middle]
    if (item.tick <= tick) {
      found = item
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  return found
}

function firstAtOrAfter<T extends { tick: number }>(items: T[], tick: number): T | undefined {
  let low = 0
  let high = items.length - 1
  let found: T | undefined

  while (low <= high) {
    const middle = (low + high) >> 1
    const item = items[middle]
    if (item.tick >= tick) {
      found = item
      high = middle - 1
    } else {
      low = middle + 1
    }
  }

  return found
}

function mergeVehicleInfo(initial: VehicleDescription, resolved?: VehicleDescription) {
  return { ...initial, ...resolved }
}

function prepareSnapshots(life: MiniReplay['vehicleLives'][number]) {
  const byTick = new Map<number, PreparedSnapshot>()

  life.trackSegments.forEach((segment, segmentIndex) => {
    segment.snapshots.forEach(snapshot => {
      const isFull = 'position' in snapshot
      const hullYaw = isFull ? numberValue(snapshot.hull?.yaw) : 0
      const candidate: PreparedSnapshot = {
        tick: snapshot.tick,
        x: isFull ? snapshot.position.x : snapshot.x,
        z: isFull ? snapshot.position.z : snapshot.z,
        yaw: hullYaw,
        turretYaw: isFull && typeof snapshot.turretYaw === 'number'
          ? hullYaw + snapshot.turretYaw
          : null,
        segmentIndex,
        segmentStart: segment.startTick,
        segmentEnd: segment.endTick,
        quality: isFull ? 'full3d' : 'coarse2d',
      }
      const current = byTick.get(candidate.tick)
      if (!current || candidate.quality === 'full3d') byTick.set(candidate.tick, candidate)
    })
  })

  return [...byTick.values()].sort((a, b) => a.tick - b.tick)
}

function prepareLife(
  life: MiniReplay['vehicleLives'][number],
  info: VehicleDescription,
  participant: ReplayParticipant,
): PreparedLife {
  const healthEvents: PreparedLife['healthEvents'] = []
  const aliveEvents: PreparedLife['aliveEvents'] = []
  const spottedEvents: PreparedLife['spottedEvents'] = []
  let deathTick: number | null = null

  life.events.forEach(event => {
    if (event.type === 'healthChanged') {
      healthEvents.push({ tick: event.tick, health: numberValue(event.newHealth) })
    }
    if (event.type === 'aliveChanged' || event.type === 'spawned') {
      aliveEvents.push({ tick: event.tick, alive: Boolean(event.alive) })
    }
    if (event.type === 'spotted') spottedEvents.push({ tick: event.tick, spotted: true })
    if (event.type === 'unspotted') spottedEvents.push({ tick: event.tick, spotted: false })
    if (event.type === 'vehicleKilled') {
      deathTick = event.tick
      aliveEvents.push({ tick: event.tick, alive: false })
    }
    if (event.type === 'vehicleRecovered') {
      aliveEvents.push({ tick: event.tick, alive: true })
    }
  })

  return {
    raw: life,
    info,
    participant,
    snapshots: prepareSnapshots(life),
    healthEvents,
    aliveEvents,
    spottedEvents,
    deathTick,
  }
}

function eventPosition(event: ProjectileEvent) {
  return event.end ?? event.position
}

function fallbackShotEnd(event: ProjectileEvent, tickLength: number) {
  const start = event.start
  const velocity = event.velocity
  if (!start || !velocity) return null

  const speed = Math.hypot(velocity.x, velocity.y, velocity.z)
  if (!speed) return null

  const distance = Math.min(numberValue(event.maxShotDistance, 720), 900)
  const durationTicks = Math.max(2, Math.min(30, Math.ceil(distance / speed / tickLength)))
  return {
    tick: event.tick + durationTicks,
    position: {
      x: start.x + velocity.x / speed * distance,
      y: start.y + velocity.y / speed * distance,
      z: start.z + velocity.z / speed * distance,
    },
  }
}

function prepareProjectiles(events: ProjectileEvent[], tickLength: number) {
  const endingsByShot = new Map<number, ProjectileEvent[]>()
  const impacts: PreparedImpact[] = []

  events.forEach(event => {
    if (event.shotId !== undefined && event.type !== 'tracerStarted' && eventPosition(event)) {
      const endings = endingsByShot.get(event.shotId) ?? []
      endings.push(event)
      endingsByShot.set(event.shotId, endings)
    }

    const position = eventPosition(event)
    if (position && (event.type === 'projectileExploded' || (event.type === 'projectileRemoved' && event.explode))) {
      impacts.push({
        tick: event.tick,
        position,
        kind: event.type === 'projectileExploded' ? 'explosion' : 'removed',
      })
    }
  })

  endingsByShot.forEach(items => items.sort((a, b) => a.tick - b.tick))

  const shots = events.flatMap<PreparedShot>(event => {
    if (event.type !== 'tracerStarted' || event.shotId === undefined || !event.start) return []

    const ending = endingsByShot.get(event.shotId)?.find(item => item.tick >= event.tick && eventPosition(item))
    const fallback = fallbackShotEnd(event, tickLength)
    const end = ending ? eventPosition(ending) : fallback?.position
    const endTick = ending?.tick ?? fallback?.tick
    if (!end || endTick === undefined) return []

    return [{
      shotId: event.shotId,
      startTick: event.tick,
      endTick,
      start: event.start,
      end,
      shellType: event.shellType ?? null,
      effectKind: event.effectKind ?? null,
    }]
  })

  return {
    shots: shots.sort((a, b) => a.startTick - b.startTick),
    impacts: impacts.sort((a, b) => a.tick - b.tick),
  }
}

function matchVehicleTag(
  result: VehicleResult,
  participantId: string,
  lives: PreparedLife[],
  infos: VehicleDescription[],
) {
  const byLife = lives.find(life =>
    life.raw.participantId === participantId
    && life.raw.vehicleId === result.vehicleId
  )?.info.vehicleTag
  if (byLife) return byLife

  return infos.find(info => info.typeCompDescr === result.typeCompDescr)?.vehicleTag ?? 'unknown:vehicle'
}

function prepareResultRows(
  replay: MiniReplay,
  participantsById: Map<string, ReplayParticipant>,
  lives: PreparedLife[],
  infos: VehicleDescription[],
) {
  const resultParticipants = replay.result?.participants ?? replay.participants.map(participant => ({
    participantId: participant.participantId,
    accountDBID: participant.accountDBID,
    team: participant.team,
    vehicleResults: [],
  }))

  return resultParticipants.map<PlayerResultRow>(resultParticipant => {
    const participant = participantsById.get(resultParticipant.participantId) ?? {
      participantId: resultParticipant.participantId,
      accountDBID: resultParticipant.accountDBID,
      name: resultParticipant.participantId,
      team: resultParticipant.team,
    }
    const vehicleResults = resultParticipant.vehicleResults.map(result => ({
      ...result,
      vehicleTag: matchVehicleTag(result, resultParticipant.participantId, lives, infos),
    }))

    return {
      participant,
      team: resultParticipant.team,
      vehicleResults,
      damage: vehicleResults.reduce((sum, result) => sum + numberValue(result.damageDealt), 0),
      kills: vehicleResults.reduce((sum, result) => sum + numberValue(result.kills), 0),
      experience: null,
    }
  }).sort((a, b) => b.damage - a.damage || b.kills - a.kills)
}

export function prepareReplay(replay: MiniReplay): PreparedReplay {
  const participantsById = new Map(replay.participants.map(participant => [participant.participantId, participant]))
  const infosById = new Map(replay.vehicleInfos.map(info => [
    info.vehicleInfoId,
    mergeVehicleInfo(info.initial, info.resolved),
  ]))
  const fallbackParticipant: ReplayParticipant = {
    participantId: 'unknown',
    name: 'Неизвестный игрок',
    team: 0,
  }
  const lives = replay.vehicleLives.map(life => prepareLife(
    life,
    infosById.get(life.vehicleInfoId) ?? {},
    participantsById.get(life.participantId) ?? { ...fallbackParticipant, participantId: life.participantId },
  ))
  const livesByParticipant = new Map<string, PreparedLife[]>()
  lives.forEach(life => {
    const participantLives = livesByParticipant.get(life.raw.participantId) ?? []
    participantLives.push(life)
    livesByParticipant.set(life.raw.participantId, participantLives)
  })
  livesByParticipant.forEach(participantLives => participantLives.sort((a, b) => a.raw.lifeIndex - b.raw.lifeIndex))

  const { shots, impacts } = prepareProjectiles(replay.projectileEvents, replay.battle.tickLength)
  const [bottomLeft, upperRight] = replay.battle.map.boundingBox
  const allInfos = [...infosById.values()]

  return {
    raw: replay,
    participantsById,
    infosById,
    lives,
    livesByParticipant,
    shots,
    impacts,
    resultRows: prepareResultRows(replay, participantsById, lives, allInfos),
    maxTick: replay.battle.captureEndTick,
    bbox: {
      left: Math.min(bottomLeft?.x ?? -500, upperRight?.x ?? 500),
      right: Math.max(bottomLeft?.x ?? -500, upperRight?.x ?? 500),
      bottom: Math.min(bottomLeft?.y ?? -500, upperRight?.y ?? 500),
      top: Math.max(bottomLeft?.y ?? -500, upperRight?.y ?? 500),
    },
  }
}

function interpolateAngle(a: number, b: number, progress: number) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a))
  return a + delta * progress
}

function snapshotPosition(snapshots: PreparedSnapshot[], tick: number) {
  const previous = latestValue(snapshots, tick)
  const next = firstAtOrAfter(snapshots, tick)

  if (previous?.tick === tick) return previous
  if (next?.tick === tick) return next
  if (previous && next && previous.segmentIndex === next.segmentIndex) {
    const span = next.tick - previous.tick
    const progress = span ? (tick - previous.tick) / span : 0
    return {
      ...previous,
      x: previous.x + (next.x - previous.x) * progress,
      z: previous.z + (next.z - previous.z) * progress,
      yaw: interpolateAngle(previous.yaw, next.yaw, progress),
      turretYaw: previous.turretYaw !== null && next.turretYaw !== null
        ? interpolateAngle(previous.turretYaw, next.turretYaw, progress)
        : previous.turretYaw ?? next.turretYaw,
      tick,
    }
  }
  if (previous && tick <= previous.segmentEnd) return previous
  if (next && tick >= next.segmentStart) return next
  return null
}

export function lifeFrameAt(life: PreparedLife, tick: number, reporterTeam: number): LifeFrame | null {
  if (tick < life.raw.firstObservedTick) return null
  const position = snapshotPosition(life.snapshots, tick)
  if (!position) return null

  const maxHealth = numberValue(life.info.maxHealth, 1)
  const health = latestValue(life.healthEvents, tick)?.health ?? maxHealth
  const aliveFromEvent = latestValue(life.aliveEvents, tick)?.alive
  const alive = aliveFromEvent ?? life.raw.aliveAtFirstObservation
  const spotted = life.participant.team === reporterTeam
    || (latestValue(life.spottedEvents, tick)?.spotted ?? true)

  return {
    life,
    x: position.x,
    z: position.z,
    yaw: position.yaw,
    turretYaw: position.turretYaw,
    health: alive ? Math.max(0, health) : 0,
    maxHealth,
    alive,
    spotted,
  }
}

export function worldToRelative(point: Pick<Vec3, 'x' | 'z'>, replay: PreparedReplay) {
  const { bbox } = replay
  return {
    x: (point.x - bbox.left) / (bbox.right - bbox.left),
    y: 1 - (point.z - bbox.bottom) / (bbox.top - bbox.bottom),
  }
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function sumResult(results: VehicleResult[], key: keyof VehicleResult) {
  return results.reduce((sum, result) => sum + numberValue(result[key]), 0)
}
