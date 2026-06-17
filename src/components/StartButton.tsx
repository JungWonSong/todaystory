"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type StartButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function StartButton({ children, className }: StartButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <button
      type="button"
      onClick={() => router.push(user ? "/stories" : "/login")}
      className={className}
    >
      {children}
    </button>
  );
}
