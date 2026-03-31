"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        success: {
          style: {
            background: "#4ade80", // green
            color: "#fff",
          },
        },
        error: {
          style: {
            background: "#ef4444", // red
            color: "#fff",
          },
        },
      }}
    />
  );
}
