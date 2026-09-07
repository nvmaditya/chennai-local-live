import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RakeMap } from "@/components/rake-map";
import { RAKE_TEMPLATES } from "@/data/rakes";

export const Route = createFileRoute("/coach-guide")({ component: CoachGuide });

function CoachGuide() {
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Coach guide</h1>
        <p className="mt-2 text-muted">
          Partitions here means cars in the rake, not administrative zones. Car 1 is the nominal Beach / Central originating cab. When a train reverses at a terminal the other cab leads, but car numbers stay with the physical cars.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Doors</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>MRTS elevated side platforms: doors open left in both directions (Chintadripet, Chepauk, Tiruvanmiyur pattern).</li>
            <li>At-grade island platforms: doors open right on one road and left on the other — encoded per platform, not per station.</li>
            <li>Side platforms on the city side vs suburb side change which coaches sit next to the only FOB.</li>
            <li>Bay platforms at MSB / MASS / TBM: doors usually on the concourse side only.</li>
            <li>AC EMU: automatic doors. AC stock cannot run on MRTS.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Ladies coaches (2023 policy)</h2>
          <p className="text-sm text-muted">
            Chennai division moved ladies accommodation toward a mid-rake block (around cars 4–6 on 9-car and 5–7 on 12-car), plus the older composites second from each end. Female suburban ridership is treated as roughly 25–35% and is not smeared evenly into general cars.
          </p>
        </section>

        <div className="mt-10 space-y-10">
          {RAKE_TEMPLATES.map((r) => (
            <section key={r.id} className="rounded-lg border border-border bg-surface p-4">
              <h2 className="font-semibold">{r.name}</h2>
              <p className="mb-3 text-xs text-muted">
                {r.carCount} cars · {r.rakeLengthMeters} m · {r.isAC ? "AC, automatic doors" : "non-AC, manual doors"}
              </p>
              <RakeMap rakeId={r.id} leadingCab="car1" />
            </section>
          ))}
        </div>

        <section className="mt-10 space-y-2 text-sm text-muted">
          <h2 className="text-lg font-semibold text-fg">Capacity notes</h2>
          <p>
            Seated figures follow published ICF AC-EMU numbers where known (DMC ~78, TC/MC ~96). Standing is ~2× for AC and much higher for non-AC. These feed the likely-load model; they are not weighed counts.
          </p>
        </section>
      </article>
    </AppShell>
  );
}
