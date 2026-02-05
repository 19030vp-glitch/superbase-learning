"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, CartesianGrid } from "recharts";

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
        username: string | null;
    } | null;
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
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const supabase = createClient();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        // Subscribe to real-time changes and presence
        const channel = supabase.channel(`room:${roomId}`);

        channel
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
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                setOnlineCount(count);
            })
            .on("broadcast", { event: "typing" }, (payload) => {
                const { userId, userName, isTyping } = payload.payload;
                if (userId === currentUserId) return;

                setTypingUsers((prev) => {
                    const next = { ...prev };
                    if (isTyping) {
                        next[userId] = userName;
                    } else {
                        delete next[userId];
                    }
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        user_id: currentUserId,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase, currentUserId]);

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
            }, 50);
        }
    }, [messages]);

    const renderMessageContent = (content: string) => {
        try {
            const data = JSON.parse(content);
            if (data.type === "chart" && Array.isArray(data.data)) {
                return (
                    <div className="w-full min-w-[280px] h-[200px] mt-2 bg-background rounded-md p-2">
                        <ChartContainer config={data.config || { value: { label: "Value", color: "oklch(var(--primary))" } }}>
                            <BarChart data={data.data}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey={data.xAxisKey || "name"}
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tick={{ fill: "oklch(var(--muted-foreground))", fontSize: 10 }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey={data.dataKey || "value"}
                                    fill="oklch(var(--primary))"
                                    radius={4}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                );
            }
        } catch {
            // Not a chart, just render as text
        }
        return content;
    };

    return (
        <>
            <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">
                        {onlineCount} {onlineCount === 1 ? 'member' : 'members'} online
                    </span>
                </div>
            </div>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="flex flex-col gap-4">
                {messages.map((message) => {
                    const isOwnMessage = message.user_id === currentUserId;
                    const displayName = message.profiles?.full_name || message.profiles?.username || "User";
                    const avatarUrl = message.profiles?.avatar_url;

                    return (
                        <div
                            key={message.id}
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
                                    {renderMessageContent(message.content)}
                                </div>
                                <span className="text-[10px] text-muted-foreground px-1">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {messages.length === 0 && (
                    <div className="flex items-center justify-center py-10">
                        <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
                    </div>
                )}

                {Object.keys(typingUsers).length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                        <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                        </div>
                        <span className="text-[11px] text-muted-foreground italic">
                            {Object.values(typingUsers).join(", ")} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}
                </div>
            </ScrollArea>
        </>
    );
}
