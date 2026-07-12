import { createClient } from "@/lib/supabase/server";

// PGRST205 = table missing from schema cache, i.e. the migration in
// supabase/migrations has not been applied to this Supabase project yet.
export function isSchemaMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || (error.message ?? "").includes("schema cache");
}

export interface ListResult<T> {
  rows: T[];
  dbMissing: boolean;
  errorMessage: string | null;
}

/**
 * Run a Supabase list query and normalize the three outcomes the UI cares
 * about: data, "database not initialized yet", and any other error.
 */
export async function listQuery<T>(
  build: (
    client: Awaited<ReturnType<typeof createClient>>,
  ) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>,
): Promise<ListResult<T>> {
  const supabase = await createClient();
  const { data, error } = await build(supabase);
  if (error) {
    return {
      rows: [],
      dbMissing: isSchemaMissing(error),
      errorMessage: isSchemaMissing(error) ? null : error.message ?? "Unknown error",
    };
  }
  // Callers select the columns their T actually uses; the runtime shape is
  // narrower than the full entity type on partial selects.
  return { rows: (data as T[] | null) ?? [], dbMissing: false, errorMessage: null };
}

/**
 * Fetch a single row by id. Returns null for "not found" (including malformed
 * uuid — Postgres rejects those with 22P02, which we treat as not found).
 */
export async function getById<T>(
  table: string,
  id: string,
  select: string,
): Promise<{ row: T | null; dbMissing: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isSchemaMissing(error)) return { row: null, dbMissing: true };
    return { row: null, dbMissing: false };
  }
  return { row: data as T | null, dbMissing: false };
}
