"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: Profile | Profile[] | null;
}

interface ChatMessagesProps {
    roomId: string;
    initialMessages: Message[];
    currentUserId: string;
}

export function ChatMessages({
    roomId,
    initialMessages,
    currentUserId,
}: ChatMessagesProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages as Message[]);
    const supabase = createClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Subscribe to real-time changes
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                async (payload) => {
                    const newMessage = payload.new as Message;

                    // Fetch profile for the new message
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("full_name, avatar_url, username")
                        .eq("id", newMessage.user_id)
                        .single();

                    setMessages((current) => [...current, { ...newMessage, profiles: profile }]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase]);

    return (
        <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
                {messages.map((message) => {
                    const isOwnMessage = message.user_id === currentUserId;

                    // Defensive check: profiles might be returned as an array or object depending on Supabase query result
                    const profileData = Array.isArray(message.profiles)
                        ? message.profiles[0]
                        : message.profiles;

                    const displayName = profileData?.full_name || profileData?.username || "User";
                    const avatarUrl = profileData?.avatar_url;

                    return (
                        <div
                            key={message.id}
                            data-message-id={message.id}
                            className={`flex items-start gap-3 ${isOwnMessage ? "flex-row-reverse" : ""
                                }`}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={avatarUrl || ""} />
                                <AvatarFallback>
                                    {displayName.substring(0, 1).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={`flex flex-col gap-1 max-w-[75%] ${isOwnMessage ? "items-end" : ""
                                    }`}
                            >
                                {!isOwnMessage && (
                                    <span className="text-xs font-medium text-muted-foreground px-1">
                                        {displayName}
                                    </span>
                                )}
                                <div
                                    className={`rounded-lg px-3 py-2 text-sm shadow-sm ${isOwnMessage
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                        }`}
                                >
                                    {message.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground px-1">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
                {messages.length === 0 && (
                    <div className="flex items-center justify-center py-10">
                        <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
