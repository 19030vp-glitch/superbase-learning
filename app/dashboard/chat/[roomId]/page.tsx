import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Users } from "lucide-react";

export default async function RoomPage({
    params,
}: {
    params: { roomId: string };
}) {
    const supabase = await createClient();
    const { roomId } = await params;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch room details
    const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

    if (!room) {
        notFound();
    }

    // Fetch initial messages
    const { data: initialMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto border-0 rounded-2xl bg-gradient-to-b from-white to-gray-50/50 shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-violet-50">
                        <Link href="/dashboard/chat">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">{room.name}</h2>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Active now
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-violet-50">
                        <Users className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ChatMessages
                roomId={roomId}
                initialMessages={initialMessages || []}
                currentUserId={user.id}
            />

            {/* Input Area */}
            <ChatInput roomId={roomId} />
        </div>
    );
}
