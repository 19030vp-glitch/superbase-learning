import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createRoom } from "./actions";
import { MessageCircle, Plus, Users, Calendar } from "lucide-react";

export default async function ChatListPage() {
    const supabase = await createClient();

    const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chat Rooms</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage your conversations
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-md bg-gradient-to-r from-violet-500 to-indigo-600 text-white">
                <CardHeader>
                    <CardTitle className="text-white">Create a New Room</CardTitle>
                    <CardDescription className="text-white/80">
                        Start a new conversation by giving your room a name
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createRoom} className="flex gap-4">
                        <Input
                            name="name"
                            placeholder="Enter room name (e.g., General, Team Chat)"
                            required
                            className="max-w-md bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50"
                        />
                        <Button type="submit" variant="secondary" className="shrink-0">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Room
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {rooms && rooms.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <Link key={room.id} href={`/dashboard/chat/${room.id}`}>
                            <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <MessageCircle className="h-6 w-6 text-violet-600" />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-4 group-hover:text-violet-600 transition-colors">
                                        {room.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(room.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-4 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                    >
                                        Open Chat →
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center mb-6">
                            <MessageCircle className="h-10 w-10 text-violet-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No chat rooms yet</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Create your first chat room to start connecting with others.
                            It only takes a second!
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Real-time messaging
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Group conversations
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
