import { SignedIn } from "@clerk/nextjs";
export default function Authenticated({ children }: { children: React.ReactNode }) {
  return (
    <SignedIn>
      {children}
    </SignedIn>
  );
}