import type { CarClass, CarType, RakeCar, RakeTemplate } from "../lib/transit/types.ts";

const CAR_M = 23;

function car(
  index: number,
  type: CarType,
  cls: CarClass,
  doorCountPerSide: number,
  seated: number,
  standing: number,
): RakeCar {
  return { index, type, class: cls, doorCountPerSide, seated, standing };
}

function template(
  id: string,
  name: string,
  isAC: boolean,
  cars: RakeCar[],
): RakeTemplate {
  return {
    id,
    name,
    isAC,
    carCount: cars.length,
    rakeLengthMeters: Math.round(cars.length * CAR_M),
    cars,
  };
}

/** 12-car non-AC EMU — current default on South / West / North (2025 12-car upgrade).
 *  Ladies block mid-rake per 2023 Chennai division policy (cars 5–6, plus composites). */
export const EMU_12 = template("emu-12", "12-car non-AC EMU", false, [
  car(1, "DMC", "GEN", 3, 78, 260),
  car(2, "TC", "FC_LADIES_COMPOSITE", 4, 96, 240),
  car(3, "MC", "GEN", 4, 96, 300),
  car(4, "TC", "GEN", 4, 96, 300),
  car(5, "TC", "LADIES", 4, 96, 260),
  car(6, "TC", "FC_LADIES_COMPOSITE", 4, 96, 240),
  car(7, "NDMC", "GEN", 4, 96, 300),
  car(8, "TC", "GEN", 4, 96, 300),
  car(9, "TC", "GEN", 4, 96, 300),
  car(10, "MC", "GEN", 4, 96, 300),
  car(11, "TC", "FC_LADIES_COMPOSITE", 4, 96, 240),
  car(12, "DMC", "GEN", 3, 78, 260),
]);

/** 9-car non-AC EMU — MRTS and residual rakes. */
export const EMU_9 = template("emu-9", "9-car non-AC EMU", false, [
  car(1, "DMC", "GEN", 3, 78, 240),
  car(2, "TC", "FC_LADIES_COMPOSITE", 4, 96, 220),
  car(3, "MC", "GEN", 4, 96, 280),
  car(4, "TC", "LADIES", 4, 96, 240),
  car(5, "TC", "FC_LADIES_COMPOSITE", 4, 96, 220),
  car(6, "MC", "GEN", 4, 96, 280),
  car(7, "TC", "GEN", 4, 96, 280),
  car(8, "TC", "FC_LADIES_COMPOSITE", 4, 96, 220),
  car(9, "DMC", "GEN", 3, 78, 240),
]);

/** 12-car ICF AC EMU — Beach–CGL 490xx and Central–AJJ AC locals. Cannot run on MRTS. */
export const AC_EMU_12 = template("ac-emu-12", "12-car AC EMU (ICF)", true, [
  car(1, "DMC", "AC_GEN", 3, 78, 160),
  car(2, "TC", "AC_GEN", 4, 96, 180),
  car(3, "MC", "AC_GEN", 4, 96, 180),
  car(4, "TC", "AC_GEN", 4, 96, 180),
  car(5, "NDMC", "AC_LADIES", 4, 96, 160),
  car(6, "TC", "AC_LADIES", 4, 96, 160),
  car(7, "MC", "AC_GEN", 4, 96, 180),
  car(8, "TC", "AC_GEN", 4, 96, 180),
  car(9, "TC", "AC_GEN", 4, 96, 180),
  car(10, "MC", "AC_GEN", 4, 96, 180),
  car(11, "TC", "AC_GEN", 4, 96, 180),
  car(12, "DMC", "AC_GEN", 3, 78, 160),
]);

/** MEMU 8-car — no first class, ladies mid-rake. */
export const MEMU_8 = template("memu-8", "8-car MEMU", false, [
  car(1, "DMC", "GEN", 3, 72, 220),
  car(2, "TC", "GEN", 4, 90, 250),
  car(3, "MC", "GEN", 4, 90, 250),
  car(4, "TC", "LADIES", 4, 90, 230),
  car(5, "TC", "LADIES", 4, 90, 230),
  car(6, "MC", "GEN", 4, 90, 250),
  car(7, "TC", "GEN", 4, 90, 250),
  car(8, "DMC", "GEN", 3, 72, 220),
]);

export const RAKE_TEMPLATES: RakeTemplate[] = [EMU_12, EMU_9, AC_EMU_12, MEMU_8];

export const RAKE_BY_ID: Record<string, RakeTemplate> = Object.fromEntries(
  RAKE_TEMPLATES.map((r) => [r.id, r]),
);

export function rakeOf(id: string): RakeTemplate {
  return RAKE_BY_ID[id] ?? EMU_12;
}

export function isLadiesCar(cls: CarClass): boolean {
  return cls === "LADIES" || cls === "FC_LADIES_COMPOSITE" || cls === "AC_LADIES";
}

export function isFirstClassCar(cls: CarClass): boolean {
  return cls === "FC" || cls === "FC_LADIES_COMPOSITE";
}

export function carShortLabel(cls: CarClass): string {
  switch (cls) {
    case "LADIES":
      return "Ladies";
    case "FC_LADIES_COMPOSITE":
      return "FC / L";
    case "FC":
      return "FC";
    case "AC_GEN":
      return "AC";
    case "AC_LADIES":
      return "AC L";
    case "DISABLED":
      return "PRM";
    case "LUGGAGE_CAB":
      return "Luggage";
    default:
      return "GEN";
  }
}
