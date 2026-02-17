"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { SendHorizontal } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { EmojiPicker } from "@/components/emoji-picker";
import { User } from "@supabase/supabase-js";

interface ChatInputProps {
    roomId: string;
    user: User;
}

export function ChatInput({ roomId, user }: ChatInputProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isLoading) return;

        // Stop typing indicator when sending
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            sendTypingStatus(false);
        }

        setIsLoading(true);
        const result = await sendMessage(roomId, content);
        setIsLoading(false);

        if (result.success) {
            setContent("");
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
        <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t">
            <EmojiPicker
                onChange={(emoji) => setContent((prev) => prev + emoji)}
            />
            <Input
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
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
        </form>
    );
}
