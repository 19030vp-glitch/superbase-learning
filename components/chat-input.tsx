"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
    roomId: string;
}

export function ChatInput({ roomId }: ChatInputProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isLoading) return;

        setIsLoading(true);
        const result = await sendMessage(roomId, content);
        setIsLoading(false);

        if (result.success) {
            setContent("");
        }
    };

    return (
        <form onSubmit={handleSend} className="flex gap-2 p-4 border-t">
            <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !content.trim()}>
                <SendHorizontal className="w-4 h-4" />
            </Button>
        </form>
    );
}
