import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Users,
    TrendingUp,
    ArrowRight,
    Plus,
    MessageCircle
} from "lucide-react";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch rooms count
    const { count: roomsCount } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true });

    // Fetch recent rooms
    const { data: recentRooms } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

    // Get user's display name from email
    const displayName = user?.email?.split("@")[0] || "User";

    return (
        <div className="flex flex-col gap-8">
            {/* Welcome Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, <span className="text-violet-600">{displayName}</span>! 👋
                </h1>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your conversations today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            Total Chat Rooms
                        </CardTitle>
                        <MessageSquare className="h-5 w-5 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{roomsCount || 0}</div>
                        <p className="text-xs opacity-80 mt-1">
                            Active conversations
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            Online Now
                        </CardTitle>
                        <Users className="h-5 w-5 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                            You
                        </div>
                        <p className="text-xs opacity-80 mt-1">
                            Start a conversation!
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            Quick Action
                        </CardTitle>
                        <TrendingUp className="h-5 w-5 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <Button
                            asChild
                            variant="secondary"
                            className="w-full mt-1 bg-white/20 hover:bg-white/30 text-white border-0"
                        >
                            <Link href="/dashboard/chat">
                                <Plus className="h-4 w-4 mr-2" />
                                New Chat Room
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Conversations */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Conversations</CardTitle>
                            <CardDescription>
                                Jump back into your chat rooms
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/chat">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentRooms && recentRooms.length > 0 ? (
                            <div className="space-y-3">
                                {recentRooms.map((room) => (
                                    <Link
                                        key={room.id}
                                        href={`/dashboard/chat/${room.id}`}
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-violet-50 transition-colors group"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                                            <MessageCircle className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate group-hover:text-violet-600 transition-colors">
                                                {room.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Created {new Date(room.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="h-8 w-8 text-violet-600" />
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    No chat rooms yet. Start your first conversation!
                                </p>
                                <Button asChild>
                                    <Link href="/dashboard/chat">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Chat Room
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                            Quick tips to get the most out of SayHi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-violet-600">1</span>
                                </div>
                                <div>
                                    <p className="font-medium">Create a chat room</p>
                                    <p className="text-sm text-muted-foreground">
                                        Start a new conversation by creating a room
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-indigo-600">2</span>
                                </div>
                                <div>
                                    <p className="font-medium">Invite your friends</p>
                                    <p className="text-sm text-muted-foreground">
                                        Share the room link with others to chat
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-cyan-600">3</span>
                                </div>
                                <div>
                                    <p className="font-medium">Start chatting</p>
                                    <p className="text-sm text-muted-foreground">
                                        Messages are delivered in real-time
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t">
                            <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                                ✨ Pro Tip
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">
                                Update your profile to personalize your chat experience!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
