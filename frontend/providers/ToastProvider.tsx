"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        className: "liquid-toast",
        style: {
          background:
            "linear-gradient(145deg, rgba(30, 41, 59, 0.42), rgba(15, 23, 42, 0.34))",
          color: "#f8fafc",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          borderRadius: "16px",
          padding: "14px 18px",
          boxShadow:
            "0 18px 48px rgba(2, 6, 23, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(30px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",
        },
        success: {
          className: "liquid-toast liquid-toast--success",
          iconTheme: {
            primary: "#34d399",
            secondary: "#052e2b",
          },
        },
        error: {
          className: "liquid-toast liquid-toast--error",
          iconTheme: {
            primary: "#fb7185",
            secondary: "#4c0519",
          },
        },
      }}
    />
  );
}
