import { TriangleAlertIcon } from "lucide-react";
interface FormErrorProps {
  message?: string;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;
  return (
    <div role="alert" className="bg-destructive/10 p-3 rounded-md flex items-start gap-x-2 text-sm text-destructive">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 break-words">{message}</p>
    </div>
  );
};
