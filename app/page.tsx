import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Zap, Users, ArrowRight } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
              <MessageCircle className="size-5" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              SayHi
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-20 md:py-32">
          <div className="flex flex-col items-center text-center gap-8">
            {/* Decorative chat bubbles */}
            <div className="relative">
              <div className="absolute -top-4 -left-20 w-16 h-16 bg-violet-200 rounded-2xl rotate-12 opacity-60" />
              <div className="absolute -top-8 -right-16 w-12 h-12 bg-cyan-200 rounded-xl -rotate-12 opacity-60" />
              <div className="absolute top-20 -right-24 w-8 h-8 bg-indigo-200 rounded-lg rotate-45 opacity-60" />

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Say Hi
                </span>
                <br />
                <span className="text-gray-900">to Everyone</span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Connect with friends, family, and colleagues in real-time.
              Experience seamless messaging with our modern, secure chat platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              {user ? (
                <Button size="lg" asChild className="h-14 px-8 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                  <Link href="/dashboard">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="h-14 px-8 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                    <Link href="/signup">
                      Start Chatting Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 text-center">
              <div>
                <div className="text-3xl font-bold text-violet-600">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-indigo-600">1M+</div>
                <div className="text-sm text-muted-foreground">Messages Sent</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-cyan-600">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose <span className="text-violet-600">SayHi</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-violet-200">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Messaging</h3>
              <p className="text-muted-foreground">
                Send and receive messages instantly. No delays, no refreshing – just seamless communication.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-indigo-200">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your conversations are protected with enterprise-grade security. Your privacy is our priority.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-cyan-200">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Group Conversations</h3>
              <p className="text-muted-foreground">
                Create chat rooms for your team, friends, or community. Collaborate and connect together.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-20">
          <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 p-12 md:p-20 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10 text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Start Chatting?
              </h2>
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already enjoying seamless conversations with SayHi.
              </p>
              {!user && (
                <Button size="lg" variant="secondary" asChild className="h-14 px-8 text-lg">
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-600" />
            <span className="font-semibold text-violet-600">SayHi</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 SayHi. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
