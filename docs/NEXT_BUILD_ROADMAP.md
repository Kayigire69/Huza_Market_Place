# Youth Huza — Next build roadmap

Ordered plan for what to build next. Focus: **ops reliability → customer trust → farmer consistency → payment APIs**.  
Defer card/COD, admin i18n, and redesigns until these are solid.

Last updated: **2026-07-21**

---

## How to use this list

1. Finish one phase before starting the next (except ops playbooks can run in parallel with engineering).
2. Each item has **Goal**, **Build**, **Done when**.
3. Do not expand scope into redesigns or unrelated portals.

Related docs: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [system-workflows/](./system-workflows/)

---

## Phase 1 — Day-to-day selling (ops + light engineering)

### 1.1 Manual MoMo staff playbook
| | |
|--|--|
| **Goal** | Every unpaid order is confirmed or released within the 15‑minute window. |
| **Build** | Short internal doc (can live under `docs/ops/`): who watches Admin → Payments, how to confirm, what to tell the customer on WhatsApp if late, what happens when the window expires. |
| **Done when** | New staff can confirm a test order without asking engineering. |

### 1.2 Inventory thresholds
| | |
|--|--|
| **Goal** | Low-stock alerts mean something useful. |
| **Build** | Set `lowStockAt` per live product in Admin (not only default 5). Optional: one-page checklist of which SKUs matter for launch. |
| **Done when** | Top-selling products have realistic thresholds; Inventory + Restock are checked daily. |

### 1.3 Weekly smoke test checklist
| | |
|--|--|
| **Goal** | Catch broken paths before customers do. |
| **Build** | Checklist doc: shop → checkout → pay confirm → pack → pickup/delivery; farmer register → approve → submit produce → PO. Run once a week. |
| **Done when** | Checklist exists and is dated after each run. |

---

## Phase 2 — Customer trust (engineering)

### 2.1 Checkout waiting-screen copy
| | |
|--|--|
| **Goal** | Customers understand the 15‑minute manual MoMo window. |
| **Build** | Update checkout awaiting UI strings only (no redesign): e.g. send payment within 15 minutes; page does not need to stay open; stock is held until the window ends. Wire through existing i18n if those keys already exist, else add keys. |
| **Done when** | en + rw (minimum) show clear instructions on the awaiting payment screen. |

### 2.2 Checkout + account i18n (en + rw first)
| | |
|--|--|
| **Goal** | No English-only checkout/account when locale is Kinyarwanda. |
| **Build** | Add/translate keys for checkout steps and `/account` (profile, addresses, orders). Prefer `t()`; no layout redesign. fr/sw can follow later. |
| **Done when** | Switching locale to `rw` shows checkout + account in Kinyarwanda for all primary labels/CTAs. |

### 2.3 Customer status messages (payment confirmed / ready for pickup)
| | |
|--|--|
| **Goal** | Customer knows without calling Huza. |
| **Build** | Reuse existing notification/SMS/job queue where present: on payment confirm and on “ready for pickup” (and optionally out for delivery). Keep channels to what is already configured (in-app and/or SMS). No new marketing channels. |
| **Done when** | Test order triggers a clear message at confirm and at ready-for-pickup. |

---

## Phase 3 — Farmer → shop consistency

### 3.1 Finish remaining farmer English surfaces
| | |
|--|--|
| **Goal** | Approvals / produce detail strings use `t()` like Sales already does. |
| **Build** | Wire leftover hard-coded English in farmer Approvals and related produce panels to workspace i18n (en/fr/rw/sw). No new pages. |
| **Done when** | Spot-check Approvals + Produce in `rw` with no mixed chrome. |

### 3.2 Procurement training path
| | |
|--|--|
| **Goal** | Staff only use `/admin/procurement`. |
| **Build** | Ops note pointing to Admin → Procurement; remind `/procurement` redirects. Optional: remove leftover nav bookmarks in internal docs. |
| **Done when** | Procurement staff open only the admin path in daily work. |

### 3.3 Organic signup decision (product, then code if needed)
| | |
|--|--|
| **Goal** | Clear launch rule: Conventional-only vs Organic later. |
| **Build** | Decision recorded here or in ops notes. If Organic returns later: re-enable farming-type choice + dossier rules in a dedicated ticket—do not mix into Phases 1–2. |
| **Done when** | Written decision exists; code unchanged until that ticket is scheduled. |

---

## Phase 4 — Live Mobile Money APIs (when keys arrive)

### 4.1 Production secrets & callback
| | |
|--|--|
| **Goal** | Safe live collection. |
| **Build** | Require `MTN_MOMO_CALLBACK_SECRET` in production; put secret on callback URL; confirm `NEXTAUTH_SECRET` set; target env = production. |
| **Done when** | Staging/live request-to-pay + callback verified without accepting unsigned calls. |

### 4.2 End-to-end live prompt test
| | |
|--|--|
| **Goal** | 3‑minute live window works in real conditions. |
| **Build** | Test MTN (and Airtel if enabled): prompt → approve → confirm → stock commit → customer message. |
| **Done when** | One successful live paid order per enabled provider. |

---

## Explicitly deferred (do not start yet)

| Item | Why wait |
|------|----------|
| Card payment | Needs provider + PCI/process |
| COD | Explicitly unavailable by design for now |
| Admin portal i18n | Staff can work in English |
| Farmer NID login hardening | Product choice to keep current login |
| Visual redesigns | Platform is stable enough; ops first |

---

## Suggested sprint order (summary)

| Sprint | Focus | Items |
|--------|--------|--------|
| **A** | Ops | 1.1, 1.2, 1.3 |
| **B** | Customer copy + i18n | 2.1, 2.2 |
| **C** | Customer messaging | 2.3 |
| **D** | Farmer polish | 3.1, 3.2, 3.3 |
| **E** | Live MoMo | 4.1, 4.2 (when keys ready) |

When starting a sprint, open a focused ticket from this file and keep the change set small.
