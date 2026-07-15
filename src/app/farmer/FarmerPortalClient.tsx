"use client";

import { FormEvent, startTransition, useEffect, useState } from "react";
import Image from "next/image";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import {
  FIELD_TYPES,
  PAYMENT_OPTIONS,
  PRICE_UNITS,
  QUALITY_LEVELS,
} from "@/lib/farmer-dossier";
import {
  fieldTypeLabelKey,
  paymentLabelKey,
  qualityLabelKey,
} from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { FarmerDossierForm, type FarmerDossierValues } from "./FarmerDossierForm";

type Category = { id: string; nameEn: string; slug: string };
type ProductImage = { id?: string; url: string; alt?: string | null };

type ProductRow = {
  id: string;
  nameEn: string;
  descriptionEn?: string;
  price: number;
  unit: string;
  stockQty: number;
  lowStockAt: number;
  isActive: boolean;
  isOrganic: boolean;
  reviewStatus?: string;
  reviewNote?: string | null;
  reviewedAt?: string | Date | null;
  qualityGeneral?: string | null;
  fieldType?: string | null;
  currentCrop?: string | null;
  category?: { nameEn: string } | null;
  images?: ProductImage[];
};

type Farmer = FarmerDossierValues & {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  sector: string | null;
  phone: string;
  email: string | null;
  nationalId: string | null;
  farmSize: string | null;
  status: string;
  farmingType?: string | null;
  productsOffered?: string | null;
  huzaPurchaseAgreement?: string | null;
  agreedToHuzaTerms?: boolean;
  products?: ProductRow[];
  user?: { fullName?: string } | null;
};

type Tab = "dossier" | "agreement" | "products" | "inventory" | "orders";

/** Workspace IA panels mapped onto the existing farmer client sections */
export type FarmerPanelKey =
  | "profile"
  | "products"
  | "submit"
  | "approvals"
  | "orders"
  | "payments"
  | "inventory";

type PurchaseOrderRow = {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  qualityNotes: string | null;
  rejectionReason: string | null;
  inspectedAt: string | null;
  paymentStatus: string | null;
  paidAt?: string | null;
  paymentRef?: string | null;
  createdAt: string;
};

function panelToTab(panel: FarmerPanelKey | undefined, isOrganic: boolean): Tab {
  if (!panel) return isOrganic ? "dossier" : "agreement";
  switch (panel) {
    case "profile":
      return isOrganic ? "dossier" : "agreement";
    case "products":
    case "submit":
    case "approvals":
      return "products";
    case "orders":
    case "payments":
      return "orders";
    case "inventory":
      return "inventory";
    default:
      return isOrganic ? "dossier" : "agreement";
  }
}

async function uploadPhotos(files: FileList | File[]): Promise<string[]> {
  const list = Array.from(files);
  if (list.length === 0) return [];
  const form = new FormData();
  list.forEach((f) => form.append("files", f));
  form.append("folder", "products");
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Photo upload failed");
  return Array.isArray(data.urls) ? data.urls : [];
}

async function uploadOne(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  form.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls[0] as string;
}

export function FarmerPortalClient({
  farmer,
  categories,
  purchaseOrders = [],
  panel,
}: {
  farmer: Farmer;
  categories: Category[];
  purchaseOrders?: PurchaseOrderRow[];
  /** When set, hides legacy pill tabs and shows the matching workspace section. */
  panel?: FarmerPanelKey;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const isOrganicFarmer = farmer.farmingType !== "STANDARD";
  const workspaceMode = Boolean(panel);
  const [tab, setTab] = useState<Tab>(() => panelToTab(panel, isOrganicFarmer));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>(farmer.products || []);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const TABS: { key: Tab; label: string }[] = isOrganicFarmer
    ? [
        { key: "dossier", label: t("farmerInformation") },
        { key: "products", label: t("productsAndPhotos") },
        { key: "orders", label: "Huza orders & payments" },
        { key: "inventory", label: t("inventoryTab") },
      ]
    : [
        { key: "agreement", label: t("huzaAgreementTab") },
        { key: "products", label: t("productsAndPhotos") },
        { key: "orders", label: "Huza orders & payments" },
        { key: "inventory", label: t("inventoryTab") },
      ];

  const refresh = () => startTransition(() => router.refresh());
  const approved = farmer.status === "APPROVED";

  useEffect(() => {
    if (panel) setTab(panelToTab(panel, isOrganicFarmer));
  }, [panel, isOrganicFarmer]);

  useEffect(() => {
    setProducts(farmer.products || []);
  }, [farmer.products]);

  const loadProducts = async () => {
    const res = await fetch("/api/supplier/products");
    const data = await res.json();
    if (Array.isArray(data)) setProducts(data);
  };

  const createProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!approved) {
      setMsg(t("waitAdminApproval"));
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const form = new FormData(e.currentTarget);
      const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
      if (photos.length === 0) {
        setMsg(t("addProductPhoto"));
        setBusy(false);
        return;
      }
      const imageUrls = await uploadPhotos(photos);
      let proofOfPaymentUrl = String(form.get("proofOfPaymentUrl") || "");
      const proof = form.get("proofOfPayment");
      if (proof instanceof File && proof.size > 0) {
        proofOfPaymentUrl = await uploadOne(proof, "documents");
      }

      const payload = Object.fromEntries(form.entries());
      delete payload.photos;
      delete payload.proofOfPayment;

      const res = await fetch("/api/supplier/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          price: Number(payload.pricePerUnit || payload.price || 0),
          stockQty: Number(payload.stockQty || payload.totalQuantityHarvested || 0),
          isOrganic: isOrganicFarmer && form.get("isOrganic") === "on",
          originDistrict: payload.originDistrict || farmer.district,
          imageUrls,
          proofOfPaymentUrl,
          pricePerUnit: Number(payload.pricePerUnit || 0),
          farmGatePrice: payload.farmGatePrice ? Number(payload.farmGatePrice) : null,
          priceUponDelivery: payload.priceUponDelivery
            ? Number(payload.priceUponDelivery)
            : null,
          priceAfterSale: payload.priceAfterSale ? Number(payload.priceAfterSale) : null,
          totalKgsBoughtByHuza: payload.totalKgsBoughtByHuza
            ? Number(payload.totalKgsBoughtByHuza)
            : 0,
        }),
      });
      const data = await res.json();
      setMsg(res.ok ? t("productSubmitted") : data.error || t("uploadFailed"));
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        setPhotoPreviews([]);
        await loadProducts();
        refresh();
        if (panel === "submit") {
          startTransition(() => router.push("/farmer/approvals"));
        }
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const updateStock = async (id: string, stockQty: number) => {
    setBusy(true);
    const res = await fetch(`/api/supplier/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? t("inventoryUpdated") : data.error || t("updateFailed"));
    if (res.ok) {
      await loadProducts();
      refresh();
    }
  };

  const dossierInitial: FarmerDossierValues = {
    ...farmer,
    fullName: farmer.user?.fullName || farmer.businessName,
  };

  return (
    <div>
      {!workspaceMode && (
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === key
                  ? "bg-[var(--huza-green)] text-white"
                  : "bg-white border border-[var(--huza-line)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "dossier" && isOrganicFarmer && (
        <div>
          <p className="mb-4 text-sm text-[var(--huza-muted)]">{t("dossierIntro")}</p>
          <FarmerDossierForm initial={dossierInitial} onSaved={refresh} />
        </div>
      )}

      {tab === "agreement" && !isOrganicFarmer && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-lg">{t("huzaAgreementTab")}</h2>
          <p className="text-sm text-[var(--huza-muted)]">{t("standardAgreementIntro")}</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">{t("fullNameContact")}</p>
              <p className="font-medium">{farmer.user?.fullName || farmer.businessName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">{t("nationalIdOrReg")}</p>
              <p className="font-medium">{farmer.nationalId || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">{t("phone")}</p>
              <p className="font-medium">{farmer.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">{t("farmBusinessName")}</p>
              <p className="font-medium">{farmer.businessName}</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">{t("productsOfferedLabel")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{farmer.productsOffered || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">
              {t("huzaPurchaseAgreementLabel")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{farmer.huzaPurchaseAgreement || "—"}</p>
          </div>
          <p className="text-xs text-[var(--huza-green-dark)] font-medium">
            {farmer.agreedToHuzaTerms ? t("huzaTermsAccepted") : t("huzaTermsPending")}
          </p>
          <p className="text-xs text-[var(--huza-muted)]">{t("standardAgreementEditHint")}</p>
        </div>
      )}

      {tab === "products" && (
        <div
          className={
            panel === "submit" || panel === "approvals" || panel === "products"
              ? "space-y-6"
              : "grid lg:grid-cols-2 gap-6"
          }
        >
          {(panel === "submit" || !panel) && (
          <form
            onSubmit={createProduct}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4 max-w-2xl"
          >
            {panel === "submit" ? (
              <>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
                  {(isOrganicFarmer
                    ? ["1 · Crop & photos", "2 · Volume & price", "3 · Field details"]
                    : ["1 · Crop & photos", "2 · Volume & price"]
                  ).map((step) => (
                    <span
                      key={step}
                      className="rounded-full bg-[var(--huza-mint)] px-2.5 py-1 text-[var(--huza-green-dark)]"
                    >
                      {step}
                    </span>
                  ))}
                </div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
                  Harvest details for Youth Huza
                </h2>
                <p className="text-sm text-[var(--huza-muted)]">
                  Focus on <strong>one crop</strong> and the <strong>quantity you can supply</strong>. Clear
                  photos and honest stock help acceptance.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-semibold">{t("submitProductTitle")}</h2>
                <p className="text-xs text-[var(--huza-muted)]">
                  {isOrganicFarmer ? t("submitProductHint") : t("submitProductHintStandard")}
                </p>
              </>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                {panel === "submit" ? "Crop & photos" : t("productsAndPhotos")}
              </h3>
              <label className="block text-xs font-semibold text-[var(--huza-muted)]">
                Crop name
                <input
                  name="nameEn"
                  placeholder={t("productCropName")}
                  className="input-field mt-1"
                  required
                />
              </label>
              <textarea
                name="descriptionEn"
                placeholder={
                  panel === "submit"
                    ? "Short harvest note (variety, readiness, location)…"
                    : t("shortDescription")
                }
                className="input-field min-h-16"
              />
              <select name="categoryId" className="input-field" required>
                <option value="">{t("selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
              <label className="block text-xs font-semibold text-[var(--huza-muted)]">
                Harvest photos (required)
                <input
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="input-field mt-1"
                  required
                  onChange={(e) =>
                    setPhotoPreviews(
                      e.target.files ? Array.from(e.target.files).map((f) => URL.createObjectURL(f)) : []
                    )
                  }
                />
              </label>
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photoPreviews.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="h-16 w-full rounded object-cover" />
                  ))}
                </div>
              )}
            </div>

            {isOrganicFarmer && (
              <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
                <h3 className="text-sm font-semibold">
                  {panel === "submit" ? "Field details (organic path)" : t("fieldInformation")}
                </h3>
                <select name="fieldType" className="input-field" defaultValue={farmer.fieldType || ""} required>
                  <option value="">{t("greenhouseOrOpen")}</option>
                  {FIELD_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {t(fieldTypeLabelKey[f])}
                    </option>
                  ))}
                </select>
                <input
                  name="fieldSize"
                  className="input-field"
                  placeholder={t("size")}
                  defaultValue={farmer.farmSize || ""}
                  required
                />
                <input
                  name="pastCropsSeason1"
                  className="input-field"
                  placeholder={t("pastCrops1")}
                  defaultValue={farmer.pastCropsSeason1 || ""}
                />
                <input
                  name="pastCropsSeason2"
                  className="input-field"
                  placeholder={t("pastCrops2")}
                  defaultValue={farmer.pastCropsSeason2 || ""}
                />
                <input
                  name="pastCropsSeason3"
                  className="input-field"
                  placeholder={t("pastCrops3")}
                  defaultValue={farmer.pastCropsSeason3 || ""}
                />
                <input
                  name="currentCrop"
                  className="input-field"
                  placeholder={t("currentCrop")}
                  defaultValue={farmer.currentCrop || ""}
                  required
                />
                <input
                  name="chemicalsPerWeek"
                  className="input-field"
                  placeholder={t("chemicalsPerWeek")}
                />
                <input name="chemicalsWhy" className="input-field" placeholder={t("chemicalsWhy")} />
                <input name="chemicalsDosage" className="input-field" placeholder={t("dosage")} />
                <input
                  name="fertilizerPerWeek"
                  className="input-field"
                  placeholder={t("fertilizerPerWeek")}
                />
                <input
                  name="irrigationMethod"
                  className="input-field"
                  placeholder={t("irrigationMethod")}
                />
                <input
                  name="diseasesIdentified"
                  className="input-field"
                  placeholder={t("diseasesIdentified")}
                />
                <input
                  name="pestsIdentified"
                  className="input-field"
                  placeholder={t("pestsIdentified")}
                />
              </div>
            )}

            {isOrganicFarmer ? (
              <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
                <h3 className="text-sm font-semibold">
                  {panel === "submit" ? "Volume available for Huza" : t("productionInformation")}
                </h3>
                {panel === "submit" ? (
                  <p className="text-xs text-[var(--huza-muted)]">
                    Enter large supply volumes clearly (kg / crates). This is what Huza buys from you.
                  </p>
                ) : null}
                <input
                  name="totalQuantityHarvested"
                  className="input-field"
                  placeholder={t("totalQuantityHarvested")}
                  required
                />
                <select name="qualityGeneral" className="input-field" required>
                  <option value="">{t("qualityInGeneral")}</option>
                  {QUALITY_LEVELS.map((q) => (
                    <option key={q} value={q}>
                      {t(qualityLabelKey[q])}
                    </option>
                  ))}
                </select>
                <label className="block text-xs font-semibold text-[var(--huza-muted)]">
                  Available quantity for purchase
                  <input
                    name="stockQty"
                    type="number"
                    min={0}
                    className="input-field mt-1 text-lg font-semibold"
                    placeholder={t("availableStockQty")}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
                <h3 className="text-sm font-semibold">
                  {panel === "submit" ? "Volume & asking price" : t("simpleProductDetails")}
                </h3>
                <p className="text-xs text-[var(--huza-muted)]">
                  {panel === "submit"
                    ? "Tell Huza how much you can supply of this one crop, and your price per unit."
                    : t("standardProductFormHint")}
                </p>
                <label className="block text-xs font-semibold text-[var(--huza-muted)]">
                  Available quantity
                  <input
                    name="stockQty"
                    type="number"
                    min={0}
                    className="input-field mt-1 text-lg font-semibold"
                    placeholder={t("availableStockQty")}
                    required
                  />
                </label>
                <select name="priceUnit" className="input-field" defaultValue="kg">
                  {PRICE_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t("pricePer")} {u}
                    </option>
                  ))}
                </select>
                <input
                  name="pricePerUnit"
                  type="number"
                  className="input-field"
                  placeholder={t("priceRwf")}
                  required
                />
              </div>
            )}

            {isOrganicFarmer && (
              <>
                <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
                  <h3 className="text-sm font-semibold">{t("sales")}</h3>
                  <select name="priceUnit" className="input-field" defaultValue="kg">
                    {PRICE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {t("pricePer")} {u}
                      </option>
                    ))}
                  </select>
                  <input
                    name="pricePerUnit"
                    type="number"
                    className="input-field"
                    placeholder={t("priceRwf")}
                    required
                  />
                  <input
                    name="totalKgsBoughtByHuza"
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder={t("totalKgsBoughtByHuza")}
                    defaultValue={0}
                  />
                </div>

                <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
                  <h3 className="text-sm font-semibold">{t("paymentOptions")}</h3>
                  <select name="paymentOption" className="input-field" required>
                    <option value="">{t("selectPaymentOption")}</option>
                    {PAYMENT_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {t(paymentLabelKey[p.value])}
                      </option>
                    ))}
                  </select>
                  <input
                    name="farmGatePrice"
                    type="number"
                    className="input-field"
                    placeholder={t("farmGatePrice")}
                  />
                  <input
                    name="priceUponDelivery"
                    type="number"
                    className="input-field"
                    placeholder={t("priceUponDelivery")}
                  />
                  <input
                    name="priceAfterSale"
                    type="number"
                    className="input-field"
                    placeholder={t("priceAfterSale")}
                  />
                  <div>
                    <label className="label">{t("proofOfPayment")}</label>
                    <input
                      name="proofOfPayment"
                      type="file"
                      accept="image/*,application/pdf"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
                  <h3 className="text-sm font-semibold">{t("comments")}</h3>
                  <textarea
                    name="farmerComments"
                    className="input-field min-h-20"
                    placeholder={t("commentsForHuza")}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input name="isOrganic" type="checkbox" defaultChecked /> {t("organic")}
                </label>
              </>
            )}

            {!isOrganicFarmer && (
              <p className="text-xs text-[var(--huza-muted)] rounded-lg bg-[var(--huza-mint)] px-3 py-2">
                {t("standardProductNotOrganicNote")}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || !approved}>
              {busy
                ? t("submitting")
                : panel === "submit"
                  ? "Submit harvest for review"
                  : t("submitProductCta")}
            </Button>
            {panel === "submit" ? (
              <p className="text-center text-xs text-[var(--huza-muted)]">
                After submit you&apos;ll go to Approval Status to track Youth Huza review.
              </p>
            ) : null}
            {!approved && (
              <p className="text-xs text-[var(--huza-muted)]">{t("waitApprovalProducts")}</p>
            )}
          </form>
          )}

          {(panel === "products" || !panel) && (
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">
              {panel === "approvals" ? "Approval status" : t("submittedProducts")}
            </h2>
            {panel === "products" && (
              <p className="mb-4 text-sm text-[var(--huza-muted)]">
                Your submitted crops and stock. Use Submit Product to add new listings.
              </p>
            )}
            {panel === "approvals" && (
              <p className="mb-4 text-sm text-[var(--huza-muted)]">
                Track Huza quality review for each crop. Rejected items show feedback so you can improve
                next harvest.
              </p>
            )}
            <div className="space-y-3 max-h-[720px] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">{t("noProductsYet")}</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--huza-mint)]">
                        {p.images?.[0]?.url ? (
                          <OptimizedImage
                            src={p.images[0].url}
                            alt={p.nameEn}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{p.nameEn}</p>
                        <p className="text-xs text-[var(--huza-muted)]">
                          {formatRwf(p.price)}/{formatUnit(p.unit)} · {t("stock")} {p.stockQty}
                          {p.qualityGeneral
                            ? ` · ${t("qualityInGeneral")} ${t(qualityLabelKey[p.qualityGeneral] || p.qualityGeneral)}`
                            : ""}
                        </p>
                        <p
                          className={`text-[11px] mt-1 font-semibold ${
                            p.reviewStatus === "REJECTED"
                              ? "text-red-700"
                              : p.reviewStatus === "APPROVED"
                                ? "text-[var(--huza-green-dark)]"
                                : "text-amber-700"
                          }`}
                        >
                          {t("review")}: {p.reviewStatus || "PENDING"}
                        </p>
                        {p.reviewedAt && (
                          <p className="text-[11px] text-[var(--huza-muted)]">
                            Reviewed: {new Date(p.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                        {p.reviewNote && (
                          <p className="text-[11px] text-[var(--huza-muted)]">
                            Feedback: {p.reviewNote}
                          </p>
                        )}
                        {panel === "products" && (
                          <form
                            className="mt-3 flex flex-wrap items-end gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = new FormData(e.currentTarget);
                              updateStock(p.id, Number(form.get("stockQty")));
                            }}
                          >
                            <input
                              name="stockQty"
                              type="number"
                              min={0}
                              defaultValue={p.stockQty}
                              className="input-field w-28"
                              required
                            />
                            <Button type="submit" size="sm" disabled={busy}>
                              {t("update")} stock
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4">
          <div>
            <h2 className="font-semibold">
              {panel === "payments" ? "Payments from HUZA" : "Purchase orders"}
            </h2>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              {panel === "payments"
                ? "See which purchase orders are paid and which are still pending."
                : "Track Huza purchase orders, inspection feedback, and order status."}
            </p>
          </div>
          {purchaseOrders.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No purchase orders yet.</p>
          ) : (
            purchaseOrders
              .filter((po) => (panel === "payments" ? true : true))
              .map((po) => (
              <div key={po.id} className="rounded-xl border border-[var(--huza-line)] p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono font-semibold text-[var(--huza-green-dark)]">{po.poNumber}</p>
                  <span className="rounded-full bg-[var(--huza-mint)] px-2 py-0.5 text-xs">
                    {panel === "payments" ? po.paymentStatus || "Pending" : po.status}
                  </span>
                </div>
                <p className="mt-2">{formatRwf(po.totalAmount)}</p>
                <p className="text-xs text-[var(--huza-muted)]">
                  Submitted {new Date(po.createdAt).toLocaleDateString()}
                  {po.inspectedAt ? ` · Inspected ${new Date(po.inspectedAt).toLocaleDateString()}` : ""}
                </p>
                {panel !== "payments" && (
                  <p className="mt-1 text-xs">
                    Payment: <strong>{po.paymentStatus || "Pending"}</strong>
                  </p>
                )}
                {po.qualityNotes && (
                  <p className="mt-2 text-xs text-[var(--huza-green-dark)]">Feedback: {po.qualityNotes}</p>
                )}
                {po.rejectionReason && (
                  <p className="mt-2 text-xs text-red-700">Rejection: {po.rejectionReason}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "inventory" && !workspaceMode && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">{t("inventoryTab")}</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">{t("inventoryHint")}</p>
          {products.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">{t("submitProductsFirst")}</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[var(--huza-line)] p-3 flex flex-wrap items-end justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{p.nameEn}</p>
                    <p className="text-xs text-[var(--huza-muted)]">
                      {t("current")}: {p.stockQty} {formatUnit(p.unit)}
                    </p>
                  </div>
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      updateStock(p.id, Number(form.get("stockQty")));
                    }}
                  >
                    <input
                      name="stockQty"
                      type="number"
                      min={0}
                      defaultValue={p.stockQty}
                      className="input-field w-28"
                      required
                    />
                    <Button type="submit" size="sm" disabled={busy}>
                      {t("update")}
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
