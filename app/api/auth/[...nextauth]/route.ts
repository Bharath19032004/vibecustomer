// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

// Extend the default session user type to include 'id'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };