"use client";

import { CardWrapper } from "./card-wrapper";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { newVerification } from "@/actions/new-verification";
import { useState } from "react";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";

// New verification form component
const NewVerificationForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Mock function to resend verification email
  const onSubmit = useCallback(() => {
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Verification token is missing.");
      return;
    }
    // Call the server action to resend verification email
    newVerification(token)
      .then((data) => {
        setError(data.error || null);
        setSuccess(data.success || null);
      })
      .catch(() => {
        setError("An unexpected error occurred.");
      });
  }, [token]);

  // Automatically trigger resend on component mount
  useEffect(() => {
    onSubmit();
  }, [onSubmit]);
  return (
    <CardWrapper
      headerLabel="Confirm your verification"
      backButtonHref="/auth/login"
      backButtonLabel="Back to login"
    >
      <div className="flex items-center w-full justify-center flex-col gap-4">
        {!success && !error && <BeatLoader size={12} />}
        <p className="text-sm text-center">
          A new verification link has been sent to your email address if it
          exists in our system.
        </p>
        <FormError message={error || undefined} />
        <FormSuccess message={success || undefined} />
      </div>
    </CardWrapper>
  );
};

export default NewVerificationForm;
