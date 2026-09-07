import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="text-center">
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="mt-2 text-2xl font-semibold">No such halt</h1>
        <p className="mt-2 text-sm text-muted">That station or train is not on the suburban / MRTS network.</p>
        <Link to="/" className="mt-6 inline-block rounded-sm bg-fg px-4 py-2 text-sm text-bg">
          Network map
        </Link>
      </div>
    </main>
  );
}
