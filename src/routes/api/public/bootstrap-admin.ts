import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { count, error } = await supabaseAdmin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ hasAdmin: (count ?? 0) > 0 });
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Email y contraseña inválidos" }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { count, error: cErr } = await supabaseAdmin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");
        if (cErr) return Response.json({ error: cErr.message }, { status: 500 });
        if ((count ?? 0) > 0) {
          return Response.json({ error: "Ya existe un administrador" }, { status: 409 });
        }

        const { data: created, error: cuErr } = await supabaseAdmin.auth.admin.createUser({
          email: parsed.data.email,
          password: parsed.data.password,
          email_confirm: true,
        });
        if (cuErr || !created.user) {
          return Response.json({ error: cuErr?.message ?? "No se pudo crear el usuario" }, { status: 500 });
        }
        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: created.user.id, role: "admin" });
        if (rErr) {
          await supabaseAdmin.auth.admin.deleteUser(created.user.id);
          return Response.json({ error: rErr.message }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});