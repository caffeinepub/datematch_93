import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fromNanoseconds } from "../../utils/formatting";

interface MessageBubbleProps {
  text: string;
  sentAt: bigint;
  isMine: boolean;
}

export function MessageBubble({ text, sentAt, isMine }: MessageBubbleProps) {
  const date = fromNanoseconds(sentAt);
  const timeLabel = format(date, "h:mm a");

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 max-w-[75%]",
        isMine ? "self-end items-end" : "self-start items-start",
      )}
    >
      <div
        className={cn(
          "px-4 py-2.5 text-sm leading-relaxed break-words",
          isMine
            ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-[4px]"
            : "bg-card text-foreground border border-border rounded-[18px] rounded-bl-[4px]",
        )}
      >
        {text}
      </div>
      <span className="text-[10px] text-muted-foreground px-1">
        {timeLabel}
      </span>
    </div>
  );
}
