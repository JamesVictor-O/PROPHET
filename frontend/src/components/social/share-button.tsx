"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Twitter, Link2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  marketId: string;
  marketQuestion: string;
  category?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

export function ShareButton({
  marketId,
  marketQuestion,
  category,
  className,
  variant = "outline",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/markets/${marketId}`;
  const shareText = `Check out this prediction market: ${marketQuestion}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: marketQuestion,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={className}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#1E293B] border-[#334155] text-white"
      >
        {navigator.share && (
          <DropdownMenuItem
            onClick={handleNativeShare}
            className="focus:bg-[#0F172A] focus:text-white cursor-pointer"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share via...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleTwitterShare}
          className="focus:bg-[#0F172A] focus:text-white cursor-pointer"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="focus:bg-[#0F172A] focus:text-white cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const text = `${shareText}\n${shareUrl}`;
            navigator.clipboard.writeText(text);
            toast.success("Market details copied!");
          }}
          className="focus:bg-[#0F172A] focus:text-white cursor-pointer"
        >
          <Link2 className="w-4 h-4 mr-2" />
          Copy Market Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

