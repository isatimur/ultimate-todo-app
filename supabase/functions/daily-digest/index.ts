/* eslint-disable */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const digestApiUrl = Deno.env.get("DAILY_DIGEST_API_URL") ?? "";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Fetch all users and filter by those with daily digest enabled
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("Error fetching users:", error);
      return new Response("Failed to retrieve users", { status: 500 });
    }

    const users = data.users.filter(
      (u) => u.user_metadata?.daily_digest === true,
    );
    console.log(`Found ${users.length} users with daily digest enabled`);

    for (const user of users) {
      try {
        const res = await fetch(digestApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (!res.ok) {
          const message = await res.text();
          console.error(
            `API error for user ${user.id}: ${res.status} ${message}`,
          );
          continue;
        }

        console.log(`Successfully triggered digest for user ${user.id}`);
      } catch (err) {
        console.error(`Fetch failed for user ${user.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ processed: users.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unhandled error in daily-digest function:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
