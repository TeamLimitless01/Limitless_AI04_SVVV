"use client";

import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Input } from "@/components/ui/ac-input";
import { Label } from "@/components/ui/ac-label";
import { strapi } from "@/lib/api/sdk";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function SignupFormDemo() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const name = e.currentTarget.fullname.value;
      const email = e.currentTarget.email.value;
      const password = e.currentTarget.password.value;
      if (!name || !email || !password) {
        toast.error("Please enter all fields");
      }
      const registration = await strapi.register({
        username: `${name}${Math.floor(Math.random() * 10000)}`,
        email,
        password,
        displayName: name,
      });
      if (registration?.user) {
        const res = await signIn("credentials", {
          redirect: false,
          identifier: email,
          password,
        });
        if (res?.ok) {
          toast.success(
            registration.welcomeEmailSent
              ? "Welcome to neuraview!"
              : "Welcome to neuraview!",
          );
          const redirectRoute = localStorage.getItem("redirectRoute") || "/";
          localStorage.removeItem("redirectRoute");
          router.push(redirectRoute);
          router.refresh();
        } else {
          toast.error("Invalid Email or Password");
        }
      }
    } catch (error: any) {
      console.log("Login Error", error);
      toast.error(error?.error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Start your journey"
      title="Create your account"
      description="Set up your space and make your next interview a little less daunting."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullname" className="text-sm text-slate-200">
            Full name
          </Label>
          <Input
            id="fullname"
            name="fullname"
            placeholder="Your name"
            type="text"
            autoComplete="name"
            required
            className="h-12 rounded-xl border border-white/10 bg-slate-900/70 px-4 text-sm text-white shadow-none placeholder:text-slate-500 dark:bg-slate-900/70 dark:shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-slate-200">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
            className="h-12 rounded-xl border border-white/10 bg-slate-900/70 px-4 text-sm text-white shadow-none placeholder:text-slate-500 dark:bg-slate-900/70 dark:shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-slate-200">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            placeholder="Create a password"
            type="password"
            autoComplete="new-password"
            required
            className="h-12 rounded-xl border border-white/10 bg-slate-900/70 px-4 text-sm text-white shadow-none placeholder:text-slate-500 dark:bg-slate-900/70 dark:shadow-none"
          />
        </div>

        <button
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-5 font-semibold text-white shadow-lg shadow-blue-950/30 transition-all hover:brightness-110 hover:shadow-blue-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-slate-500">
          or
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <GoogleSignInButton />
    </AuthShell>
  );
}
