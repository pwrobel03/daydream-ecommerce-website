import { Info } from "lucide-react";

const GiveInNotice = ({ note }: { note: string }) => {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
      <Info className="mt-0.5 shrink-0" size={16} aria-hidden />
      <p>{note}</p>
    </div>
  );
};

export default GiveInNotice;
