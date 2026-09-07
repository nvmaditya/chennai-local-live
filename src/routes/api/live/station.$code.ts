import { createFileRoute } from "@tanstack/react-router";
import { getStationLive } from "@/lib/transit/live";

export const Route = createFileRoute("/api/live/station/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const data = await getStationLive(params.code.toUpperCase());
        if (!data) return new Response("Unknown station", { status: 404 });
        return Response.json(data, {
          headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=20" },
        });
      },
    },
  },
});
