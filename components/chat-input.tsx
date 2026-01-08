"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { SendHorizontal, Smile } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    return (
        <form onSubmit={handleSend} className="flex gap-3 p-4 border-t bg-white/50 backdrop-blur-sm">
            <div className="flex-1 relative">
                <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="pr-10 h-12 rounded-xl border-violet-200 focus-visible:ring-violet-500"
                />
                <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-violet-600 transition-colors"
                >
                    <Smile className="h-5 w-5" />
                </button>
            </div>
            <Button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
            >
                {isLoading ? (
                    <Spinner size="sm" />
                ) : (
                    <SendHorizontal className="w-5 h-5" />
                )}
            </Button>
        </form>
    );
}
