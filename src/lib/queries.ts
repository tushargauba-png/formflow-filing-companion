import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormWithParties } from "./form-fields";

export const formsQuery = () =>
  queryOptions({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*, remitter:remitters(*), remittee:remittees(*)")
        .order("created_at", { ascending: false })
        .range(0, 9999);
      if (error) throw error;
      return data as unknown as FormWithParties[];
    },
  });

export const formQuery = (id: string) =>
  queryOptions({
    queryKey: ["forms", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms").select("*, remitter:remitters(*), remittee:remittees(*)").eq("id", id).single();
      if (error) throw error;
      return data as unknown as FormWithParties;
    },
  });

export const remittersQuery = () =>
  queryOptions({
    queryKey: ["remitters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("remitters").select("*").order("nickname");
      if (error) throw error;
      return data;
    },
  });

export const remitteesQuery = () =>
  queryOptions({
    queryKey: ["remittees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("remittees").select("*").order("nickname");
      if (error) throw error;
      return data;
    },
  });

export const templatesQuery = () =>
  queryOptions({
    queryKey: ["export_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("export_templates").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
