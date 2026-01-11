import { type Metadata } from "next";
import { ClerkProvider,SignedOut,SignInButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { AuthHeader } from "@/components/auth-header";
import Authenticated from "./authenticated";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Big City",
  description: "Your guide to the city of Toronto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
        >
          <Providers>
            <Authenticated>
              <AuthHeader />
              {children}
            </Authenticated>
            <SignedOut>
              <SignInButton />
            </SignedOut>
          </Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
