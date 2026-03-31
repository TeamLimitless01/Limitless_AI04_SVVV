"use client";
import { Input } from "@/components/ui/ac-input";
import { Label } from "@/components/ui/ac-label";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
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
        const redirectRoute =
          JSON.parse(localStorage.getItem("redirectRoute")!)! || "/";
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
    <div className="flex justify-center items-center h-screen">
      <div className="shadow-input mt-10 mx-auto w-full max-w-md rounded-none bg-transparent p-4 md:rounded-2xl md:p-8 backdrop-blur-3xl">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome to AI Interviewer!
        </h2>

        <form className="my-8" onSubmit={handleSubmit}>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="projectmayhem@fc.com"
              type="email"
              required
            />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              required
            />
          </LabelInputContainer>
          <button
            className="group/btn relative cursor-pointer block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className=" flex justify-center items-center w-full">
                <LoaderCircle className=" rotate-180 spin-in animate-spin text-center" />
              </div>
            ) : (
              <>
                Sign in &rarr;
                <BottomGradient />
              </>
            )}
          </button>
          <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400 text-decoration-underline">
            Already have an account{" "}
            <Link href="/auth/register">click here</Link>
          </p>

          <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        </form>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
