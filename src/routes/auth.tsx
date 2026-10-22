import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { denied?: boolean } =>
    search["denied"] === true || search["denied"] === "true" ? { denied: true } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Form 146 Desk" },
      { name: "description", content: "Sign in to your Form 146 operations desk." },
      { property: "og:title", content: "Sign in — Form 146 Desk" },
      { property: "og:description", content: "Sign in to your Form 146 operations desk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { denied } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function googleSignIn() {
    setBusy(true);
    try {
      // Always show Google's account chooser so a signed-in personal account isn't picked silently.
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } });
      if (result.error) throw result.error;
      if (!result.redirected) await navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in could not be started.");
    } finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-sidebar-primary">Form 146 Desk</div>
        <div>
          <h1 className="text-5xl leading-tight">Every certificate,<br />filed and billed.</h1>
          <p className="mt-6 max-w-md text-sidebar-foreground/70">
            Masters, copy-ready previews, UDIN tracking and billing exports in one ledger.
          </p>
        </div>
        <div className="font-mono text-xs text-sidebar-foreground/50">Form 145 coming next</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <h2 className="text-3xl">Sign in</h2>
          {denied && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              This account is not authorised to use Form 146 Desk. Ask the administrator to add your email.
            </p>
          )}
          <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={googleSignIn}>
            <span aria-hidden="true" className="mr-2 font-semibold">G</span> Continue with Google
          </Button>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground">Access is by invitation only.</p>
        </form>
      </div>
    </div>
  );
}
