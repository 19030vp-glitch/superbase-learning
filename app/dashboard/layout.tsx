import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { MessageCircle, LayoutDashboard, MessageSquare, User } from "lucide-react";

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
        <div className="flex min-h-screen flex-col bg-gray-50/50">
            <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between py-4">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
                                <MessageCircle className="size-4" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                SayHi
                            </span>
                        </Link>
                        <nav className="hidden gap-6 md:flex">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-violet-600"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/chat"
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-violet-600"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Chat
                            </Link>
                            <Link
                                href="/dashboard/profile"
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-violet-600"
                            >
                                <User className="h-4 w-4" />
                                Profile
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <UserNav user={user} />
                    </div>
                </div>
            </header>
            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10 py-6">
                <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
                    <div className="flex flex-col gap-1 py-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-violet-50 hover:text-violet-600 transition-colors"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/chat"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-violet-50 hover:text-violet-600 transition-colors"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Chat Rooms
                        </Link>
                        <Link
                            href="/dashboard/profile"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-violet-50 hover:text-violet-600 transition-colors"
                        >
                            <User className="h-4 w-4" />
                            Profile Settings
                        </Link>
                    </div>
                </aside>
                <main className="flex w-full flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
