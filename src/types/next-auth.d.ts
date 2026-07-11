import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      supplierId?: string | null;
      supplierStatus?: string | null;
      mustChangePassword?: boolean;
      totpEnabled?: boolean;
      isPrimarySuperAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    supplierId?: string | null;
    supplierStatus?: string | null;
    mustChangePassword?: boolean;
    totpEnabled?: boolean;
    isPrimarySuperAdmin?: boolean;
  }
}
