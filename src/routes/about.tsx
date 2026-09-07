import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">About</h1>
        <p className="mt-2 text-muted">
          Chennai Local Live is an unofficial commuter tool for the Chennai Suburban Railway and MRTS. It is not Indian Railways, Southern Railway, or Chennai Metro Rail Ltd.
        </p>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">What this is</h2>
          <p className="text-sm text-muted">
            A spatial operations view: every halt on South, West, North and MRTS; every modelled train as a live object with platform and rake; station entry-door logic; and a crowd-from-last-station hint. It is not a pretty timetable and it is not CCTV.
          </p>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">Data sources</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Station lists, codes and kilometres compiled from Southern Railway / MAS division lists, India Rail Info, and public maps. Kilambakkam (KLBA) is included as a halt on the Beach–CGL section; the official code is not yet stable.</li>
            <li>Live running: NTES-style mobile endpoints, proxied server-side with a 25 s cache and backoff on 403. Optional RapidAPI key via IR_API_KEY. If official endpoints are blocked, the schedule simulator is the source of truth.</li>
            <li>Platform numbers: NTES is incomplete for suburban halts. Geometry defaults always overlay; a live PF, when present, wins and is marked “changed”.</li>
            <li>Rake templates: 9-car MRTS, 12-car non-AC (2025 upgrade default), 12-car ICF AC EMU, 8-car MEMU.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">Geometry confidence</h2>
          <p className="text-sm text-muted">
            Authored stations (MSB, MSF, MPK, MS, MASS, BBQ, STM, GDY, MBM, TBM, CMP, PV, AVD, PER, VLK, ABU, TRL, AJJ, VLCY, TYMR, MTMY, MCPT, ENR, TVT, GPD, CGL) were hand-written from published layouts plus commuter knowledge. Everything else is generated: 2 side platforms (or elevated side on MRTS), one FOB at 40% from the city-direction end, doors left, boarding bias peaked at that third, confidence <span className="text-delay">inferred</span>. We never present inferred layouts as official.
          </p>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">Crowd model</h2>
          <p className="text-sm text-muted">
            Origin terminal boarding bias → subtract alighters in cars aligned with each halt’s exit dump → add boarders at entry dumps → isolate ladies / first-class / AC → slight DMC-end boost where the only stair is at the starter end → 1-car neighbour smooth. Time bands: AM 07–10, PM 16:30–20, otherwise mid or late. Output is a hint labelled “likely load”.
          </p>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">UP / DOWN</h2>
          <p className="text-sm text-muted">
            UP = towards MSB or MASS. DOWN = towards TBM/CGL, AJJ/TRT, GPD/SPE, VLCY/STM. Default 12-car on South/West/North; MRTS 9-car.
          </p>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">Add a station</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Add the halt to <code className="font-mono text-fg">src/data/stations.ts</code> and the ordered codes in <code className="font-mono text-fg">src/data/lines.ts</code>.</li>
            <li>If you know the FOB and door side, add an authored record in <code className="font-mono text-fg">src/lib/transit/geometry.ts</code>. Otherwise the inferred generator will fill a 2-platform stub.</li>
            <li>Run <code className="font-mono text-fg">npm run seed</code> to refresh <code className="font-mono text-fg">data/*.json</code>.</li>
          </ol>
        </section>

        <p className="mt-10 text-xs text-subtle">
          Follow station announcements and the guard. Do not board a ladies or first-class coach you are not entitled to use.
        </p>
      </article>
    </AppShell>
  );
}
