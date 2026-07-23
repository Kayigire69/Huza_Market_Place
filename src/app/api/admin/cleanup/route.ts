import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageStaff } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";
import {
  deleteAllNotifications,
  deleteFailedTestOrders,
  deleteOrdersByIds,
  deleteStockMovementsForSoftDeletedProducts,
  getCleanupSummary,
  hardDeleteCustomer,
  hardDeleteFarmer,
  listCleanupCustomers,
  listCleanupFarmers,
  listCleanupOrders,
  purgeSoftDeletedProducts,
  softDeleteProductsByIds,
  softRemoveFarmer,
} from "@/services/cleanup.service";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageStaff(session.user.role)) return null;
  if (session.user.mustChangePassword) return null;
  return session;
}

function requireConfirm(body: { confirm?: string }, expected = "DELETE") {
  const confirm = String(body.confirm || "").trim();
  if (confirm !== expected) {
    return `Type ${expected} to confirm`;
  }
  return null;
}

export async function GET(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "summary";
  const q = url.searchParams.get("q") || "";

  if (view === "customers") {
    return NextResponse.json({ customers: await listCleanupCustomers(q) });
  }
  if (view === "farmers") {
    const includeRemoved = url.searchParams.get("includeRemoved") === "1";
    return NextResponse.json({
      farmers: await listCleanupFarmers(q, { includeRemoved }),
    });
  }
  if (view === "orders") {
    return NextResponse.json({ orders: await listCleanupOrders() });
  }

  return NextResponse.json({ summary: await getCleanupSummary() });
}

export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const action = String(body.action || "");

  try {
    if (action === "delete_customer") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await hardDeleteCustomer(id);
      await auditAdminAction(req, session, {
        action: "cleanup.delete_customer",
        entity: "User",
        entityId: id,
        details: `Permanently deleted customer ${result.fullName}`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "delete_customers") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
      if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
      const deleted: string[] = [];
      const errors: string[] = [];
      for (const id of ids) {
        try {
          const r = await hardDeleteCustomer(id);
          deleted.push(r.fullName);
        } catch (e) {
          errors.push(e instanceof Error ? e.message : "Failed");
        }
      }
      await auditAdminAction(req, session, {
        action: "cleanup.delete_customers",
        entity: "User",
        details: `Deleted ${deleted.length} customer(s)`,
        after: { deleted, errors },
      });
      return NextResponse.json({ ok: true, deleted: deleted.length, errors });
    }

    if (action === "delete_farmer") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const id = String(body.id || "");
      const soft = Boolean(body.soft);
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      if (soft) {
        const result = await softRemoveFarmer(id);
        await auditAdminAction(req, session, {
          action: "cleanup.soft_remove_farmer",
          entity: "Supplier",
          entityId: id,
          details: `Soft-removed farmer ${result.businessName}`,
        });
        return NextResponse.json({ ok: true, mode: "soft", ...result });
      }
      try {
        const result = await hardDeleteFarmer(id);
        await auditAdminAction(req, session, {
          action: "cleanup.delete_farmer",
          entity: "Supplier",
          entityId: id,
          details: `Permanently deleted farmer ${result.businessName}`,
        });
        return NextResponse.json({ ok: true, mode: "hard", ...result });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Delete failed";
        if (message.includes("sales history")) {
          return NextResponse.json(
            {
              error: message,
              suggestion: "soft",
            },
            { status: 409 }
          );
        }
        throw e;
      }
    }

    if (action === "delete_orders") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
      const count = ids.length
        ? await deleteOrdersByIds(ids)
        : await deleteFailedTestOrders();
      await auditAdminAction(req, session, {
        action: "cleanup.delete_orders",
        entity: "Order",
        details: `Deleted ${count} order(s) (payments cascade)`,
        after: { count, ids },
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "delete_notifications") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const count = await deleteAllNotifications();
      await auditAdminAction(req, session, {
        action: "cleanup.delete_notifications",
        entity: "Notification",
        details: `Deleted ${count} notification(s)`,
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "delete_inventory_movements") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const count = await deleteStockMovementsForSoftDeletedProducts();
      await auditAdminAction(req, session, {
        action: "cleanup.delete_inventory_movements",
        entity: "StockMovement",
        details: `Deleted ${count} stock movement(s) for soft-deleted products`,
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "soft_delete_products") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
      if (!ids.length) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      const count = await softDeleteProductsByIds(ids);
      await auditAdminAction(req, session, {
        action: "cleanup.soft_delete_products",
        entity: "Product",
        details: `Soft-deleted ${count} product(s)`,
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "purge_soft_deleted_products") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const result = await purgeSoftDeletedProducts();
      await auditAdminAction(req, session, {
        action: "cleanup.purge_soft_deleted_products",
        entity: "Product",
        details: `Hard-deleted ${result.hardDeleted}; kept ${result.keptSoft} with sales history`,
        after: result,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cleanup failed" },
      { status: 400 }
    );
  }
}
