export type LineId = "south" | "west" | "north" | "mrts";
export type Direction = "UP" | "DOWN";
export type CarType = "DMC" | "MC" | "NDMC" | "TC";
export type CarClass =
  | "GEN"
  | "LADIES"
  | "FC"
  | "FC_LADIES_COMPOSITE"
  | "AC_GEN"
  | "AC_LADIES"
  | "DISABLED"
  | "LUGGAGE_CAB";
export type DoorSide = "left" | "right" | "both";
export type Confidence = "high" | "medium" | "inferred";
export type TrainEvent =
  | "ARRIVED"
  | "DEPARTED"
  | "APPROACHING"
  | "AT_PLATFORM"
  | "TERMINATED";
export type DataSource = "NTES" | "STATION_BOARD" | "SCHEDULE_SIM" | "STALE";
export type TimeBand = "AM_PEAK" | "PM_PEAK" | "MID" | "LATE";
export type PlatformType = "side" | "island" | "bay" | "elevated-side";
export type LayoutKind = "at-grade" | "elevated" | "mixed";
export type ZeroEnd = "towards-MSB" | "towards-suburb" | "towards-MASS";
export type AccessKind =
  | "FOB"
  | "subway"
  | "street-gate"
  | "ticket-hall"
  | "bus-interchange"
  | "metro-link";
export type LeadingCab = "car1" | "carN";

export interface Station {
  code: string;
  name: string;
  nameTa: string;
  lat: number;
  lng: number;
  lines: LineId[];
  km: Partial<Record<LineId, number>>;
  sx: number;
  sy: number;
  interchange: boolean;
  terminal: boolean;
  metroInterchange?: boolean;
  cluster?: string;
  aliases?: string[];
}

export interface Line {
  id: LineId;
  name: string;
  nameTa: string;
  colour: string;
  origin: string;
  termini: string[];
  defaultCarCount: number;
  stations: string[];
  upLabel: string;
  downLabel: string;
}

export interface RakeCar {
  index: number;
  type: CarType;
  class: CarClass;
  doorCountPerSide: number;
  seated: number;
  standing: number;
}

export interface RakeTemplate {
  id: string;
  name: string;
  carCount: number;
  rakeLengthMeters: number;
  isAC: boolean;
  cars: RakeCar[];
}

export interface Platform {
  id: string;
  number: string;
  type: PlatformType;
  servingLines: LineId[];
  defaultDirection: Direction | "BOTH" | "TERMINATING";
  doorsOpen: DoorSide;
  lengthM: number;
  zeroEnd: ZeroEnd;
}

export interface AccessNode {
  id: string;
  kind: AccessKind;
  name: string;
  sideOfTracks: string;
  connectsPlatforms: string[];
  dumpZone: { platformId: string; from: number; to: number }[];
  isPrimaryPeakEntry: boolean;
  notes: string;
}

export interface ZoneBias {
  front: number;
  mid: number;
  rear: number;
}

export interface StationGeometry {
  code: string;
  name: string;
  lines: LineId[];
  layout: LayoutKind;
  platforms: Platform[];
  accesses: AccessNode[];
  boardingBias: { UP: ZoneBias; DOWN: ZoneBias };
  peakNotes: string;
  confidence: Confidence;
  defaultPlatformByDirection: {
    UP: string;
    DOWN: string;
    TERMINATING?: string;
  };
}

export interface SeedStop {
  code: string;
  arrMin: number;
  depMin: number;
  platform: string;
}

export interface SeedService {
  trainNumber: string;
  name: string;
  lineId: LineId;
  origin: string;
  destination: string;
  via?: string;
  rakeTemplateId: string;
  direction: Direction;
  isFast: boolean;
  isAC: boolean;
  isLadiesSpecial: boolean;
  stops: SeedStop[];
}

export interface LiveTrain {
  trainNumber: string;
  name: string;
  lineId: LineId;
  origin: string;
  destination: string;
  via?: string;
  rakeTemplateId: string;
  carCount: number;
  lastReportedStation: string;
  lastEvent: TrainEvent;
  delayMinutes: number;
  nextStation: string | null;
  eta: string | null;
  platformLast: string;
  platformNext: string;
  platformLive?: string;
  platformChanged?: boolean;
  lat: number;
  lng: number;
  sx: number;
  sy: number;
  heading: number;
  progress: number;
  direction: Direction;
  isFast: boolean;
  isAC: boolean;
  isLadiesSpecial: boolean;
  dataSource: DataSource;
  lastUpdateTs: number;
  leadingCab: LeadingCab;
}

export interface CrowdResult {
  occupancy: number[];
  front: number;
  mid: number;
  rear: number;
  sentence: string;
  band: TimeBand;
  ladiesCars: number[];
}

export interface NetworkSnapshot {
  generatedAt: number;
  clockLabel: string;
  source: DataSource;
  ntesAttempted: boolean;
  trains: LiveTrain[];
  liveCount: number;
  simulatedCount: number;
}
