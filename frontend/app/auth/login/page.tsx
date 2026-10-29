"use client";
import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Input } from "@/components/ui/ac-input";
import { Label } from "@/components/ui/ac-label";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
export default function SignupFormDemo() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await signIn("credentials", {
        redirect: false,
        identifier: e.currentTarget.email.value,
        password: e.currentTarget.password.value,
      });
      if (res?.ok) {
        toast.success("Login successful");
        const redirectRoute = localStorage.getItem("redirectRoute") || "/";
        localStorage.removeItem("redirectRoute");
        router.push(redirectRoute);
        router.refresh();
      } else {
        toast.error("Invalid Email or Password");
      }
    } catch (error) {
      console.log("Login Error", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      description="Pick up where you left off and keep building interview confidence."
      footer={
        <>
          New to NeuraView?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm text-slate-200">
              Password
            </Label>
          </div>
          <Input
            id="password"
            name="password"
            placeholder="Enter your password"
            type="password"
            autoComplete="current-password"
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
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-slate-500">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <GoogleSignInButton />
    </AuthShell>
  );
}
