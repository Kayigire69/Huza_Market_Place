import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyTotp } from "./security";
import {
  FARMER_SESSION_DAYS_DEFAULT,
  FARMER_SESSION_DAYS_REMEMBER,
  normalizeRwandaPhone,
  verifyFarmerAccess,
} from "./farmer-auth";

export { portalPathForRole } from "./auth-redirect";

const isProd = process.env.NODE_ENV === "production";
const DAY = 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // Upper bound. Farmer "remember device" uses up to 90 days
    maxAge: FARMER_SESSION_DAYS_REMEMBER * DAY,
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
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

        // Farmers use /farmer/login (phone + NID). Not password login
        if (user.role === "SUPPLIER") {
          throw new Error("USE_FARMER_LOGIN");
        }

        const { rateLimit, clearRateLimit } = await import("./rate-limit");
        const rlKey = `login:${identifier.toLowerCase()}`;
        const rl = await rateLimit({
          key: rlKey,
          limit: 10,
          windowMs: 15 * 60_000,
        });
        if (!rl.ok) {
          throw new Error("RATE_LIMITED");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.totpEnabled && user.totpSecret) {
          if (!totpCode) {
            throw new Error("TOTP_REQUIRED");
          }
          if (!verifyTotp(totpCode, user.totpSecret)) {
            throw new Error("TOTP_INVALID");
          }
        }

        await clearRateLimit(rlKey);

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
          rememberDevice: false,
          authKind: "password" as const,
        };
      },
    }),
    CredentialsProvider({
      id: "farmer-nid",
      name: "Farmer phone + National ID",
      credentials: {
        phone: { label: "Phone", type: "text" },
        nationalIdLast4: { label: "National ID last 4", type: "text" },
        rememberDevice: { label: "Remember device", type: "text" },
      },
      async authorize(credentials) {
        const phone = normalizeRwandaPhone(String(credentials?.phone || ""));
        const nationalIdLast4 = String(credentials?.nationalIdLast4 || "").trim();
        const rememberDevice = String(credentials?.rememberDevice || "") === "true";

        if (!phone || nationalIdLast4.replace(/\D/g, "").length !== 4) return null;

        const { rateLimit, clearRateLimit } = await import("./rate-limit");
        const rlKey = `farmer-login:${phone}`;
        const rl = await rateLimit({
          key: rlKey,
          limit: 12,
          windowMs: 15 * 60_000,
        });
        if (!rl.ok) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            isActive: true,
            role: "SUPPLIER",
            phone,
          },
          include: { supplier: true },
        });
        if (!user?.supplier) return null;

        const ok = verifyFarmerAccess({
          storedNationalId: user.supplier.nationalId,
          nationalIdLast4,
          factor: "nid_last4",
        });
        if (!ok) return null;

        await clearRateLimit(rlKey);

        return {
          id: user.id,
          name: user.fullName,
          email: user.email ?? user.phone,
          role: user.role,
          supplierId: user.supplier.id,
          supplierStatus: user.supplier.status,
          mustChangePassword: false,
          totpEnabled: false,
          isPrimarySuperAdmin: false,
          rememberDevice,
          authKind: "farmer_nid" as const,
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
          rememberDevice?: boolean;
          authKind?: string;
        };
        token.id = u.id;
        token.sub = u.id;
        token.role = u.role;
        token.supplierId = u.supplierId;
        token.supplierStatus = u.supplierStatus;
        token.mustChangePassword = Boolean(u.mustChangePassword);
        token.totpEnabled = Boolean(u.totpEnabled);
        token.isPrimarySuperAdmin = Boolean(u.isPrimarySuperAdmin);
        token.rememberDevice = Boolean(u.rememberDevice);
        token.authKind = u.authKind || "password";
        token.lastDbSync = Date.now();
        token.lastPwSync = Date.now();

        const maxAgeSec =
          u.authKind === "farmer_nid"
            ? (u.rememberDevice ? FARMER_SESSION_DAYS_REMEMBER : FARMER_SESSION_DAYS_DEFAULT) * DAY
            : 8 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSec;
      }

      const uid = (token.id as string) || (token.sub as string);
      if (token.authKind === "farmer_nid" || token.role === "SUPPLIER") {
        token.mustChangePassword = false;
      }

      const lastPwSync = Number(token.lastPwSync || 0);
      if (uid && token.authKind !== "farmer_nid" && token.role !== "SUPPLIER" && Date.now() - lastPwSync > 30_000) {
        const flags = await prisma.user.findUnique({
          where: { id: uid },
          select: { mustChangePassword: true, isActive: true, deletedAt: true },
        });
        if (!flags || !flags.isActive || flags.deletedAt) {
          return { ...token, role: undefined, error: "inactive" };
        }
        token.mustChangePassword = Boolean(flags.mustChangePassword);
        token.lastPwSync = Date.now();
      }

      const lastSync = Number(token.lastDbSync || 0);
      if (uid && Date.now() - lastSync > 5 * 60_000) {
        const dbUser = await prisma.user.findFirst({
          where: { id: uid, deletedAt: null },
          include: { supplier: { select: { id: true, status: true } } },
        });
        if (!dbUser || !dbUser.isActive) {
          return { ...token, role: undefined, error: "inactive" };
        }
        token.role = dbUser.role;
        token.supplierId = dbUser.supplier?.id ?? null;
        token.supplierStatus = dbUser.supplier?.status ?? null;
        if (token.authKind !== "farmer_nid" && dbUser.role !== "SUPPLIER") {
          token.mustChangePassword = Boolean(dbUser.mustChangePassword);
        } else {
          token.mustChangePassword = false;
        }
        token.totpEnabled = Boolean(dbUser.totpEnabled);
        token.isPrimarySuperAdmin = Boolean(dbUser.isPrimarySuperAdmin);
        token.lastDbSync = Date.now();
      }

      if (trigger === "update" && session && uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: uid },
          select: { mustChangePassword: true, totpEnabled: true, isActive: true, deletedAt: true },
        });
        if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
          return { ...token, role: undefined, error: "inactive" };
        }
        if (token.authKind !== "farmer_nid" && token.role !== "SUPPLIER") {
          token.mustChangePassword = Boolean(dbUser.mustChangePassword);
        } else {
          token.mustChangePassword = false;
        }
        token.totpEnabled = Boolean(dbUser.totpEnabled);
        token.lastDbSync = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.error === "inactive") {
        return { ...session, user: undefined as never };
      }
      if (session.user) {
        const uid = (token.id as string) || (token.sub as string);
        (session.user as { id?: string }).id = uid;
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
  cookies: {
    sessionToken: {
      name: isProd ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        maxAge: FARMER_SESSION_DAYS_REMEMBER * DAY,
      },
    },
  },
  useSecureCookies: isProd,
  secret: process.env.NEXTAUTH_SECRET,
};
