import { highlightText } from "@/lib/search/highlight";
import { cn } from "@/lib/utils/classNames";

interface HighlightTextProps {
  text: string;
  terms: string[];
  className?: string;
  markClassName?: string;
}

export function HighlightText({
  text,
  terms,
  className,
  markClassName,
}: HighlightTextProps) {
  const chunks = highlightText(text, terms);

  return (
    <span className={className}>
      {chunks.map((chunk, index) =>
        chunk.match ? (
          <mark
            key={`${chunk.text}-${index}`}
            className={cn(
              "rounded-[0.4rem] bg-[rgba(195,154,109,0.28)] px-1 py-0.5 text-current",
              markClassName,
            )}
          >
            {chunk.text}
          </mark>
        ) : (
          <span key={`${chunk.text}-${index}`}>{chunk.text}</span>
        ),
      )}
    </span>
  );
}
