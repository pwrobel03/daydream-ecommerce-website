"use client";

import { CardWrapper } from "./card-wrapper";
import { useForm } from "react-hook-form";
import { useState, useTransition, useEffect } from "react"; // 👈 Dodaj useEffect
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NewPasswordSchema } from "@/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { newPassword } from "@/actions/new-password";

// TODO: The page loading something cause error hydration issue, fix it later
// Maybe a good solution is add a BeatLoader while the page is loading
// possibly by checking if the component is mounted
// Beat loader on max width and hight could be a good idea
export const NewPasswordForm = () => {
  const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");
    if (!token) {
      return setError("Password reset token is missing.");
    }
    startTransition(() => {
      newPassword(values, token).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  if (!isMounted) {
    return (
      <CardWrapper
        headerLabel="Enter a new password"
        backButtonHref="/auth/login"
        backButtonLabel="Back to login"
      >
        <div className="flex items-center w-full justify-center flex-col gap-4">
          <BeatLoader size={12} />
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      headerLabel="Enter a new password"
      backButtonHref="/auth/login"
      backButtonLabel="Back to login"
    >
      <Form {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="password"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="password confirmation"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormError message={error} />
            <FormSuccess message={success} />
            <Button disabled={isPending} type="submit" className="w-full py-6">
              Reset Password
            </Button>
          </form>
        </Form>
      </Form>
    </CardWrapper>
  );
};
