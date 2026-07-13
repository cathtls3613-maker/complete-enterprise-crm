"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthStatus() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!loaded) return <div className="ml-auto h-8 w-20" />;

  if (!email) {
    return (
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Link
          href="/login"
          className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={async () => {
          await createClient().auth.signOut();
          router.push("/?toast=Signed%20out");
          router.refresh();
        }}
        className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Sign out
      </button>
    </div>
  );
}
