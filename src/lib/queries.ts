import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export const teamsQuery = queryOptions({
  queryKey: ["teams"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("group_name", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const matchesQuery = queryOptions({
  queryKey: ["matches"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("phase", { ascending: true })
      .order("match_date", { ascending: true, nullsFirst: true })
      .order("match_order", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const playersQuery = queryOptions({
  queryKey: ["players"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("jersey_number", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const goalsQuery = queryOptions({
  queryKey: ["goals"],
  queryFn: async () => {
    const { data, error } = await supabase.from("goals").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export const awardsQuery = queryOptions({
  queryKey: ["awards"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tournament_awards")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});