import { Suspense } from "react";
import NewVerificationForm from "@/components/auth/new-verification-form";
import { FormSkeleton } from "@/components/skeletons";

// Formularz czyta token z query stringa, więc nie da się go prerenderować.
export default function NewVerificationPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={1} />}>
      <NewVerificationForm />
    </Suspense>
  );
}
