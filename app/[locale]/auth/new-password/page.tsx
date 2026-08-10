import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth/new-password-form";
import { FormSkeleton } from "@/components/skeletons";

// Formularz czyta token resetu z query stringa.
export default function NewPasswordPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <NewPasswordForm />
    </Suspense>
  );
}
