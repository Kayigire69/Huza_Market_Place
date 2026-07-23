import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";
import {
  deleteAllNotifications,
  deleteFailedTestOrders,
  deleteOrdersByIds,
  deleteStockMovementsForSoftDeletedProducts,
  getCleanupSummary,
  hardDeleteCustomer,
  hardDeleteFarmer,
  listCleanupFarmers,
  purgeSoftDeletedProducts,
  softDeleteProductsByIds,
  softRemoveFarmer,
} from "@/services/cleanup.service";
import {
  archiveCustomer,
  archiveDuplicateInventory,
  archiveTestInventory,
  deleteOldNotifications,
  deleteReadNotifications,
  deleteTestNotifications,
  getTestDataCounts,
  listArchivedRecords,
  listCleanupCustomersActive,
  listCleanupOrdersFiltered,
  previewCleanupWizard,
  restoreCustomer,
  restoreFarmer,
  restoreProduct,
  runCleanupWizard,
  type WizardSelection,
} from "@/services/cleanup-maintenance.service";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) return null;
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
    return NextResponse.json({ customers: await listCleanupCustomersActive(q) });
  }
  if (view === "farmers") {
    const includeRemoved = url.searchParams.get("includeRemoved") === "1";
    return NextResponse.json({
      farmers: await listCleanupFarmers(q, { includeRemoved }),
    });
  }
  if (view === "orders") {
    return NextResponse.json({
      orders: await listCleanupOrdersFiltered({ q, onlySafe: true }),
    });
  }
  if (view === "archived") {
    return NextResponse.json(await listArchivedRecords());
  }
  if (view === "test_counts") {
    return NextResponse.json({ counts: await getTestDataCounts() });
  }
  if (view === "wizard_preview") {
    const sel: WizardSelection = {
      testCustomers: url.searchParams.get("testCustomers") === "1",
      testFarmers: url.searchParams.get("testFarmers") === "1",
      testOrders: url.searchParams.get("testOrders") === "1",
      testInventory: url.searchParams.get("testInventory") === "1",
      readNotifications: url.searchParams.get("readNotifications") === "1",
    };
    return NextResponse.json({ preview: await previewCleanupWizard(sel) });
  }

  const [summary, testCounts] = await Promise.all([
    getCleanupSummary(),
    getTestDataCounts(),
  ]);
  return NextResponse.json({ summary, testCounts });
}

export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const action = String(body.action || "");

  try {
    if (action === "wizard_preview") {
      const sel = (body.selection || {}) as WizardSelection;
      return NextResponse.json({ preview: await previewCleanupWizard(sel) });
    }

    if (action === "wizard_run") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const sel = (body.selection || {}) as WizardSelection;
      const result = await runCleanupWizard(sel);
      await auditAdminAction(req, session, {
        action: "cleanup.wizard_run",
        entity: "System",
        details: `Wizard cleanup completed`,
        after: result.results,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "archive_customer") {
      const err = requireConfirm(body, "ARCHIVE");
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const id = String(body.id || "");
      const result = await archiveCustomer(id);
      await auditAdminAction(req, session, {
        action: "cleanup.archive_customer",
        entity: "User",
        entityId: id,
        details: `Archived customer ${result.fullName}`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "restore_customer") {
      const id = String(body.id || "");
      const result = await restoreCustomer(id);
      await auditAdminAction(req, session, {
        action: "cleanup.restore_customer",
        entity: "User",
        entityId: id,
        details: `Restored customer ${result.fullName}`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "restore_farmer") {
      const id = String(body.id || "");
      const result = await restoreFarmer(id);
      await auditAdminAction(req, session, {
        action: "cleanup.restore_farmer",
        entity: "Supplier",
        entityId: id,
        details: `Restored farmer ${result.businessName}`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "restore_product") {
      const id = String(body.id || "");
      const result = await restoreProduct(id);
      await auditAdminAction(req, session, {
        action: "cleanup.restore_product",
        entity: "Product",
        entityId: id,
        details: `Restored product ${result.nameEn}`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

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
          details: `Archived farmer ${result.businessName}`,
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
          return NextResponse.json({ error: message, suggestion: "soft" }, { status: 409 });
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
        details: `Deleted ${count} order(s)`,
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

    if (action === "delete_read_notifications") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const count = await deleteReadNotifications();
      await auditAdminAction(req, session, {
        action: "cleanup.delete_read_notifications",
        entity: "Notification",
        details: `Deleted ${count} read notification(s)`,
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "delete_old_notifications") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const days = Number(body.days) || 30;
      const count = await deleteOldNotifications(days);
      await auditAdminAction(req, session, {
        action: "cleanup.delete_old_notifications",
        entity: "Notification",
        details: `Deleted ${count} notification(s) older than ${days} days`,
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "delete_test_notifications") {
      const err = requireConfirm(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const count = await deleteTestNotifications();
      await auditAdminAction(req, session, {
        action: "cleanup.delete_test_notifications",
        entity: "Notification",
        details: `Deleted ${count} test-user notification(s)`,
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
        details: `Deleted ${count} stock movement(s) for archived products`,
      });
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "archive_duplicate_inventory") {
      const err = requireConfirm(body, "ARCHIVE");
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const count = await archiveDuplicateInventory();
      await auditAdminAction(req, session, {
        action: "cleanup.archive_duplicate_inventory",
        entity: "Product",
        details: `Archived ${count} duplicate product(s)`,
      });
      return NextResponse.json({ ok: true, archived: count });
    }

    if (action === "archive_test_inventory") {
      const err = requireConfirm(body, "ARCHIVE");
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const count = await archiveTestInventory();
      await auditAdminAction(req, session, {
        action: "cleanup.archive_test_inventory",
        entity: "Product",
        details: `Archived ${count} test/demo product(s)`,
      });
      return NextResponse.json({ ok: true, archived: count });
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
        details: `Archived ${count} product(s)`,
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
