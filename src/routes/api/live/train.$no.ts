import { createFileRoute } from "@tanstack/react-router";
import { getTrainLive } from "@/lib/transit/live";

export const Route = createFileRoute("/api/live/train/$no")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const train = await getTrainLive(params.no);
        if (!train) return new Response("Unknown train", { status: 404 });
        return Response.json(train, {
          headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=20" },
        });
      },
    },
  },
});
