# Chennai Local Live

Live trains, platforms, rake maps, and where the crowd will actually stand — for the **Chennai Suburban Railway + MRTS** (not Chennai Metro).

Unofficial commuter tool. Platforms and occupancy are estimates. Follow station announcements.

## What you get

- Every halt on South (Beach–Tambaram–Chengalpattu, including Kilambakkam), West (Beach/MMC–Avadi–Tiruvallur–Arakkonam–Tiruttani), North (MMC/Beach–Gummidipoondi–Sullurupeta), and MRTS (Beach–Velachery–St. Thomas Mount).
- Trains as live objects: position, direction, delay, next stop, **platform**.
- Rake maps (9-car / 12-car / AC-EMU / MEMU) with ladies, first-class, AC, DMC called out.
- Station entry-door logic: which side doors open, which FOB dumps into which third of the platform, which coaches fill first.
- Crowd-from-last-station hints (labelled **likely load**, not CCTV).

## Run

```bash
npm install
npm run seed    # writes data/*.json from the TypeScript source of truth
npm run dev     # simulator always works, even with no IR access
```

Live NTES lookups are proxied server-side (`/api/live/network`, `/api/live/station/:code`, `/api/live/train/:no`) with a 25 s cache and backoff on 403. Optional third-party key: `IR_API_KEY`. Never commit secrets.

## Data

| File | What |
| --- | --- |
| `src/data/stations.ts` | Codes, English + Tamil names, lat/lng, km, schematic x/y |
| `src/data/lines.ts` | Ordered station lists, colours, UP/DOWN labels |
| `src/data/rakes.ts` | 9-car, 12-car, AC-EMU, MEMU templates |
| `src/data/corridors.ts` | Headways + series used by the simulator |
| `src/lib/transit/geometry.ts` | Authored layouts + inferred generator |
| `data/*.json` | Seed dump (`npm run seed`) |
| `data/trainNumbers.md` | 400xx / 410xx / 43xxx / 490xx notes |

## Geometry confidence

- **high / medium** — hand-authored for MSB, MSF, MPK, MS, MASS, BBQ, STM, GDY, MBM, TBM, CMP, PV, AVD, PER, VLK, ABU, TRL, AJJ, VLCY, TYMR, MTMY, MCPT, ENR, TVT, GPD, CGL.
- **inferred** — everyone else: 2 side platforms (elevated-side on MRTS), FOB at 40% from the city-direction end, doors left, boarding bias peaked at that third. The UI shows an “inferred layout” chip so we never lie.

## Add a station

1. Append the halt to `src/data/stations.ts` and the ordered codes in `src/data/lines.ts`.
2. If you know FOB + door side, add an authored record in `src/lib/transit/geometry.ts`. Otherwise the generator fills a stub.
3. `npm run seed`.

## Defaults

- 12-car on South / West / North (2025 upgrade). MRTS 9-car.
- Ladies mid-rake per 2023 Chennai division policy, not only “2nd from each end”.
- UP = towards MSB or MASS. DOWN = towards TBM/CGL, AJJ/TRT, GPD/SPE, VLCY/STM.
- Unknown PF count → PF1 city, PF2 suburb.
- Unknown door side on at-grade side platforms → left.

## Disclaimer

Not affiliated with Indian Railways, Southern Railway, or CMRL. Crowd bars are a model. Doors and platforms change with rake length, stop-board, and the day’s working. Listen to the station.
