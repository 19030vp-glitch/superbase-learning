import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 flex h-14 items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <span className="font-bold text-lg">SayHi</span>
                        </Link>
                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                            <Link
                                href="/dashboard"
                                className="transition-colors hover:text-foreground/80 text-muted-foreground"
                            >
                                Overview
                            </Link>
                            <Link
                                href="/dashboard/chat"
                                className="transition-colors hover:text-foreground/80 text-muted-foreground"
                            >
                                Chat
                            </Link>
                            <Link
                                href="/dashboard/profile"
                                className="transition-colors hover:text-foreground/80 text-muted-foreground"
                            >
                                Profile
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <UserNav user={user} />
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 max-w-5xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
