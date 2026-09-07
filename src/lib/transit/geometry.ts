import { STATIONS, stationOf } from "../../data/stations.ts";
import type {
  AccessNode,
  Confidence,
  Direction,
  DoorSide,
  LayoutKind,
  LineId,
  Platform,
  PlatformType,
  Station,
  StationGeometry,
  ZeroEnd,
  ZoneBias,
} from "./types.ts";

const AUTHORED_CODES = new Set([
  "MSB", "MSF", "MPK", "MS", "MASS", "BBQ", "STM", "GDY", "MBM", "TBM",
  "CMP", "PV", "AVD", "PER", "VLK", "ABU", "TRL", "AJJ", "VLCY", "TYMR",
  "MTMY", "MCPT", "ENR", "TVT", "GPD", "CGL",
]);

function bias(front: number, mid: number, rear: number): ZoneBias {
  const s = front + mid + rear || 1;
  return { front: front / s, mid: mid / s, rear: rear / s };
}

function pf(
  code: string,
  number: string,
  type: PlatformType,
  dir: Direction | "BOTH" | "TERMINATING",
  doors: DoorSide,
  lines: LineId[],
  zeroEnd: ZeroEnd,
  lengthM = 270,
): Platform {
  return {
    id: `${code}-PF${number}`,
    number,
    type,
    servingLines: lines,
    defaultDirection: dir,
    doorsOpen: doors,
    lengthM,
    zeroEnd,
  };
}

function access(
  id: string,
  kind: AccessNode["kind"],
  name: string,
  side: string,
  platforms: string[],
  from: number,
  to: number,
  primary: boolean,
  notes: string,
): AccessNode {
  return {
    id,
    kind,
    name,
    sideOfTracks: side,
    connectsPlatforms: platforms,
    dumpZone: platforms.map((p) => ({ platformId: p, from, to })),
    isPrimaryPeakEntry: primary,
    notes,
  };
}

function geo(
  st: Station,
  layout: LayoutKind,
  platforms: Platform[],
  accesses: AccessNode[],
  boardingBias: StationGeometry["boardingBias"],
  peakNotes: string,
  confidence: Confidence,
  defaults: StationGeometry["defaultPlatformByDirection"],
): StationGeometry {
  return {
    code: st.code,
    name: st.name,
    lines: st.lines,
    layout,
    platforms,
    accesses,
    boardingBias,
    peakNotes,
    confidence,
    defaultPlatformByDirection: defaults,
  };
}

function inferredFor(st: Station): StationGeometry {
  const cityEnd: ZeroEnd = st.lines.includes("west") || st.lines.includes("north")
    ? "towards-MASS"
    : "towards-MSB";
  const lines = st.lines;
  const elevated = st.lines.length === 1 && st.lines[0] === "mrts";
  const layout: LayoutKind = elevated ? "elevated" : "at-grade";
  const doors: DoorSide = elevated ? "left" : "left";
  const length = elevated ? 200 : 270;
  const p1 = pf(st.code, "1", elevated ? "elevated-side" : "side", "UP", doors, lines, cityEnd, length);
  const p2 = pf(st.code, "2", elevated ? "elevated-side" : "side", "DOWN", doors, lines, cityEnd, length);
  const fobAt = 0.4;
  const acc = access(
    `${st.code}-fob`,
    "FOB",
    `${st.name} FOB`,
    "city-side",
    [p1.id, p2.id],
    fobAt - 0.12,
    fobAt + 0.12,
    true,
    "Inferred FOB at 40% from the city-direction end — people walk less from the busier city stair.",
  );
  return geo(
    st,
    layout,
    [p1, p2],
    [acc],
    {
      UP: bias(0.42, 0.38, 0.2),
      DOWN: bias(0.22, 0.4, 0.38),
    },
    elevated
      ? "MRTS side platforms: doors open left both ways. Single FOB inferred mid-city third."
      : "Default 2 side platforms. PF1 UP (city), PF2 DOWN (suburb). FOB ~40% from city end.",
    "inferred",
    { UP: "1", DOWN: "2" },
  );
}

function authored(): Record<string, StationGeometry> {
  const g: Record<string, StationGeometry> = {};
  const S = (c: string) => stationOf(c)!;

  {
    const st = S("MSB");
    const p1 = pf("MSB", "1", "bay", "TERMINATING", "left", ["south", "mrts"], "towards-suburb", 270);
    const p2 = pf("MSB", "2", "bay", "DOWN", "left", ["south"], "towards-suburb", 270);
    const p3 = pf("MSB", "3", "bay", "DOWN", "left", ["west", "north"], "towards-suburb", 270);
    const p4 = pf("MSB", "4", "elevated-side", "DOWN", "left", ["mrts"], "towards-suburb", 210);
    g.MSB = geo(
      st, "mixed",
      [p1, p2, p3, p4],
      [
        access("MSB-concourse", "ticket-hall", "Main concourse / Beach ticket hall", "east", [p1.id, p2.id, p3.id], 0.0, 0.38, true, "Harbour-end concourse sits toward cars 1–4 on DOWN departures. Origin-end overload is structural."),
        access("MSB-fort-fob", "FOB", "Fort / High Court FOB", "west", [p1.id, p2.id], 0.62, 0.9, false, "Walk-up from Fort feeds the far third toward Park."),
        access("MSB-mrts-stair", "street-gate", "MRTS stair from Beach Road", "east", [p4.id], 0.15, 0.45, true, "MRTS elevated: left-side doors. Stair near Beach Road end."),
      ],
      { DOWN: bias(0.48, 0.32, 0.2), UP: bias(0.2, 0.35, 0.45) },
      "Beach is a bay terminal. Ticket hall dumps into the origin third. DOWN 12-car: cars 1–4 leave hottest. MRTS uses separate elevated platforms, doors left.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "1" },
    );
  }

  {
    const st = S("MSF");
    const p1 = pf("MSF", "1", "island", "UP", "right", ["south"], "towards-MSB", 250);
    const p2 = pf("MSF", "2", "island", "DOWN", "left", ["south"], "towards-MSB", 250);
    const p3 = pf("MSF", "3", "elevated-side", "BOTH", "left", ["mrts"], "towards-MSB", 200);
    g.MSF = geo(
      st, "mixed",
      [p1, p2, p3],
      [
        access("MSF-highcourt", "street-gate", "High Court / Parry's gate", "east", [p1.id, p2.id], 0.1, 0.4, true, "Parry's / High Court crowd enters the Beach-end third."),
        access("MSF-mrts", "FOB", "MRTS–suburban transfer stair", "east", [p3.id, p1.id], 0.3, 0.55, true, "Transfer from MRTS dumps mid-rake on suburban."),
      ],
      { UP: bias(0.4, 0.4, 0.2), DOWN: bias(0.28, 0.44, 0.28) },
      "Fort island: suburban doors right on UP, left on DOWN. MRTS elevated side, doors left both ways.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("MPK");
    const p1 = pf("MPK", "1", "island", "UP", "right", ["south"], "towards-MSB", 250);
    const p2 = pf("MPK", "2", "island", "DOWN", "left", ["south"], "towards-MSB", 250);
    g.MPK = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("MPK-central", "subway", "Park / Central subway", "north", [p1.id, p2.id], 0.15, 0.5, true, "Subway from Central/Park Town dumps the city third — short-hop office load."),
        access("MPK-evk", "street-gate", "EVR Periyar Road gate", "south", [p1.id, p2.id], 0.55, 0.85, false, "Southern gate is quieter except court/office peaks."),
      ],
      { UP: bias(0.46, 0.36, 0.18), DOWN: bias(0.22, 0.4, 0.38) },
      "Park is the Central interchange on the south line, not the same as Park Town MRTS. Treat as a connected node, not one blob.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("MS");
    const p1 = pf("MS", "1", "island", "UP", "right", ["south"], "towards-MSB", 270);
    const p2 = pf("MS", "2", "island", "DOWN", "left", ["south"], "towards-MSB", 270);
    g.MS = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("MS-main", "ticket-hall", "Egmore main hall", "north", [p1.id, p2.id], 0.05, 0.4, true, "Long-distance hall sits on the Beach end of suburban platforms."),
        access("MS-metro", "metro-link", "Egmore Metro link", "west", [p1.id, p2.id], 0.45, 0.75, true, "Metro transfer dumps mid-rake. PM peak off-load is sharp."),
      ],
      { UP: bias(0.4, 0.4, 0.2), DOWN: bias(0.25, 0.42, 0.33) },
      "Egmore suburban faces are island-like beside the main line. Metro link is a PM magnet.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("MASS");
    const p1 = pf("MASS", "1", "bay", "TERMINATING", "left", ["west", "north"], "towards-suburb", 270);
    const p2 = pf("MASS", "2", "bay", "DOWN", "left", ["west"], "towards-suburb", 270);
    const p3 = pf("MASS", "3", "bay", "DOWN", "left", ["north"], "towards-suburb", 270);
    const p4 = pf("MASS", "4", "side", "UP", "left", ["west", "north"], "towards-suburb", 270);
    g.MASS = geo(
      st, "at-grade",
      [p1, p2, p3, p4],
      [
        access("MASS-mmc", "ticket-hall", "MMC / suburban concourse", "west", [p1.id, p2.id, p3.id], 0.0, 0.42, true, "Western MMC concourse overloads origin-end cars 1–4 on DOWN departures."),
        access("MASS-park", "FOB", "Park Town FOB", "east", [p2.id, p3.id, p4.id], 0.55, 0.9, true, "Park Town FOB is the opposite end — feeds rear on DOWN, front on UP arrivals."),
        access("MASS-metro", "metro-link", "Central Metro", "west", [p1.id, p2.id], 0.1, 0.45, true, "Metro dump coincides with MMC concourse."),
      ],
      { DOWN: bias(0.5, 0.3, 0.2), UP: bias(0.22, 0.38, 0.4) },
      "Primary west/north suburban terminal. MMC west vs Park Town east is the whole boarding story. Do not treat as Chennai Central long-distance (MAS).",
      "high",
      { UP: "4", DOWN: "2", TERMINATING: "1" },
    );
  }

  {
    const st = S("BBQ");
    const p1 = pf("BBQ", "1", "island", "UP", "right", ["west", "north"], "towards-MASS", 250);
    const p2 = pf("BBQ", "2", "island", "DOWN", "left", ["west"], "towards-MASS", 250);
    const p3 = pf("BBQ", "3", "side", "DOWN", "left", ["north"], "towards-MASS", 250);
    g.BBQ = geo(
      st, "at-grade",
      [p1, p2, p3],
      [
        access("BBQ-fob", "FOB", "Basin Bridge FOB", "south", [p1.id, p2.id, p3.id], 0.25, 0.5, true, "FOB slightly city-side. West DOWN and North DOWN split after the junction."),
      ],
      { UP: bias(0.38, 0.4, 0.22), DOWN: bias(0.28, 0.44, 0.28) },
      "Diamond junction. West keeps toward Vyasarpadi; North peels toward Korukkupet. Short dwell, through-crowd.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("STM");
    const p1 = pf("STM", "1", "side", "UP", "left", ["south"], "towards-MSB", 270);
    const p2 = pf("STM", "2", "side", "DOWN", "left", ["south"], "towards-MSB", 270);
    const p3 = pf("STM", "3", "elevated-side", "UP", "left", ["mrts"], "towards-MSB", 210);
    const p4 = pf("STM", "4", "elevated-side", "DOWN", "left", ["mrts"], "towards-MSB", 210);
    g.STM = geo(
      st, "mixed",
      [p1, p2, p3, p4],
      [
        access("STM-gst", "FOB", "GST Road FOB", "east", [p1.id, p2.id], 0.3, 0.55, true, "GST-road FOB is the suburban peak entry. Mid cars."),
        access("STM-metro", "metro-link", "St. Thomas Mount Metro (Green/Red)", "west", [p1.id, p2.id, p3.id], 0.15, 0.45, true, "Metro interchange badge only — we do not track Metro trains. Dump is city-third on suburban."),
        access("STM-mrts", "street-gate", "MRTS elevated concourse", "south", [p3.id, p4.id], 0.2, 0.5, true, "MRTS level is a different plane. Doors left. Transfer to suburban is a long walk — people cluster near the transfer stair."),
      ],
      { UP: bias(0.4, 0.38, 0.22), DOWN: bias(0.26, 0.44, 0.3) },
      "Three-level node: suburban at-grade, MRTS elevated, Metro below/beside. Doors left on suburban side platforms and MRTS. Metro is an interchange badge only.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("GDY");
    const p1 = pf("GDY", "1", "island", "UP", "right", ["south"], "towards-MSB", 270);
    const p2 = pf("GDY", "2", "island", "DOWN", "left", ["south"], "towards-MSB", 270);
    g.GDY = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("GDY-race", "FOB", "Race Course / GST FOB", "east", [p1.id, p2.id], 0.35, 0.6, true, "Guindy GST + metro dump is mid-platform. Airport-bound passengers ride through to TLM/MN."),
        access("GDY-metro", "metro-link", "Guindy Metro", "east", [p1.id, p2.id], 0.4, 0.65, true, "Blue Line transfer."),
      ],
      { UP: bias(0.34, 0.44, 0.22), DOWN: bias(0.24, 0.46, 0.3) },
      "Busy island. Metro + GST means mid-rake heat both directions. Kathipara office peak is AM DOWN / PM UP.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("MBM");
    const p1 = pf("MBM", "1", "side", "UP", "left", ["south"], "towards-MSB", 250);
    const p2 = pf("MBM", "2", "side", "DOWN", "left", ["south"], "towards-MSB", 250);
    g.MBM = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("MBM-ranganathan", "FOB", "Ranganathan Street / market FOB", "east", [p1.id, p2.id], 0.2, 0.5, true, "T. Nagar market FOB is the story. Evening UP is vicious on cars nearest the stair."),
        access("MBM-west", "street-gate", "West Mambalam gate", "west", [p1.id, p2.id], 0.55, 0.85, false, "Residential west gate, off-peak."),
      ],
      { UP: bias(0.48, 0.34, 0.18), DOWN: bias(0.22, 0.4, 0.38) },
      "T. Nagar retail peak. UP evenings: front/mid from the market FOB. Ladies cars fill early.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("TBM");
    const p1 = pf("TBM", "1", "side", "UP", "left", ["south"], "towards-MSB", 280);
    const p2 = pf("TBM", "2", "island", "DOWN", "right", ["south"], "towards-MSB", 280);
    const p3 = pf("TBM", "3", "island", "BOTH", "left", ["south"], "towards-MSB", 280);
    const p4 = pf("TBM", "4", "bay", "TERMINATING", "left", ["south"], "towards-MSB", 280);
    g.TBM = geo(
      st, "at-grade",
      [p1, p2, p3, p4],
      [
        access("TBM-east", "FOB", "GST Road / east FOB + bus stand", "east", [p1.id, p2.id, p3.id], 0.25, 0.55, true, "GST-road / bus-stand east FOB is the dominant peak entry. Dumps mid on through platforms."),
        access("TBM-west", "FOB", "West Tambaram FOB", "west", [p1.id, p2.id, p4.id], 0.55, 0.85, false, "West residential FOB feeds the suburb third — used by locals, not mofussil bus passengers."),
        access("TBM-concourse", "ticket-hall", "Tambaram suburban concourse", "east", [p3.id, p4.id], 0.1, 0.4, true, "Terminating bays: concourse toward the Beach-end of the rake."),
      ],
      { UP: bias(0.36, 0.42, 0.22), DOWN: bias(0.3, 0.44, 0.26) },
      "Major terminal + through station. East GST / bus stand vs west neighbourhood is the split. PF1 UP to Beach, PF2/3 through toward CGL, bays for shorts.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "4" },
    );
  }

  {
    const st = S("CMP");
    const p1 = pf("CMP", "1", "side", "UP", "left", ["south"], "towards-MSB", 270);
    const p2 = pf("CMP", "2", "side", "DOWN", "left", ["south"], "towards-MSB", 270);
    g.CMP = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("CMP-east", "FOB", "Chromepet east / GST FOB", "east", [p1.id, p2.id], 0.32, 0.58, true, "Pallavaram→Chromepet: east FOB dumps mid. MIT / GST bus passengers dominate."),
        access("CMP-west", "street-gate", "Hasthinapuram west gate", "west", [p1.id, p2.id], 0.6, 0.85, false, "West gate is a secondary residential feed."),
      ],
      { UP: bias(0.3, 0.46, 0.24), DOWN: bias(0.24, 0.48, 0.28) },
      "This 12-car DOWN at Chromepet: mid cars 5–8 hottest. Pallavaram east FOB dumps into mid; ladies block is 5–7.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("PV");
    const p1 = pf("PV", "1", "side", "UP", "left", ["south"], "towards-MSB", 270);
    const p2 = pf("PV", "2", "side", "DOWN", "left", ["south"], "towards-MSB", 270);
    g.PV = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("PV-east", "FOB", "Pallavaram east FOB / GST", "east", [p1.id, p2.id], 0.3, 0.55, true, "East FOB is the Chromepet-bound dump. Cantonment west is quieter."),
        access("PV-canton", "street-gate", "Cantonment west", "west", [p1.id, p2.id], 0.55, 0.8, false, "Cantonment side."),
      ],
      { UP: bias(0.32, 0.44, 0.24), DOWN: bias(0.22, 0.48, 0.3) },
      "East GST FOB → mid cars. A DOWN train that just left Pallavaram is already mid-heavy before Chromepet.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("AVD");
    const p1 = pf("AVD", "1", "side", "UP", "left", ["west"], "towards-MASS", 270);
    const p2 = pf("AVD", "2", "island", "DOWN", "right", ["west"], "towards-MASS", 270);
    const p3 = pf("AVD", "3", "bay", "TERMINATING", "left", ["west"], "towards-MASS", 250);
    g.AVD = geo(
      st, "at-grade",
      [p1, p2, p3],
      [
        access("AVD-east", "FOB", "Avadi market / east FOB", "east", [p1.id, p2.id], 0.25, 0.5, true, "Market FOB city-side. AVADI is a turnback — shorts originate here."),
        access("AVD-depot", "street-gate", "Avadi depot / west", "west", [p2.id, p3.id], 0.6, 0.9, false, "Depot-end gate for terminating rakes."),
      ],
      { UP: bias(0.44, 0.36, 0.2), DOWN: bias(0.28, 0.4, 0.32) },
      "Turnback + through. AM UP toward Central is the crush; origin bias on Avadi starts is front-heavy from the market FOB.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "3" },
    );
  }

  {
    const st = S("PER");
    const p1 = pf("PER", "1", "side", "UP", "left", ["west"], "towards-MASS", 250);
    const p2 = pf("PER", "2", "side", "DOWN", "left", ["west"], "towards-MASS", 250);
    g.PER = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("PER-main", "FOB", "Perambur market FOB", "south", [p1.id, p2.id], 0.28, 0.52, true, "Perambur bazaar FOB, slightly city-side."),
        access("PER-icf", "street-gate", "ICF / north gate", "north", [p1.id, p2.id], 0.6, 0.85, false, "ICF worker peak uses the far gate."),
      ],
      { UP: bias(0.4, 0.4, 0.2), DOWN: bias(0.24, 0.42, 0.34) },
      "Workshop towns have a two-gate split: bazaar vs ICF. Ladies cars take the school/college share at Hindu College later, not here.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("VLK");
    const p1 = pf("VLK", "1", "side", "UP", "left", ["west"], "towards-MASS", 250);
    const p2 = pf("VLK", "2", "side", "DOWN", "left", ["west"], "towards-MASS", 250);
    g.VLK = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("VLK-fob", "FOB", "Villivakkam FOB", "south", [p1.id, p2.id], 0.35, 0.58, true, "Single dominant FOB. Mid bias."),
      ],
      { UP: bias(0.34, 0.44, 0.22), DOWN: bias(0.24, 0.46, 0.3) },
      "Straightforward 2-platform halt. FOB mid-city third.",
      "medium",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("ABU");
    const p1 = pf("ABU", "1", "side", "UP", "left", ["west"], "towards-MASS", 260);
    const p2 = pf("ABU", "2", "side", "DOWN", "left", ["west"], "towards-MASS", 260);
    g.ABU = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("ABU-fob", "FOB", "Ambattur estate / station FOB", "south", [p1.id, p2.id], 0.3, 0.55, true, "Estate + bus stand on the south. AM UP industrial load."),
        access("ABU-north", "street-gate", "Ambattur OT north", "north", [p1.id, p2.id], 0.55, 0.8, false, "Town-side north gate."),
      ],
      { UP: bias(0.38, 0.42, 0.2), DOWN: bias(0.26, 0.44, 0.3) },
      "Industrial AM UP. Estate gate = mid cars.",
      "medium",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("TRL");
    const p1 = pf("TRL", "1", "side", "UP", "left", ["west"], "towards-MASS", 270);
    const p2 = pf("TRL", "2", "island", "DOWN", "right", ["west"], "towards-MASS", 270);
    const p3 = pf("TRL", "3", "bay", "TERMINATING", "left", ["west"], "towards-MASS", 250);
    g.TRL = geo(
      st, "at-grade",
      [p1, p2, p3],
      [
        access("TRL-east", "FOB", "Tiruvallur east / bus FOB", "east", [p1.id, p2.id], 0.22, 0.5, true, "Town + bus stand on the Chennai side."),
        access("TRL-west", "street-gate", "West gate toward Arakkonam", "west", [p2.id, p3.id], 0.6, 0.88, false, "Through passengers toward AJJ use the west end."),
      ],
      { UP: bias(0.44, 0.36, 0.2), DOWN: bias(0.28, 0.4, 0.32) },
      "NSG-2 terminal for many MASS–TRL EMUs. Origin bias on UP starts is front/mid from the east FOB.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "3" },
    );
  }

  {
    const st = S("AJJ");
    const p1 = pf("AJJ", "1", "side", "UP", "left", ["west"], "towards-MASS", 280);
    const p2 = pf("AJJ", "2", "island", "DOWN", "right", ["west"], "towards-MASS", 280);
    const p3 = pf("AJJ", "3", "bay", "TERMINATING", "left", ["west"], "towards-MASS", 270);
    g.AJJ = geo(
      st, "at-grade",
      [p1, p2, p3],
      [
        access("AJJ-concourse", "ticket-hall", "Arakkonam junction concourse", "south", [p1.id, p2.id, p3.id], 0.1, 0.45, true, "Junction concourse on the Chennai-end of suburban faces."),
        access("AJJ-jolarpet", "FOB", "Jolarpet / west FOB", "west", [p2.id], 0.65, 0.95, false, "Long-distance west FOB. Locals alight here to change."),
      ],
      { UP: bias(0.46, 0.34, 0.2), DOWN: bias(0.3, 0.4, 0.3) },
      "Junction + suburban terminal. Most EMUs turn. Origin-end cars fill from the concourse.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "3" },
    );
  }

  {
    const st = S("VLCY");
    const p1 = pf("VLCY", "1", "elevated-side", "UP", "left", ["mrts"], "towards-MSB", 210);
    const p2 = pf("VLCY", "2", "elevated-side", "DOWN", "left", ["mrts"], "towards-MSB", 210);
    g.VLCY = geo(
      st, "elevated",
      [p1, p2],
      [
        access("VLCY-main", "ticket-hall", "Velachery bus / Vijayanagar entry", "south", [p1.id, p2.id], 0.55, 0.95, true, "Single-end bias is severe. The bus-stand / Vijayanagar stair sits at one end of the viaduct — almost everyone boards the same third."),
      ],
      { UP: bias(0.22, 0.3, 0.48), DOWN: bias(0.48, 0.32, 0.2) },
      "Former terminal, now through to STM. The single stair is the product. UP toward Beach fills the rear (stair end); DOWN toward STM fills the front. Doors left both ways.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("TYMR");
    const p1 = pf("TYMR", "1", "elevated-side", "UP", "left", ["mrts"], "towards-MSB", 200);
    const p2 = pf("TYMR", "2", "elevated-side", "DOWN", "left", ["mrts"], "towards-MSB", 200);
    g.TYMR = geo(
      st, "elevated",
      [p1, p2],
      [
        access("TYMR-stair", "street-gate", "Tiruvanmiyur beach / ECR stair", "east", [p1.id, p2.id], 0.15, 0.45, true, "East stair toward ECR. Stop-board toward Beach puts this stair near the rear of a DOWN train."),
      ],
      { UP: bias(0.42, 0.36, 0.22), DOWN: bias(0.22, 0.36, 0.42) },
      "At Tiruvanmiyur MRTS both directions open left. Single side access → cars nearest the stair fill first (rear toward Beach on DOWN, front toward Beach on UP).",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("MTMY");
    const p1 = pf("MTMY", "1", "elevated-side", "UP", "left", ["mrts"], "towards-MSB", 200);
    const p2 = pf("MTMY", "2", "elevated-side", "DOWN", "left", ["mrts"], "towards-MSB", 200);
    g.MTMY = geo(
      st, "elevated",
      [p1, p2],
      [
        access("MTMY-kapaleeswarar", "street-gate", "Mylapore / Kapaleeswarar stair", "west", [p1.id, p2.id], 0.3, 0.55, true, "Temple / Mada street crowd. Mid bias. Very heavy on festival evenings."),
      ],
      { UP: bias(0.34, 0.44, 0.22), DOWN: bias(0.26, 0.46, 0.28) },
      "Thirumayilai (Mylapore). Doors left. Peak is cultural + office, not industrial.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("MCPT");
    const p1 = pf("MCPT", "1", "elevated-side", "UP", "left", ["mrts"], "towards-MSB", 200);
    const p2 = pf("MCPT", "2", "elevated-side", "DOWN", "left", ["mrts"], "towards-MSB", 200);
    g.MCPT = geo(
      st, "elevated",
      [p1, p2],
      [
        access("MCPT-stair", "street-gate", "Chintadripet street stair", "west", [p1.id, p2.id], 0.25, 0.5, true, "Standard MRTS wiki layout: side platforms, doors left both directions."),
      ],
      { UP: bias(0.38, 0.4, 0.22), DOWN: bias(0.24, 0.42, 0.34) },
      "Chintadripet: elevated side platforms, doors open left in both directions. Single-side access.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("ENR");
    const p1 = pf("ENR", "1", "side", "UP", "left", ["north"], "towards-MASS", 250);
    const p2 = pf("ENR", "2", "side", "DOWN", "left", ["north"], "towards-MASS", 250);
    g.ENR = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("ENR-fob", "FOB", "Ennore FOB / town", "west", [p1.id, p2.id], 0.3, 0.55, true, "Town + port worker mix. North line headways are wide so each train loads harder."),
      ],
      { UP: bias(0.4, 0.38, 0.22), DOWN: bias(0.26, 0.42, 0.32) },
      "Port / industrial. AM UP toward Central is the peak.",
      "medium",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("TVT");
    const p1 = pf("TVT", "1", "side", "UP", "left", ["north"], "towards-MASS", 250);
    const p2 = pf("TVT", "2", "side", "DOWN", "left", ["north"], "towards-MASS", 250);
    g.TVT = geo(
      st, "at-grade",
      [p1, p2],
      [
        access("TVT-fob", "FOB", "Tiruvottiyur market FOB", "west", [p1.id, p2.id], 0.28, 0.52, true, "Market FOB city-side. Dense halt on the north line."),
      ],
      { UP: bias(0.42, 0.38, 0.2), DOWN: bias(0.24, 0.42, 0.34) },
      "Tiruvottiyur is the north-line Mambalam: market + density. UP AM crush.",
      "high",
      { UP: "1", DOWN: "2" },
    );
  }

  {
    const st = S("GPD");
    const p1 = pf("GPD", "1", "side", "UP", "left", ["north"], "towards-MASS", 270);
    const p2 = pf("GPD", "2", "side", "DOWN", "left", ["north"], "towards-MASS", 270);
    const p3 = pf("GPD", "3", "bay", "TERMINATING", "left", ["north"], "towards-MASS", 250);
    g.GPD = geo(
      st, "at-grade",
      [p1, p2, p3],
      [
        access("GPD-town", "ticket-hall", "Gummidipoondi town / bus", "east", [p1.id, p2.id, p3.id], 0.15, 0.5, true, "EMU suburban typically ends GPD. Concourse toward the Chennai-end of the rake on originating UP."),
      ],
      { UP: bias(0.48, 0.32, 0.2), DOWN: bias(0.3, 0.4, 0.3) },
      "Primary north-line turnback. Originating UP trains: cars 1–4 from the town concourse.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "3" },
    );
  }

  {
    const st = S("CGL");
    const p1 = pf("CGL", "1", "side", "UP", "left", ["south"], "towards-MSB", 280);
    const p2 = pf("CGL", "2", "island", "DOWN", "right", ["south"], "towards-MSB", 280);
    const p3 = pf("CGL", "3", "bay", "TERMINATING", "left", ["south"], "towards-MSB", 270);
    g.CGL = geo(
      st, "at-grade",
      [p1, p2, p3],
      [
        access("CGL-concourse", "ticket-hall", "Chengalpattu junction concourse", "east", [p1.id, p2.id, p3.id], 0.1, 0.45, true, "Junction concourse on the Chennai side. EMUs to Beach originate here."),
        access("CGL-bus", "bus-interchange", "CGL bus stand link", "east", [p1.id, p3.id], 0.2, 0.5, true, "Mofussil bus interchange feeds the same third."),
      ],
      { UP: bias(0.5, 0.32, 0.18), DOWN: bias(0.3, 0.4, 0.3) },
      "Major south-line terminal. Originating UP 12-car: cars 1–4 + ladies 5–6 from the concourse. Through trains toward Villupuram are not modelled as first-class objects.",
      "high",
      { UP: "1", DOWN: "2", TERMINATING: "3" },
    );
  }

  return g;
}

const AUTHORED = authored();

const CACHE = new Map<string, StationGeometry>();

export function geometryFor(code: string): StationGeometry | undefined {
  const st = stationOf(code);
  if (!st) return undefined;
  const hit = CACHE.get(st.code);
  if (hit) return hit;
  const g = AUTHORED[st.code] ?? inferredFor(st);
  CACHE.set(st.code, g);
  return g;
}

export function allGeometries(): StationGeometry[] {
  return STATIONS.map((s) => geometryFor(s.code)!);
}

export function isAuthored(code: string): boolean {
  return AUTHORED_CODES.has(code);
}

export function defaultPlatform(code: string, dir: Direction | "TERMINATING"): string {
  const g = geometryFor(code);
  if (!g) return "1";
  if (dir === "TERMINATING") return g.defaultPlatformByDirection.TERMINATING ?? g.defaultPlatformByDirection.DOWN;
  return g.defaultPlatformByDirection[dir] ?? "1";
}
