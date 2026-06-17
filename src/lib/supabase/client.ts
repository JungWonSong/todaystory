import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(
  supabaseUrl?.trim() && supabaseAnonKey?.trim(),
);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient() {
  const url = supabaseUrl?.trim();
  const anonKey = supabaseAnonKey?.trim();

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey);
  }

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    return Reflect.get(getSupabaseClient(), property, receiver);
  },
});
