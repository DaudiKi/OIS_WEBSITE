// AMS backend configuration.
//
// The AMS can run in DEMO MODE: with no config below, all data is stored
// locally in the browser (localStorage) and the app is fully functional on
// static hosting. Defining window.OIS_AMS_CONFIG switches it to Supabase.
//
// To point this at a different Supabase project:
//   1. Create a Supabase project (https://supabase.com)
//   2. Run supabase/schema.sql from this repository in the SQL editor
//   3. Replace the values below
//
// The publishable key is safe to ship in client-side code — it identifies the
// project, it does not grant access. Every table has row level security, so
// what a visitor may read or write is decided by the database, not by this
// file. Never put the service_role / sb_secret_... key here: it bypasses RLS.

window.OIS_AMS_CONFIG = {
  supabaseUrl: 'https://wgncyuagmgcqrvamnwct.supabase.co',
  supabaseAnonKey: 'sb_publishable_EUBkJRL960ODdpg2_Agh6g_JAX3nMUM',
};
