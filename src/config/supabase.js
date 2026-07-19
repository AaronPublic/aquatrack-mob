import { createClient } from "@supabase/supabase-js";
import { supabaseStorage } from "./supabaseStorage";

const SUPABASE_URL = "https://eivmilbjlkanxclysczl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdm1pbGJqbGthbnhjbHlzY3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1Nzg4OTYsImV4cCI6MjA5OTE1NDg5Nn0.N5mh5rXING7EbK8pOEp_czB9gsYAHtlfYvuf-33_1K0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});
