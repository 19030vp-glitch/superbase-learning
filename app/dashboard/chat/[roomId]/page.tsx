import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/chat">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <h2 className="text-xl font-bold">{room.name}</h2>
                </div>
            </div>

            <ChatMessages
                roomId={roomId}
                initialMessages={initialMessages || []}
                currentUserId={user.id}
            />

            <ChatInput roomId={roomId} />
        </div>
    );
}
