import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatView } from "@/components/chat-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    const userIds = new Set<string>();
    rawMessages?.forEach((msg: any) => {
        userIds.add(msg.user_id);
        if (msg.reply_to_message?.user_id) {
            userIds.add(msg.reply_to_message.user_id);
        }
    });

    // Fetch all profiles in one query
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .in("id", Array.from(userIds));

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    // Enrich messages with profile data
    const initialMessages = rawMessages?.map((msg: any) => ({
        ...msg,
        profiles: profileMap.get(msg.user_id) || null,
        reply_to_message: msg.reply_to_message ? {
            ...msg.reply_to_message,
            profiles: profileMap.get(msg.reply_to_message.user_id) || null,
        } : null,
    })) || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/chat">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{room.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        Created {new Date(room.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <Card className="flex flex-col h-[calc(100vh-16rem)] overflow-hidden border-none shadow-2xl bg-muted/20">
                <ChatView
                    key={roomId}
                    roomId={roomId}
                    initialMessages={initialMessages || []}
                    user={user}
                    currentUserProfile={currentUserProfile || undefined}
                />
            </Card>
        </div>
    );
}
