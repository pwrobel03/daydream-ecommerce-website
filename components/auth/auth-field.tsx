"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, useFormField } from "../ui/form";
import { Input } from "../ui/input";

// Schema messages are keys under `auth.errors`, so the text follows the locale.
const FieldError = () => {
  const t = useTranslations("auth.errors");
  const { error, formMessageId } = useFormField();
  if (!error) return null;
  const message = String(error.message);
  return (
    <p id={formMessageId} className="text-destructive text-sm">
      {t.has(message) ? t(message) : message}
    </p>
  );
};

interface AuthFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  labelAside?: React.ReactNode;
}

export const AuthField = ({ name, label, labelAside, ...input }: AuthFieldProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between gap-4">
            <FormLabel>{label}</FormLabel>
            {labelAside}
          </div>
          <FormControl>
            <Input {...field} {...input} />
          </FormControl>
          <FieldError />
        </FormItem>
      )}
    />
  );
};
