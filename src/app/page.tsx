import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight } from "lucide-react";
import { getOptionalAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getOptionalAuth();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">FieldService Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Start free trial</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Run your service business
            <br />
            <span className="text-primary">like a pro</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Schedule, dispatch, invoice, and get paid — all in one modern platform
            built for HVAC, plumbing, electrical, and service companies.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            14-day free trial. No credit card required.
          </p>
        </div>
      </main>
    </div>
  );
}
