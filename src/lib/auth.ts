import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyTotp } from "./security";

export { portalPathForRole } from "./auth-redirect";

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
        totpCode: { label: "2FA code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneOrEmail || !credentials.password) return null;
        const identifier = credentials.phoneOrEmail.trim();
        const password = credentials.password;
        const totpCode = String(credentials.totpCode || "").trim();

        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            isActive: true,
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { phone: identifier },
              { phone: identifier.replace(/\s|-/g, "") },
            ],
          },
          include: { supplier: true },
        });
        if (!user) return null;

        const { rateLimit } = await import("./rate-limit");
        const rl = await rateLimit({
          key: `login:${identifier.toLowerCase()}`,
          limit: 10,
          windowMs: 15 * 60_000,
        });
        if (!rl.ok) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.totpEnabled && user.totpSecret) {
          if (!totpCode || !verifyTotp(totpCode, user.totpSecret)) {
            return null;
          }
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email ?? user.phone,
          role: user.role,
          supplierId: user.supplier?.id ?? null,
          supplierStatus: user.supplier?.status ?? null,
          mustChangePassword: user.mustChangePassword,
          totpEnabled: user.totpEnabled,
          isPrimarySuperAdmin: user.isPrimarySuperAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id: string;
          role: string;
          supplierId?: string | null;
          supplierStatus?: string | null;
          mustChangePassword?: boolean;
          totpEnabled?: boolean;
          isPrimarySuperAdmin?: boolean;
        };
        token.id = u.id;
        token.role = u.role;
        token.supplierId = u.supplierId;
        token.supplierStatus = u.supplierStatus;
        token.mustChangePassword = Boolean(u.mustChangePassword);
        token.totpEnabled = Boolean(u.totpEnabled);
        token.isPrimarySuperAdmin = Boolean(u.isPrimarySuperAdmin);
      }
      // Allow client updateSession() after password change / 2FA toggle
      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (typeof session.totpEnabled === "boolean") {
          token.totpEnabled = session.totpEnabled;
        }
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
        (session.user as { mustChangePassword?: boolean }).mustChangePassword = Boolean(
          token.mustChangePassword
        );
        (session.user as { totpEnabled?: boolean }).totpEnabled = Boolean(token.totpEnabled);
        (session.user as { isPrimarySuperAdmin?: boolean }).isPrimarySuperAdmin = Boolean(
          token.isPrimarySuperAdmin
        );
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
