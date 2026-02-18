"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { SendHorizontal, X, Reply, Mic, Square, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { EmojiPicker } from "@/components/emoji-picker";
import { User } from "@supabase/supabase-js";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { ReplyTo } from "@/lib/types";
import { toast } from "sonner";

interface ChatInputProps {
    roomId: string;
    user: User;
    replyTo?: ReplyTo | null;
    onCancelReply?: () => void;
    onMessageSent?: () => void;
}

export function ChatInput({
    roomId,
    user,
    replyTo,
    onCancelReply,
    onMessageSent
}: ChatInputProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        isRecording: isActuallyRecording,
        duration: actualDuration,
        audioBlob,
        startRecording,
        stopRecording,
        cancelRecording
    } = useAudioRecorder();

    const isRecording = isActuallyRecording;

    useEffect(() => {
        if (replyTo) {
            inputRef.current?.focus();
        }
    }, [replyTo]);

    const handleVoiceUpload = useCallback(async (blob: Blob) => {
        setIsLoading(true);
        const fileName = `${user.id}-${Date.now()}.webm`;

        try {
            const { error } = await supabase.storage
                .from("voice-messages")
                .upload(fileName, blob);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from("voice-messages")
                .getPublicUrl(fileName);

            const voiceMessageContent = JSON.stringify({
                type: "audio",
                url: publicUrl,
            });

            const result = await sendMessage(roomId, voiceMessageContent, replyTo?.id);

            if (result.success) {
                onMessageSent?.();
            } else {
                toast.error("Failed to send voice message");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            console.error("Error uploading voice message:", error);
            toast.error("Error uploading voice message: " + message);
        } finally {
            setIsLoading(false);
        }
    }, [user.id, supabase.storage, roomId, replyTo?.id, onMessageSent]);

    useEffect(() => {
        if (audioBlob) {
            handleVoiceUpload(audioBlob);
        }
    }, [audioBlob, handleVoiceUpload]);

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
            onMessageSent?.();
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
                <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-l-4 border-l-primary border-b animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                            <Reply className="w-3 h-3 text-primary shrink-0" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                Replying to {replyTo.username}
                            </span>
                            <span className="text-xs text-muted-foreground truncate italic">
                                &quot;{replyTo.content}&quot;
                            </span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-primary/10 transition-colors"
                        onClick={onCancelReply}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )}
            <div className="flex items-center gap-2 p-4">
                {!isRecording ? (
                    <>
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
                        {content.trim() ? (
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="icon"
                            >
                                <SendHorizontal className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors h-10 w-10 rounded-full shrink-0"
                                onClick={startRecording}
                            >
                                <Mic className="w-5 h-5" />
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center gap-3 bg-primary/5 rounded-full px-4 py-1.5 animate-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm font-medium tabular-nums">
                                {Math.floor(actualDuration / 60)}:{(actualDuration % 60).toString().padStart(2, "0")}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2 animate-in fade-in duration-500 italic">
                                Recording voice message...
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                                onClick={cancelRecording}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                size="icon"
                                className="h-9 w-9 rounded-full shadow-lg hover:scale-105 transition-transform bg-primary text-primary-foreground"
                                onClick={stopRecording}
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
}
