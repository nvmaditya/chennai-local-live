import { createFileRoute } from "@tanstack/react-router";
import { getNetworkSnapshot } from "@/lib/transit/live";

export const Route = createFileRoute("/api/live/network")({
  server: {
    handlers: {
      GET: async () => {
        const snap = await getNetworkSnapshot();
        return Response.json(snap, {
          headers: { "Cache-Control": "public, max-age=15" },
        });
      },
    },
  },
});
