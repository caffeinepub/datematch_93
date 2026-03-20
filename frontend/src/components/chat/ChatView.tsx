import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  User,
  Loader2,
  MoreVertical,
  Trash2,
  UserCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMessages,
  useSendMessage,
  useMarkRead,
  useUnmatch,
} from "../../hooks/useQueries";
import { MessageBubble } from "./MessageBubble";
import { IcebreakerStrip } from "./IcebreakerStrip";
import { ReportDialog } from "../settings/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatProfile {
  name: string;
  photos?: { getDirectURL(): string }[] | null;
  icebreakers: { prompt: string; answer: string }[];
}

interface ChatViewProps {
  partnerPrincipal: string;
  partnerProfile: ChatProfile | null;
  myPrincipal: string;
  onBack: () => void;
  onViewProfile: () => void;
}

export function ChatView({
  partnerPrincipal,
  partnerProfile,
  myPrincipal,
  onBack,
  onViewProfile,
}: ChatViewProps) {
  const {
    data: messages = [],
    isLoading,
    isError,
  } = useMessages(partnerPrincipal);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markRead } = useMarkRead();
  const { mutate: unmatch, isPending: isUnmatching } = useUnmatch();

  const [text, setText] = useState("");
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea up to 3 lines
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20; // ~1.25rem at text-sm
    const maxHeight = lineHeight * 3 + 22; // 3 lines + padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [text]);

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    markRead(partnerPrincipal);
  }, [messages.length, partnerPrincipal]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText("");
    sendMessage({ to: partnerPrincipal, text: trimmed });
  };

  const handleUnmatch = () => {
    unmatch(partnerPrincipal, {
      onSuccess: () => onBack(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const photoUrl = partnerProfile?.photos?.[0]?.getDirectURL() ?? null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onViewProfile}
          className="flex flex-1 items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 ring-2 ring-border">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={partnerProfile?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate leading-tight font-serif italic">
              {partnerProfile?.name ?? "..."}
            </p>
            <p className="text-xs text-muted-foreground font-sans not-italic">
              Tap to view profile
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-hover transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem
              onClick={onViewProfile}
              className="gap-2 text-primary focus:text-primary"
            >
              <UserCircle className="w-4 h-4" />
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowReportDialog(true)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <ShieldAlert className="w-4 h-4" />
              Report
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowUnmatchDialog(true)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Unmatch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-destructive py-8">
            Failed to load messages.
          </p>
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex flex-col min-h-full">
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-medium text-foreground">Say hello!</p>
              <p className="text-xs text-muted-foreground">
                You matched with {partnerProfile?.name ?? "them"}. Start the
                conversation.
              </p>
            </div>

            {partnerProfile?.icebreakers &&
              partnerProfile.icebreakers.length > 0 && (
                <IcebreakerStrip
                  icebreakers={partnerProfile.icebreakers}
                  onSelect={(val) => {
                    setText(val);
                    inputRef.current?.focus();
                  }}
                  partnerName={partnerProfile.name}
                />
              )}
          </div>
        )}

        {!isLoading && !isError && messages.length > 0 && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {messages.map((msg) => {
              const isMine = String(msg.fromPrincipal) === myPrincipal;
              return (
                <MessageBubble
                  key={Number(msg.id)}
                  text={msg.text}
                  sentAt={msg.sentAt}
                  isMine={isMine}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-end gap-2 px-4 py-3 border-t border-border bg-background">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isSending}
          className={cn(
            "flex-1 min-h-[44px] px-4 py-[11px] rounded-2xl text-sm bg-muted border border-border resize-none overflow-y-auto leading-5",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "placeholder:text-muted-foreground/60",
            "disabled:opacity-50 transition-all",
          )}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className={cn(
            "w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20",
            "transition-all hover:scale-105 active:scale-95 hover:bg-primary/90",
            "disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none",
          )}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
          ) : (
            <Send className="w-4 h-4 text-primary-foreground ml-0.5" />
          )}
        </button>
      </div>

      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Unmatch {partnerProfile?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your conversation will be removed and you won't see each other in
              matches. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl mt-0">
              Keep match
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnmatch}
              disabled={isUnmatching}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnmatching && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetPrincipal={partnerPrincipal}
        targetName={partnerProfile?.name ?? "this user"}
        onSuccess={onBack}
      />
    </div>
  );
}
