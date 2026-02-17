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
import { Reply } from "lucide-react";

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
    reply_to?: string;
    reply_to_message?: {
        content: string;
        profiles: {
            full_name: string | null;
            username: string | null;
        } | null;
    } | null;
}

interface ChatMessagesProps {
    roomId: string;
    initialMessages: Message[];
    currentUserId: string;
    currentUserProfile?: {
        full_name: string | null;
        avatar_url: string | null;
        username: string | null;
    };
}

interface OnlineUser {
    user_id: string;
    user_name: string;
    avatar_url: string | null;
    online_at: string;
}

export function ChatMessages({
    roomId,
    initialMessages,
    currentUserId,
    currentUserProfile,
}: ChatMessagesProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages as Message[]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
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

                    let replyToMessage = null;
                    if (newMessage.reply_to) {
                        const { data: replyData } = await supabase
                            .from("messages")
                            .select(`
                                content,
                                profiles (
                                    full_name,
                                    username
                                )
                            `)
                            .eq("id", newMessage.reply_to)
                            .single();
                        replyToMessage = replyData;
                    }

                    setMessages((current) => [...current, {
                        ...newMessage,
                        profiles: profile,
                        reply_to_message: replyToMessage as any
                    }]);
                }
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat() as unknown as OnlineUser[];

                // Deduplicate by user_id, keeping the most recent track
                const uniqueUsersMap = new Map<string, OnlineUser>();
                users.forEach((u) => {
                    if (u.user_id) {
                        const existing = uniqueUsersMap.get(u.user_id);
                        if (!existing || new Date(u.online_at) > new Date(existing.online_at)) {
                            uniqueUsersMap.set(u.user_id, u as OnlineUser);
                        }
                    }
                });

                const uniqueUsers = Array.from(uniqueUsersMap.values());
                setOnlineUsers(uniqueUsers);
                setOnlineCount(uniqueUsers.length);
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
                        user_name: currentUserProfile?.full_name || currentUserProfile?.username || "Anonymous",
                        avatar_url: currentUserProfile?.avatar_url,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase, currentUserId, currentUserProfile]);

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
        <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Online Members Sidebar */}
            <div className="w-48 border-r bg-muted/10 hidden md:flex flex-col">
                <div className="p-3 border-b">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        Online
                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                    </h3>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {onlineUsers.map((user) => (
                            <div
                                key={user.user_id}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                            >
                                <Avatar className="h-6 w-6 border border-background">
                                    <AvatarImage src={user.avatar_url || ""} />
                                    <AvatarFallback className="text-[10px]">
                                        {user.user_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate font-medium text-foreground/80 group-hover:text-foreground">
                                    {user.user_name}
                                </span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30 md:hidden">
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

                            const repliedUser = message.reply_to_message?.profiles?.full_name || message.reply_to_message?.profiles?.username || "User";

                            return (
                                <div
                                    key={message.id}
                                    className={`flex items-start gap-3 group/msg ${isOwnMessage ? "flex-row-reverse" : ""
                                        }`}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={avatarUrl || ""} />
                                        <AvatarFallback>
                                            {displayName.substring(0, 1).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`flex flex-col gap-1 max-w-[75%] min-w-0 ${isOwnMessage ? "items-end" : ""
                                            }`}
                                    >
                                        {!isOwnMessage && (
                                            <span className="text-xs font-medium text-muted-foreground px-1">
                                                {displayName}
                                            </span>
                                        )}
                                        <div className="relative group flex items-center gap-2">
                                            {isOwnMessage && (
                                                <button
                                                    onClick={() => window.dispatchEvent(new CustomEvent('reply-to-message', {
                                                        detail: {
                                                            id: message.id,
                                                            content: message.content,
                                                            username: displayName
                                                        }
                                                    }))}
                                                    className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground"
                                                    title="Reply"
                                                >
                                                    <Reply className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div
                                                className={`rounded-lg px-3 py-2 text-sm shadow-sm overflow-hidden ${isOwnMessage
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                    }`}
                                            >
                                                {message.reply_to_message && (
                                                    <div className={`mb-2 p-2 border-l-2 bg-black/5 rounded text-xs flex flex-col gap-1 ${isOwnMessage ? "border-primary-foreground/50" : "border-primary/50"}`}>
                                                        <span className="font-bold opacity-80">{repliedUser}</span>
                                                        <span className="truncate opacity-70 italic">{message.reply_to_message.content}</span>
                                                    </div>
                                                )}
                                                {renderMessageContent(message.content)}
                                            </div>
                                            {!isOwnMessage && (
                                                <button
                                                    onClick={() => window.dispatchEvent(new CustomEvent('reply-to-message', {
                                                        detail: {
                                                            id: message.id,
                                                            content: message.content,
                                                            username: displayName
                                                        }
                                                    }))}
                                                    className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground"
                                                    title="Reply"
                                                >
                                                    <Reply className="w-4 h-4" />
                                                </button>
                                            )}
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
            </div>
        </div>
    );
}
