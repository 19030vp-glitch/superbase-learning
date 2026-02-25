"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Search, Loader2, AlertCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GiphyGif {
    id: string;
    title: string;
    images: {
        fixed_height: {
            url: string;
        };
        fixed_height_small: {
            url: string;
        };
    };
}

interface GifPickerProps {
    onSelect: (url: string) => void;
}

// Fallback to a public beta key if env var is not provided
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";

export const GifPicker = ({ onSelect }: GifPickerProps) => {
    const [search, setSearch] = useState("");
    const [gifs, setGifs] = useState<GiphyGif[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGifs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const endpoint = search
                    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(search)}&limit=20`
                    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
                const response = await fetch(endpoint);
                const data = await response.json();
                if (data.meta && data.meta.status !== 200) {
                    throw new Error(data.meta.msg || "Failed to fetch GIFs");
                }
                if (data.data) {
                    setGifs(data.data);
                }
            } catch (error) {
                console.error("Error fetching GIFs:", error);
                setError(error instanceof Error ? error.message : "Error fetching GIFs");
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchGifs, search ? 500 : 0);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center justify-center h-10 w-10 hover:bg-accent hover:text-accent-foreground rounded-md transition"
                    title="Add GIF"
                >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={12}
                className="w-80 p-0 border border-border bg-background shadow-xl rounded-xl overflow-hidden"
            >
                <div className="p-3 border-b border-border bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search GIPHY..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 text-sm"
                        />
                    </div>
                </div>
                <ScrollArea className="h-72 p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                            <AlertCircle className="h-8 w-8 text-destructive mb-2 opacity-50" />
                            <p className="text-sm font-medium text-destructive/80">{error}</p>
                            <p className="text-xs text-muted-foreground mt-1">Please check your GIPHY API key.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {gifs.length > 0 ? (
                                gifs.map((gif) => (
                                    <button
                                        key={gif.id}
                                        type="button"
                                        onClick={() => onSelect(gif.images.fixed_height.url)}
                                        className="relative aspect-video rounded-md overflow-hidden hover:opacity-80 transition group bg-muted"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={gif.images.fixed_height_small.url}
                                            alt={gif.title || "Giphy GIF"}
                                            className="object-cover w-full h-full"
                                        />
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-2 flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <p className="text-sm">No GIFs found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-border bg-muted/30 flex justify-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Powered by GIPHY</span>
                </div>
            </PopoverContent>
        </Popover>
    );
};
