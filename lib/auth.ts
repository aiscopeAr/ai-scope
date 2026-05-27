import { createHash, timingSafeEqual } from "node:crypto";

import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_ADMIN_EMAIL = "admin@aiscope.local";
const DEFAULT_ADMIN_PASSWORD = "admin123456";

function getAdminEmail() {
  return process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
}

function secureCompare(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();

  return timingSafeEqual(leftHash, rightHash);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@aiscope.local",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const isValidEmail = secureCompare(credentials.email, getAdminEmail());
        const isValidPassword = secureCompare(credentials.password, getAdminPassword());

        if (!isValidEmail || !isValidPassword) {
          return null;
        }

        return {
          id: "admin-user",
          name: "Lumiq Admin",
          email: getAdminEmail(),
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = "role" in user ? user.role : "admin";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = typeof token.role === "string" ? token.role : "admin";
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
