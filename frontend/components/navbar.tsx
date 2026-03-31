"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "./theme-toggle";

const Navbar = () => {
  const { data: session } = useSession() as any;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/roadmap-chat", label: "Our Services" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/reports", label: "Reports" },
    { href: "/jobs", label: "Career Jobs" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed left-1/2 top-6 z-50 w-full max-w-5xl -translate-x-1/2 px-4 font-sans"
    >
      <div
        className="flex items-center justify-between rounded-[2rem] border border-white/10 
        bg-white/5 dark:bg-slate-900/20 shadow-2xl backdrop-blur-2xl px-6 py-4 transition-all duration-500"
      >
        {/* --- Logo --- */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white dark:text-white hover:opacity-90 transition-opacity z-50 group"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-1.5 relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-70"></div>
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tighter">
            Neura<span className="text-blue-500 font-black">View</span>
          </span>
        </Link>

        {/* --- Desktop Navigation Links --- */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-[13px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? "text-blue-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
                {isActive && (
                  <motion.span 
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 w-full h-[2px] bg-blue-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* --- Desktop Auth Buttons & Theme Toggle --- */}
        <div className="hidden md:flex items-center gap-4">
          {session?.user?.id ? (
            <>
              <Link
                href="/create-interview"
                className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-tighter
                text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 
                hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-95"
              >
                Start Practice
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 transition-all"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-2.5 shadow-xl hover:bg-slate-100 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* --- Mobile Menu Button & Theme Toggle --- */}
        <div className="flex md:hidden items-center gap-2 z-50">
          {/* <ThemeToggle /> */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu Dropdown --- */}
      <div
        className={`md:hidden mt-2 rounded-2xl border border-white/10 
        bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95 
        dark:from-gray-900/98 dark:via-gray-800/95 dark:to-gray-900/98
        shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-4 space-y-3">
          {/* Mobile Navigation Links */}
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobileMenu}
                className={`block px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* Mobile Auth Buttons */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            {session?.user?.id ? (
              <>
                <Link
                  href="/create-interview"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-center
                  text-white bg-gradient-to-r from-green-600 to-emerald-500 
                  hover:from-green-500 hover:to-emerald-400 transition-all shadow-lg shadow-green-600/20"
                >
                  Start Interview
                </Link>

                <button
                  onClick={() => {
                    closeMobileMenu();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm 
                  font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-center text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 
                  text-sm font-semibold text-black px-4 py-2.5 text-center shadow-md hover:opacity-90 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
