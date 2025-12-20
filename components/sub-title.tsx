import { cn } from "@/lib/utils";

interface EditorialTitleProps {
  text: string;
  className?: string; // Pozwala na przekazanie np. text-4xl zamiast 6xl
  highlightClassName?: string; // Pozwala zmienić styl wyróżnionych słów
}

const SubTitle = ({
  text,
  className,
  highlightClassName,
}: EditorialTitleProps) => {
  if (!text) return null;

  // Rozbijamy string na tablicę słów
  const words = text.split(" ");

  return (
    <h1
      className={cn(
        "font-light tracking-tighter leading-[0.8] text-6xl md:text-8xl mb-6",
        className
      )}
    >
      {words.map((word, i) => {
        // Co drugie słowo (nieparzyste indeksy) dostaje styl "pop"
        const isHighlighted = i % 2 !== 0;

        return (
          <span
            key={`${word}-${i}`}
            className={cn(
              "block",
              isHighlighted &&
                cn(
                  "pl-12 font-black italic text-primary uppercase",
                  highlightClassName
                )
            )}
          >
            {word}
          </span>
        );
      })}
    </h1>
  );
};

export default SubTitle;
