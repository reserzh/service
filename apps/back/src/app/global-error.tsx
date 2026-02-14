"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans antialiased">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-3 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
