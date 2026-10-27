import { cn } from "@/lib/utils";

interface SubTitleProps {
  text: string;
  className?: string;
}

const SubTitle = ({ text, className }: SubTitleProps) => {
  if (!text) return null;

  return (
    <h1
      className={cn(
        "font-display text-4xl leading-[1.1] text-balance mb-6",
        className
      )}
    >
      {text}
    </h1>
  );
};

export default SubTitle;
