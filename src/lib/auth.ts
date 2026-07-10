import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phoneOrEmail: { label: "Phone or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneOrEmail || !credentials.password) return null;
        const identifier = credentials.phoneOrEmail.trim();
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }],
          },
          include: { supplier: true },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.fullName,
          email: user.email ?? user.phone,
          role: user.role,
          supplierId: user.supplier?.id ?? null,
          supplierStatus: user.supplier?.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: string;
          supplierId?: string | null;
          supplierStatus?: string | null;
        };
        token.id = u.id;
        token.role = u.role;
        token.supplierId = u.supplierId;
        token.supplierStatus = u.supplierStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { supplierId?: string | null }).supplierId =
          (token.supplierId as string | null) ?? null;
        (session.user as { supplierStatus?: string | null }).supplierStatus =
          (token.supplierStatus as string | null) ?? null;
      }
      return session;
    },
  },
};
