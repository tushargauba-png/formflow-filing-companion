import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function googleSignIn() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
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
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setMode("in");
      }
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
          <h2 className="text-3xl">{mode === "in" ? "Sign in" : "Create account"}</h2>
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
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
          <Button variant="link" type="button" className="px-0 text-sm text-muted-foreground"
            onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "No account yet? Create one" : "Have an account? Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
