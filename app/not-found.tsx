import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <p className="text-sm font-medium text-slate-700">
        This record doesn&apos;t exist — it may have been deleted.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
