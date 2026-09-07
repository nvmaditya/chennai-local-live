import type { Line } from "../lib/transit/types.ts";

export const SOUTH_CODES = [
  "MSB", "MSF", "MPK", "MS", "MSC", "NBK", "MKK", "MBM", "SP", "GDY",
  "STM", "PZA", "MN", "TLM", "PV", "CMP", "TBMS", "TBM", "PRGL", "VDR",
  "KLBA", "UPM", "GI", "POTI", "CTM", "MMNK", "SKL", "PWU", "CGL",
] as const;

export const WEST_CODES = [
  "MSB", "RPM", "WST", "MASS", "BBQ", "VJM", "PER", "PCW", "PEW", "VLK",
  "KOTR", "PVM", "ABU", "TMVL", "ANNR", "AVD", "HC", "PAB", "PTMS", "PRES",
  "NEC", "TI", "VEU", "SVR", "PTLR", "TRL", "EGT", "KBT", "SPAM", "MAF",
  "TO", "MOS", "PLMG", "AJJ", "TRT",
] as const;

export const NORTH_CODES = [
  "MSB", "RPM", "WST", "MASS", "BBQ", "KOK", "TNP", "VOC", "TVT", "WCN",
  "KAVM", "ENR", "AIPP", "AIP", "NPKM", "MJR", "APB", "PON", "KVP", "GPD",
  "ELR", "AKM", "TADA", "SPE",
] as const;

export const MRTS_CODES = [
  "MSB", "MSF", "MPKT", "MCPT", "MCPK", "MTCN", "MLHS", "MKAK", "MTMY",
  "MNDY", "GWYR", "KTPM", "KTBR", "INDR", "TYMR", "TRMN", "PRGD", "VLCY",
  "PZV", "ADBK", "STM",
] as const;

export const LINES: Line[] = [
  {
    id: "south",
    name: "South Line",
    nameTa: "தென் வழித்தடம்",
    colour: "#e4453a",
    origin: "MSB",
    termini: ["MSB", "TBM", "CGL"],
    defaultCarCount: 12,
    stations: [...SOUTH_CODES],
    upLabel: "Towards Beach / Egmore",
    downLabel: "Towards Tambaram / Chengalpattu",
  },
  {
    id: "west",
    name: "West Line",
    nameTa: "மேற்கு வழித்தடம்",
    colour: "#2fbf71",
    origin: "MASS",
    termini: ["MSB", "MASS", "AVD", "TRL", "AJJ", "TRT"],
    defaultCarCount: 12,
    stations: [...WEST_CODES],
    upLabel: "Towards Central / Beach",
    downLabel: "Towards Avadi / Arakkonam / Tiruttani",
  },
  {
    id: "north",
    name: "North Line",
    nameTa: "வடக்கு வழித்தடம்",
    colour: "#4a90ff",
    origin: "MASS",
    termini: ["MSB", "MASS", "GPD", "SPE"],
    defaultCarCount: 12,
    stations: [...NORTH_CODES],
    upLabel: "Towards Central / Beach",
    downLabel: "Towards Gummidipoondi / Sullurupeta",
  },
  {
    id: "mrts",
    name: "MRTS",
    nameTa: "எம்ஆர்டிஎஸ்",
    colour: "#e0a21a",
    origin: "MSB",
    termini: ["MSB", "VLCY", "STM"],
    defaultCarCount: 9,
    stations: [...MRTS_CODES],
    upLabel: "Towards Beach",
    downLabel: "Towards Velachery / St. Thomas Mount",
  },
];

export const LINE_BY_ID = Object.fromEntries(LINES.map((l) => [l.id, l])) as Record<
  Line["id"],
  Line
>;
