"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Shows the one-shot success toast passed via the `?toast=` search param. */
export function Toast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const message = searchParams.get("toast");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 3500);
    const clean = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("toast");
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    }, 4000);
    return () => {
      clearTimeout(hide);
      clearTimeout(clean);
    };
  }, [message, pathname, router, searchParams]);

  if (!message || !visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
      ✓ {message}
    </div>
  );
}
