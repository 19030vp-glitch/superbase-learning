"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Group messages by date
    const groupedMessages: { [key: string]: Message[] } = {};
    messages.forEach((message) => {
        const dateKey = new Date(message.created_at).toDateString();
        if (!groupedMessages[dateKey]) {
            groupedMessages[dateKey] = [];
        }
        groupedMessages[dateKey].push(message);
    });

    return (
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="flex flex-col gap-4 py-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-muted-foreground font-medium">No messages yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Be the first to say hi! 👋</p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                        <div key={dateKey}>
                            <div className="flex items-center justify-center my-4">
                                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                                    {formatDate(dayMessages[0].created_at)}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {dayMessages.map((message, index) => {
                                    const isOwnMessage = message.user_id === currentUserId;
                                    const showAvatar = index === 0 ||
                                        dayMessages[index - 1].user_id !== message.user_id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex items-end gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                                        >
                                            {showAvatar ? (
                                                <Avatar className="w-8 h-8 shrink-0">
                                                    <AvatarFallback className={`text-xs font-medium ${isOwnMessage
                                                            ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
                                                            : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600"
                                                        }`}>
                                                        {isOwnMessage ? "Me" : "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="w-8 shrink-0" />
                                            )}
                                            <div
                                                className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? "items-end" : ""
                                                    }`}
                                            >
                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 text-sm ${isOwnMessage
                                                            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md"
                                                            : "bg-white border shadow-sm rounded-bl-md"
                                                        }`}
                                                >
                                                    {message.content}
                                                </div>
                                                <span className={`text-[10px] text-muted-foreground px-1 ${isOwnMessage ? "text-right" : ""
                                                    }`}>
                                                    {formatTime(message.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    );
}
