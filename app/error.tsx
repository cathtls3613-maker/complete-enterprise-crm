"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-rose-800">Something went wrong</p>
      <p className="max-w-md text-sm text-rose-700">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
      >
        Try again
      </button>
    </div>
  );
}
