"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
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
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const supabase = createClient();
    const scrollRef = useRef<HTMLDivElement>(null);

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
                (payload) => {
                    setMessages((current) => [...current, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase]);

    useEffect(() => {
        // Scroll to bottom on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <ScrollArea className="flex-1 p-4 h-[600px] border rounded-md" ref={scrollRef}>
            <div className="flex flex-col gap-4">
                {messages.map((message) => {
                    const isOwnMessage = message.user_id === currentUserId;
                    return (
                        <div
                            key={message.id}
                            className={`flex items-start gap-3 ${isOwnMessage ? "flex-row-reverse" : ""
                                }`}
                        >
                            <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                    {isOwnMessage ? "Me" : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? "items-end" : ""
                                    }`}
                            >
                                <div
                                    className={`rounded-lg px-3 py-2 text-sm ${isOwnMessage
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                        }`}
                                >
                                    {message.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
