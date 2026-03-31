"use client";
import { Input } from "@/components/ui/ac-input";
import { Label } from "@/components/ui/ac-label";
import { strapi } from "@/lib/api/sdk";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
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
      const res = await strapi.register({
        username: `${name}${Math.floor(Math.random() * 10000)}`,
        email,
        password,
      });
      if (res?.user) {
        const res = await signIn("credentials", {
          redirect: false,
          identifier: email,
          password,
        });
        if (res?.ok) {
          toast.success("Register successful");
          const redirectRoute =
            JSON.parse(localStorage.getItem("redirectRoute")!)! || "/";
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
    <div className="flex justify-center items-center h-screen">
      <div className="shadow-input mt-10 mx-auto w-full max-w-md rounded-none bg-trabsparent p-4 md:rounded-2xl md:p-8 backdrop-blur-3xl">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome to AI Interviewer!
        </h2>
        <form className="my-8" onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="fullname">Full Name</Label>
              <Input id="fullname" placeholder="Tony" type="text" required />
            </LabelInputContainer>
          </div>
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
            <Input id="password" placeholder="••••••••" type="password" />
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
                SignUp &rarr;
                <BottomGradient />
              </>
            )}
          </button>
          <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400 text-decoration-underline">
            Don't Have Any Account <Link href="/auth/login">Login here</Link>
          </p>

          <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

          {/* <div className="flex flex-col space-y-4">
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="submit"
          >
            <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              GitHub
            </span>
            <BottomGradient />
          </button>
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="submit"
          >
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Google
            </span>
            <BottomGradient />
          </button>
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="submit"
          >
            <IconBrandOnlyfans className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              OnlyFans
            </span>
            <BottomGradient />
          </button>
        </div> */}
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
