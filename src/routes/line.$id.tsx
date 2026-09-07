import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { LineStrip } from "@/components/line-strip";
import { TrainList } from "@/components/network-map";
import { LINES, LINE_BY_ID } from "@/data/lines";
import { stationsOn } from "@/lib/transit/catalog";
import { useLiveNetwork } from "@/lib/transit/use-live";
import type { LineId } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/line/$id")({ component: LinePage });

function LinePage() {
  const { id } = Route.useParams();
  const line = LINE_BY_ID[id as LineId];
  if (!line) throw notFound();
  const { snap } = useLiveNetwork();
  const nav = useNavigate();
  const trains = (snap?.trains ?? []).filter((t) => t.lineId === line.id);
  const sts = stationsOn(line.id);

  return (
    <AppShell source={snap?.source}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {LINES.map((l) => (
            <Link
              key={l.id}
              to="/line/$id"
              params={{ id: l.id }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs ring-1 ring-border",
                l.id === line.id ? "text-bg" : "text-muted",
              )}
              style={l.id === line.id ? { background: l.colour } : undefined}
            >
              {l.name}
            </Link>
          ))}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{line.name}</h1>
        <p className="text-sm text-muted">
          {line.nameTa} · {sts.length} stations · default {line.defaultCarCount}-car · UP {line.upLabel} · DOWN {line.downLabel}
        </p>
        <LineStrip lineId={line.id} trains={trains} />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ol className="columns-1 gap-x-8 sm:columns-2">
            {sts.map((s, i) => (
              <li key={s.code} className="mb-1 break-inside-avoid">
                <Link
                  to="/station/$code"
                  params={{ code: s.code }}
                  className="flex items-baseline justify-between gap-3 rounded-sm px-2 py-1.5 hover:bg-elevated"
                >
                  <span className="text-sm">
                    <span className="mr-2 font-mono text-xs tabular text-subtle">{String(i).padStart(2, "0")}</span>
                    {s.name}
                    <span className="ml-2 text-xs text-muted">{s.nameTa}</span>
                  </span>
                  <span className="font-mono text-xs text-muted">{s.code}</span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-wider text-muted">
              {trains.length} trains on this line
            </div>
            <TrainList
              trains={trains}
              onSelect={(t) => nav({ to: "/train/$number", params: { number: t.trainNumber } })}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
