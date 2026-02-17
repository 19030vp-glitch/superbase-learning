"use client";

import { useState } from "react";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { User } from "@supabase/supabase-js";
import { Message, ReplyTo } from "@/lib/types";

interface ChatViewProps {
    roomId: string;
    initialMessages: Message[];
    user: User;
    currentUserProfile?: {
        full_name: string | null;
        avatar_url: string | null;
        username: string | null;
    };
}

export function ChatView({
    roomId,
    initialMessages,
    user,
    currentUserProfile,
}: ChatViewProps) {
    const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <ChatMessages
                roomId={roomId}
                initialMessages={initialMessages}
                currentUserId={user.id}
                currentUserProfile={currentUserProfile}
                onReply={setReplyTo}
            />
            <ChatInput
                roomId={roomId}
                user={user}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onMessageSent={() => setReplyTo(null)}
            />
        </div>
    );
}
