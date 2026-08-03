const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabasePromise;

async function getSupabase() {
  if (!isSupabaseConfigured) return null;

  supabasePromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(supabaseUrl, supabaseAnonKey)
  );
  return supabasePromise;
}

export async function fetchTravelCities() {
  const supabase = await getSupabase();
  if (!supabase) return { data: null, error: null };

  return supabase
    .from("travel_cities")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function createTravelCity(city) {
  const supabase = await getSupabase();
  if (!supabase) return { data: null, error: null };

  return supabase
    .from("travel_cities")
    .insert(city)
    .select("*")
    .single();
}
