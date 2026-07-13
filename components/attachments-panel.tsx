"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { appendVisitAttachment, removeVisitAttachment } from "@/lib/crm/actions";

const BUCKET = "visit-attachments";

function fileLabel(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/^\d+-/, "");
}

/**
 * Upload / list / delete attachments on a visit report. Files go to the
 * public `visit-attachments` bucket; paths persist on the visit row.
 */
export function AttachmentsPanel({
  visitId,
  attachments,
}: {
  visitId: string;
  attachments: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const supabase = createClient();

  const publicUrl = (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${visitId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
        if (uploadError) {
          setError(
            uploadError.message.toLowerCase().includes("bucket")
              ? "Storage bucket missing — run supabase/migrations/0002_attachments.sql in the SQL editor first."
              : `Upload failed: ${uploadError.message}`,
          );
          return;
        }
        const { error: dbError } = await appendVisitAttachment(visitId, path);
        if (dbError) {
          setError(dbError);
          return;
        }
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onDelete(path: string) {
    setBusy(true);
    setError(null);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      const { error: dbError } = await removeVisitAttachment(visitId, path);
      if (dbError) {
        setError(dbError);
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Attachments{" "}
          <span className="font-normal text-slate-400">
            (photos, datasheets, P&amp;IDs)
          </span>
        </h2>
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          {busy ? "Uploading…" : "+ Add files"}
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {attachments.length === 0 ? (
        <p className="text-sm text-slate-500">No attachments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {attachments.map((path) => (
            <li key={path} className="flex items-center justify-between gap-3 py-2">
              <a
                href={publicUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium text-indigo-700 hover:underline"
              >
                {fileLabel(path)}
              </a>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(path)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
