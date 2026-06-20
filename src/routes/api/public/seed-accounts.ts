import { createFileRoute } from "@tanstack/react-router";

// Internal email domain — users log in by username; we map to "${username}@cdia.local".
const DOMAIN = "cdia.local";

const ADMIN = { username: "only_buzy", password: "Foxy2074(" };

export const Route = createFileRoute("/api/public/seed-accounts")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { count } = await supabaseAdmin
          .from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
        return Response.json({ hasAdmin: (count ?? 0) > 0 });
      },
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const ensure = async (username: string, password: string, role: "admin") => {
          const email = `${username}@${DOMAIN}`;
          // Try to find existing user by listing (admin API has no getByEmail; list pages of 200)
          let existingId: string | null = null;
          for (let page = 1; page <= 5 && !existingId; page++) {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
            if (error) throw error;
            const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
            if (found) existingId = found.id;
            if (data.users.length < 200) break;
          }
          let userId = existingId;
          if (!userId) {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
              email, password, email_confirm: true, user_metadata: { username },
            });
            if (error) throw error;
            userId = data.user!.id;
          }
          // Upsert role
          const { error: rErr } = await supabaseAdmin
            .from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
          if (rErr) throw rErr;
          return { username, role };
        };

        try {
          const results = [];
          results.push(await ensure(ADMIN.username, ADMIN.password, "admin"));
          return Response.json({ ok: true, accounts: results });
        } catch (e: any) {
          return Response.json({ error: e?.message ?? "Error" }, { status: 500 });
        }
      },
    },
  },
});