import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const safeSupabaseUrl = supabaseUrl?.trim() || "https://example.supabase.co";
const safeSupabaseAnonKey =
  supabaseAnonKey?.trim() || "missing-supabase-anon-key";

export const hasSupabaseEnv = Boolean(
  supabaseUrl?.trim() && supabaseAnonKey?.trim(),
);

export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey);
