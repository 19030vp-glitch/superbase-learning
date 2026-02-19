import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatView } from "@/components/chat-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface RawReplyMessage {
    content: string;
    user_id: string;
}

interface RawMessage {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    room_id: string;
    reply_to: string | null;
    reply_to_message: RawReplyMessage | RawReplyMessage[] | null;
}

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

    // Fetch current user's profile
    const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("id", user.id)
        .single();

    // Fetch initial messages with profile data and replied-to message info
    // Fetch messages without nested profile joins to avoid FK relationship errors
    const { data: rawMessages } = await supabase
        .from("messages")
        .select(`
      *,
      reply_to_message:messages!reply_to (
        content,
        user_id
      )
    `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

    // Collect all unique user IDs from messages and their replies
    const messages = (rawMessages as unknown as RawMessage[]) || [];
    const userIds = new Set<string>();
    messages.forEach((msg) => {
        userIds.add(msg.user_id);
        const replyToMsg = Array.isArray(msg.reply_to_message)
            ? msg.reply_to_message[0]
            : msg.reply_to_message;

        if (msg.reply_to && replyToMsg?.user_id) {
            userIds.add(replyToMsg.user_id);
        }
    });

    // Fetch all profiles in one query
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .in("id", Array.from(userIds));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Enrich messages with profile data
    const initialMessages = messages.map((msg) => {
        const replyToMsg = Array.isArray(msg.reply_to_message)
            ? msg.reply_to_message[0]
            : msg.reply_to_message;

        return {
            ...msg,
            reply_to: msg.reply_to ?? undefined,
            profiles: profileMap.get(msg.user_id) || null,
            reply_to_message: (msg.reply_to && replyToMsg) ? {
                ...replyToMsg,
                profiles: profileMap.get(replyToMsg.user_id) || null,
            } : null,
        };
    });

    return (
        <div className="h-full flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-none md:shadow-2xl bg-transparent md:bg-muted/20 md:rounded-2xl">
                <ChatView
                    key={roomId}
                    roomId={roomId}
                    initialMessages={initialMessages || []}
                    roomName={room.name}
                    roomCreatedAt={room.created_at}
                    user={user}
                    currentUserProfile={currentUserProfile || undefined}
                />
            </Card>
        </div>
    );
}
