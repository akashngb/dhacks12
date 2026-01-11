"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

export function AuthHeader() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <SignedOut>
        <SignInButton>
          <Button>Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-4 h-full justify-center" suppressHydrationWarning>
          <div className="flex items-center h-full">
            <Link href="/new" className="text-2xl font-bold flex items-center h-full">
              <PlusIcon className="size-5 hover:cursor-pointer" />
            </Link>
          </div>
          <UserButton />
        </div>
      </SignedIn>
    </div>
  );
}
