export type Vec3 = {
  x: number
  y: number
  z: number
}

export type ReplayParticipant = {
  participantId: string
  accountDBID?: string
  name: string
  clanTag?: string
  team: number
  isAnonymized?: boolean
}

export type VehicleDescription = {
  vehicleTag?: string
  typeCompDescr?: number
  team?: number
  nation?: string
  level?: number
  classTag?: string
  maxHealth?: number
}

export type VehicleInfo = {
  vehicleInfoId: string
  initial: VehicleDescription
  resolved?: VehicleDescription
  updates?: Array<{
    tick: number
    fields: VehicleDescription
  }>
}

export type FullSnapshot = {
  tick: number
  position: Vec3
  hull?: {
    yaw?: number
    pitch?: number
    roll?: number
  }
  turretYaw?: number
  gunPitch?: number
}

export type CoarseSnapshot = {
  tick: number
  x: number
  z: number
}

export type TrackSegment = {
  kind: 'full3d' | 'coarse2d' | (string & {})
  startTick: number
  endTick: number
  snapshots: Array<FullSnapshot | CoarseSnapshot>
}

export type ReplayEvent = {
  tick: number
  type: string
  [key: string]: unknown
}

export type VehicleLife = {
  lifeId: string
  vehicleId: number
  respawnId?: number
  lifeIndex: number
  participantId: string
  vehicleInfoId: string
  firstObservedTick: number
  aliveAtFirstObservation: boolean
  trackSegments: TrackSegment[]
  events: ReplayEvent[]
}

export type ProjectileEvent = ReplayEvent & {
  shotId?: number
  start?: Vec3
  end?: Vec3
  position?: Vec3
  velocity?: Vec3 | null
  maxShotDistance?: number | null
  shooterVehicleId?: number
  shellType?: string | null
  effectKind?: string | null
  explode?: boolean
}

export type VehicleResult = {
  aggregateIndex: number
  vehicleId: number
  typeCompDescr?: number
  team?: number
  damageDealt?: number
  damageReceived?: number
  damageAssistedRadio?: number
  damageAssistedTrack?: number
  damageAssistedStun?: number
  damageBlockedByArmor?: number
  kills?: number
  deathCount?: number
  health?: number
  maxHealth?: number
  shots?: number
  directEnemyHits?: number
  piercingEnemyHits?: number
  spotted?: number
  capturePoints?: number
  droppedCapturePoints?: number
  lifeTime?: number
  mileage?: number
  [key: string]: unknown
}

export type ResultParticipant = {
  participantId: string
  accountDBID?: string
  team: number
  vehicleResults: VehicleResult[]
}

export type TeamResult = {
  team: number
  damageDealt?: number
  kills?: number
  participants?: number
  [key: string]: unknown
}

export type MiniReplay = {
  schemaVersion: number
  battle: {
    arenaTypeID: number
    arenaUniqueID: string
    battleStartServerTime: number
    tickLength: number
    captureStartTick: number
    captureEndTick: number
    captureEndReason: string
    captureReachedArenaEnd: boolean
    clientVersion: string
    modVersion: string
    reporterAccountDBID: string
    reporterParticipantId: string
    reporterTeam: number
    map: {
      geometry: string
      geometryName?: string
      boundingBox: Array<{ x: number, y: number }>
      spaceBoundingBox?: Array<{ x: number, y: number }>
    }
    mode: {
      bonusType: number
      bonusTypeName: string
      gameplayName: string
      guiType: number
    }
  }
  participants: ReplayParticipant[]
  vehicleInfos: VehicleInfo[]
  vehicleLives: VehicleLife[]
  projectileEvents: ProjectileEvent[]
  arenaEvents: ReplayEvent[]
  result?: {
    common: {
      duration?: number
      winnerTeam?: number
      finishReason?: {
        id: number
        name: string
      }
      teamHealth?: Record<string, number>
      [key: string]: unknown
    }
    participants: ResultParticipant[]
    teams: TeamResult[]
  }
}

export type PreparedSnapshot = {
  tick: number
  x: number
  z: number
  yaw: number
  turretYaw: number | null
  segmentIndex: number
  segmentStart: number
  segmentEnd: number
  quality: 'full3d' | 'coarse2d'
}

export type PreparedLife = {
  raw: VehicleLife
  info: VehicleDescription
  participant: ReplayParticipant
  snapshots: PreparedSnapshot[]
  healthEvents: Array<{ tick: number, health: number }>
  aliveEvents: Array<{ tick: number, alive: boolean }>
  spottedEvents: Array<{ tick: number, spotted: boolean }>
  deathTick: number | null
}

export type PreparedShot = {
  shotId: number
  startTick: number
  endTick: number
  start: Vec3
  end: Vec3
  shellType: string | null
  effectKind: string | null
}

export type PreparedImpact = {
  tick: number
  position: Vec3
  kind: 'explosion' | 'removed'
}

export type PlayerResultRow = {
  participant: ReplayParticipant
  team: number
  vehicleResults: Array<VehicleResult & { vehicleTag: string }>
  damage: number
  kills: number
  experience: number | null
}

export type PreparedReplay = {
  raw: MiniReplay
  participantsById: Map<string, ReplayParticipant>
  infosById: Map<string, VehicleDescription>
  lives: PreparedLife[]
  livesByParticipant: Map<string, PreparedLife[]>
  shots: PreparedShot[]
  impacts: PreparedImpact[]
  resultRows: PlayerResultRow[]
  maxTick: number
  bbox: {
    left: number
    right: number
    bottom: number
    top: number
  }
}

export type LifeFrame = {
  life: PreparedLife
  x: number
  z: number
  yaw: number
  turretYaw: number | null
  health: number
  maxHealth: number
  alive: boolean
  spotted: boolean
}
