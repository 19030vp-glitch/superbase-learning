import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">SayHi</span>
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? (
              <Button asChild variant="default">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-4 flex flex-col items-center gap-6 py-20 md:py-32">
          <div className="flex max-w-[800px] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Modern Chat for Everyone
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
              Connect instantly with friends and colleagues. Simple, secure, and built for the modern web.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {user ? (
              <Button size="lg" asChild className="h-12 px-8">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="h-12 px-8">
                  <Link href="/signup">Start Chatting Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8">
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 border-y py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-background shadow-sm border-none">
                <CardHeader>
                  <CardTitle>Real-time Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    Experience blink-of-an-eye message delivery with Supabase Realtime integration.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-background shadow-sm border-none">
                <CardHeader>
                  <CardTitle>Secure & Private</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    Your data is protected with enterprise-grade Row Level Security and robust authentication.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-background shadow-sm border-none">
                <CardHeader>
                  <CardTitle>Clean Interface</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    Built with Shadcn UI for a professional, accessible, and distraction-free experience.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to join our community?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create an account today and start connecting with people instantly.
          </p>
          {!user && (
            <Button size="lg" asChild className="h-12 px-8">
              <Link href="/signup">Create Free Account</Link>
            </Button>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 SayHi. Built with Next.js & Supabase.
          </p>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
