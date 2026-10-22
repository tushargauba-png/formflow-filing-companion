import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => navigate({ to: data.user ? "/dashboard" : "/auth", replace: true }));
  }, [navigate]);
  return <div className="flex min-h-screen items-center justify-center font-mono text-xs text-muted-foreground">Loading Form 146 Desk…</div>;
}
