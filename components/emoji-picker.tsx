"use client";

import { Smile } from "lucide-react";
import dynamic from "next/dynamic";
import { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiPickerProps {
    onChange: (value: string) => void;
}

export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
    const { resolvedTheme } = useTheme();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center justify-center h-10 w-10 hover:bg-accent hover:text-accent-foreground rounded-md transition"
                    title="Add emoji"
                >
                    <Smile className="h-5 w-5 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={12}
                className="p-0 border-none bg-transparent shadow-none"
            >
                <Picker
                    theme={resolvedTheme as Theme}
                    onEmojiClick={(data) => onChange(data.emoji)}
                />
            </PopoverContent>
        </Popover>
    );
};
