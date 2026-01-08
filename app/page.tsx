import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-2xl flex-col gap-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Welcome to Supabase Auth
        </h1>
        <p className="text-xl text-muted-foreground">
          A secure and modern authentication system built with Next.js, Supabase, and Shadcn UI.
        </p>

        <div className="flex flex-col items-center gap-4">
          {user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg">
                Logged in as: <span className="font-semibold">{user.email}</span>
              </p>
              <form action={signOut}>
                <Button variant="destructive">Sign Out</Button>
              </form>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
