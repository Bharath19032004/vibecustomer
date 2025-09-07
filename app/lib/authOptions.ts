// app/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma"; // Import the shared instance

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Find user in DB
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) return null;

          const isPasswordCorrect = await compare(credentials.password, user.password);

          if (!isPasswordCorrect) return null;

          // Return only essential fields (for JWT/session)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // JWT callback - runs whenever JWT is accessed
    async jwt({ token, user }) {
      // If this is the first time JWT is created (user just signed in)
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }

      // For subsequent requests, get fresh user data from DB
      if (token.user && typeof token.user === "object" && "email" in token.user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.user.email as string },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });

          if (dbUser) {
            token.user = dbUser;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },

    // Session callback - runs when session is accessed
    async session({ session, token }) {
      // Pass user data from JWT to session
      if (token.user && typeof token.user === "object") {
        const user = token.user as { id?: string; email?: string; name?: string };
        session.user = {
          id: user.id || "",
          email: user.email || "",
          name: user.name || null,
        };
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};