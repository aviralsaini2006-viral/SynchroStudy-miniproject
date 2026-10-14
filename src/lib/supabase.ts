import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta as any).env?.VITE_SUPABASE_URL;
const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = !!supabase;

export function supabaseModeLabel(): string {
  return isSupabaseConfigured ? "Supabase (configured)" : "Local demo mode";
}
