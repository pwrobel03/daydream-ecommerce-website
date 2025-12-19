"use client";
import { CardWrapper } from "./card-wrapper";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useSearchParams } from "next/navigation";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
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
import { login } from "@/actions/login";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import Router from "next/router";

export const LoginForm = () => {
  // error from url params
  const searchParams = useSearchParams();
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already linked with different provider!"
      : undefined;

  // form state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const data = await login(values);

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.success) {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false, // Zmieniamy na false, żeby otrzymać wynik w 'result'
        });

        if (result?.error) {
          setError("Invalid credentials!");
        } else {
          redirect("/settings");
        }
      }
    });
  };

  return (
    <CardWrapper
      headerLabel="Welcome back"
      backButtonHref="/auth/register"
      backButtonLabel="Don't have an account?"
      showSocial
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="username@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <Button
                    variant="link"
                    className="px-0 pt-2 pb-0 ml-auto gap-1"
                    asChild
                  >
                    <div className="flex flex-row items-center">
                      <LinkIcon className="size-4 font-normal text-black" />
                      <Link href="/auth/forgot-password">Forgot password?</Link>
                    </div>
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={success} />
          <Button disabled={isPending} type="submit" className="w-full py-6">
            Login
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
