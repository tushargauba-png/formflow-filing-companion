import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Form 146 Desk — Certificates, filings & billing" },
      { name: "description", content: "Operations desk for preparing, filing and billing Form 146 certificates." },
      { property: "og:title", content: "Form 146 Desk" },
      { property: "og:description", content: "Operations desk for preparing, filing and billing Form 146 certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/dashboard" : "/auth" });
  },
  component: () => null,
});
