"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, CartesianGrid } from "recharts";
import { Reply, Users } from "lucide-react";
import { Message } from "@/lib/types";
import { AudioPlayer } from "@/components/audio-player";

interface ChatMessagesProps {
    roomId: string;
    initialMessages: Message[];
    currentUserId: string;
    currentUserProfile?: {
        full_name: string | null;
        avatar_url: string | null;
        username: string | null;
    };
    onReply?: (message: { id: string; content: string; username: string }) => void;
    isSidebarOnly?: boolean;
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
    onReply,
    isSidebarOnly = false,
}: ChatMessagesProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages as Message[]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const supabase = useMemo(() => createClient(), []);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Group messages by date
    const groupedMessages = messages.reduce((acc: { [key: string]: Message[] }, message) => {
        const date = new Date(message.created_at).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(message);
        return acc;
    }, {});

    const displayName = currentUserProfile?.full_name || currentUserProfile?.username || "Anonymous";
    const avatarUrl = currentUserProfile?.avatar_url || null;

    useEffect(() => {
        // ... (keep the same useEffect logic for real-time and presence)
        const channel = supabase.channel(`room:${roomId}`);
        // (existing subscription logic remains unchanged)
        // [restoring original logic from previous view_file for context]
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
                    const [profileResult, replyResult] = await Promise.all([
                        supabase.from("profiles").select("full_name, avatar_url, username").eq("id", newMessage.user_id).single(),
                        newMessage.reply_to ? supabase.from("messages").select("content, user_id").eq("id", newMessage.reply_to).single() : Promise.resolve({ data: null })
                    ]);
                    let replyData: Message["reply_to_message"] = null;
                    if (replyResult.data) {
                        const replyMsg = replyResult.data as { user_id: string; content: string };
                        const { data: replyProfile } = await supabase.from("profiles").select("full_name, username").eq("id", replyMsg.user_id).single();
                        replyData = { content: replyMsg.content, profiles: replyProfile };
                    }
                    setMessages((current) => {
                        if (current.some(m => m.id === newMessage.id)) return current;
                        return [...current, { ...newMessage, profiles: profileResult.data, reply_to_message: replyData }].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    });
                }
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat() as unknown as OnlineUser[];
                const uniqueUsersMap = new Map<string, OnlineUser>();
                users.forEach((u) => {
                    if (u.user_id) {
                        const existing = uniqueUsersMap.get(u.user_id);
                        if (!existing || new Date(u.online_at) > new Date(existing.online_at)) uniqueUsersMap.set(u.user_id, u as OnlineUser);
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
                    if (isTyping) next[userId] = userName;
                    else delete next[userId];
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        user_id: currentUserId,
                        user_name: displayName,
                        avatar_url: avatarUrl,
                        online_at: new Date().toISOString(),
                    });
                }
            });
        return () => { supabase.removeChannel(channel); };
    }, [roomId, supabase, currentUserId, displayName, avatarUrl]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    const renderMessageContent = (content: string) => {
        // ... (keep the same renderMessageContent logic)
        try {
            const data = JSON.parse(content);
            if (data.type === "chart" && Array.isArray(data.data)) {
                return (
                    <div className="w-full min-w-[240px] md:min-w-[280px] h-[180px] mt-2 bg-background/50 backdrop-blur-sm rounded-xl p-2 border border-border/50">
                        <ChartContainer config={data.config || { value: { label: "Value", color: "oklch(var(--primary))" } }}>
                            <BarChart data={data.data}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey={data.xAxisKey || "name"} tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: "oklch(var(--muted-foreground))", fontSize: 10 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey={data.dataKey || "value"} fill="oklch(var(--primary))" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </div>
                );
            }
            if (data.type === "audio" && data.url) {
                return <AudioPlayer url={data.url} />;
            }
        } catch { }
        return content;
    };

    if (isSidebarOnly) {
        return (
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            Active Transmitters
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        </h3>
                        <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {onlineCount} Online
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {onlineUsers.map((user) => (
                            <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                                    <AvatarImage src={user.avatar_url || ""} />
                                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                        {user.user_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold truncate text-foreground/90">{user.user_name}</span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-green-500" />
                                        Connected
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {/* Online Count Indicator for Mobile Header (redundant if shown in header, but good for context) */}
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-4 pb-10">
                    {Object.entries(groupedMessages).map(([date, messages]) => (
                        <div key={date} className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 py-2">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap bg-background px-2">
                                    {date}
                                </span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                            </div>

                            {messages.map((message) => {
                                const isOwnMessage = message.user_id === currentUserId;
                                const displayName = message.profiles?.full_name || message.profiles?.username || "User";
                                const avatarUrl = message.profiles?.avatar_url;
                                const repliedUser = message.reply_to_message?.profiles?.full_name || message.reply_to_message?.profiles?.username || "User";

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex items-end gap-2 group/msg animate-in slide-in-from-bottom-2 fade-in duration-300 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                                    >
                                        {!isOwnMessage && (
                                            <Avatar className="h-8 w-8 shrink-0 border border-background shadow-sm mb-1">
                                                <AvatarImage src={avatarUrl || ""} />
                                                <AvatarFallback className="text-[10px] font-bold">
                                                    {displayName.substring(0, 1).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[70%] min-w-0 ${isOwnMessage ? "items-end" : "items-start"}`}>
                                            <div className="relative group/actions flex items-center gap-2">
                                                {isOwnMessage && onReply && (
                                                    <button
                                                        onClick={() => onReply({ id: message.id, content: message.content, username: displayName })}
                                                        className="opacity-0 group-hover/msg:opacity-100 transition-all p-2 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground shrink-0 backdrop-blur-sm"
                                                        title="Reply"
                                                    >
                                                        <Reply className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm relative overflow-hidden transition-all group-hover/msg:shadow-md border ${isOwnMessage
                                                        ? "bg-primary text-primary-foreground border-primary/20 rounded-br-none"
                                                        : "bg-muted/50 backdrop-blur-md border-border/50 rounded-bl-none"
                                                        }`}
                                                >
                                                    {message.reply_to_message && (
                                                        <div className={`mb-2 p-2.5 border-l-2 bg-black/5 rounded-lg text-xs flex flex-col gap-1 backdrop-blur-sm ${isOwnMessage ? "border-primary-foreground/30" : "border-primary/30"}`}>
                                                            <span className="font-bold opacity-80 flex items-center gap-1.5">
                                                                <Reply className="w-3 h-3" />
                                                                {repliedUser}
                                                            </span>
                                                            <span className="line-clamp-2 opacity-70 italic text-[11px]">
                                                                {(() => {
                                                                    const replyTo = Array.isArray(message.reply_to_message) ? message.reply_to_message[0] : message.reply_to_message;
                                                                    if (!replyTo) return null;
                                                                    try {
                                                                        const data = JSON.parse(replyTo.content);
                                                                        if (data.type === "audio") return "Voice message";
                                                                        if (data.type === "chart") return "Chart data";
                                                                        return replyTo.content;
                                                                    } catch { return replyTo.content; }
                                                                })()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="leading-relaxed break-words">
                                                        {renderMessageContent(message.content)}
                                                    </div>
                                                </div>
                                                {!isOwnMessage && onReply && (
                                                    <button
                                                        onClick={() => onReply({ id: message.id, content: message.content, username: displayName })}
                                                        className="opacity-0 group-hover/msg:opacity-100 transition-all p-2 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground shrink-0 backdrop-blur-sm"
                                                        title="Reply"
                                                    >
                                                        <Reply className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-2 px-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                                                {!isOwnMessage && (
                                                    <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                                                        {displayName}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-primary/20" />
                            </div>
                            <p className="text-sm font-semibold text-muted-foreground">End-to-end encrypted</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 text-center max-w-[200px]">Send a message to start the conversation.</p>
                        </div>
                    )}

                    {Object.keys(typingUsers).length > 0 && (
                        <div className="flex items-center gap-3 px-2 py-2 animate-in slide-in-from-left-2 fade-in duration-300">
                            <div className="flex gap-1.5 p-2 bg-muted/40 backdrop-blur-sm rounded-full border border-border/50 shadow-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground italic tracking-tight">
                                {Object.values(typingUsers).join(", ")} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} transmitting...
                            </span>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                </div>
            </ScrollArea>
        </div>
    );
}
