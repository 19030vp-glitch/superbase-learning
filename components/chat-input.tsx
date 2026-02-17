"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { SendHorizontal, X, Reply } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { EmojiPicker } from "@/components/emoji-picker";
import { User } from "@supabase/supabase-js";

interface ReplyTo {
    id: string;
    content: string;
    username: string;
}

interface ChatInputProps {
    roomId: string;
    user: User;
}

export function ChatInput({ roomId, user }: ChatInputProps) {
    const [content, setContent] = useState("");
    const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleReply = (e: any) => {
            setReplyTo(e.detail);
            inputRef.current?.focus();
        };
        window.addEventListener("reply-to-message", handleReply);
        return () => window.removeEventListener("reply-to-message", handleReply);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isLoading) return;

        // Stop typing indicator when sending
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            sendTypingStatus(false);
        }

        setIsLoading(true);
        const result = await sendMessage(roomId, content, replyTo?.id);
        setIsLoading(false);

        if (result.success) {
            setContent("");
            setReplyTo(null);
        }
    };

    const sendTypingStatus = async (isTyping: boolean) => {
        const channel = supabase.channel(`room:${roomId}`);
        await channel.send({
            type: "broadcast",
            event: "typing",
            payload: {
                isTyping,
                userId: user.id,
                userName: user.user_metadata?.full_name || user.email || "Someone"
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);

        if (!typingTimeoutRef.current) {
            sendTypingStatus(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
            typingTimeoutRef.current = null;
        }, 3000);
    };

    return (
        <form onSubmit={handleSend} className="flex flex-col border-t bg-background/95 backdrop-blur-md sticky bottom-0">
            {replyTo && (
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Reply className="w-3 h-3 text-primary shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-primary truncate">
                                Replying to {replyTo.username}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                {replyTo.content}
                            </span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => setReplyTo(null)}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            )}
            <div className="flex items-center gap-2 p-4">
                <EmojiPicker
                    onChange={(emoji) => setContent((prev) => prev + emoji)}
                />
                <Input
                    ref={inputRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={replyTo ? "Type your reply..." : "Type your message..."}
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button
                    type="submit"
                    disabled={isLoading || !content.trim()}
                    size="icon"
                >
                    <SendHorizontal className="w-5 h-5" />
                </Button>
            </div>
        </form>
    );
}
