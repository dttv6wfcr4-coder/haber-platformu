import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const SELECT =
  "id,title_tr,summary_tr,image_url,original_url,published_at,categories(slug,name_tr),sources(name)";
