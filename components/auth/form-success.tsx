import { Check } from "lucide-react";
interface FormSuccessProps {
  message?: string;
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null;
  return (
    <div role="status" className="bg-emerald-600/10 p-3 rounded-md flex items-start gap-x-2 text-sm text-emerald-700 dark:text-emerald-400">
      <Check className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 break-words">{message}</p>
    </div>
  );
};
