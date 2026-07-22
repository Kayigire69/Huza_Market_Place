# Manual MoMo — staff playbook

**Goal:** Every unpaid customer order is **confirmed** or **released** within the **15‑minute** payment window.

Use this when Mobile Money APIs are off (or unavailable) and customers pay MoMo to the Huza line by hand. Staff confirm money in Admin.

Related engineering notes: [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) · [05-order-processing.md](../system-workflows/05-order-processing.md)

---

## Who does this

| Role | Can confirm / fail payments? |
|------|------------------------------|
| Finance, Manager, Admin, Super Admin | Yes |
| Support | View only — escalate to Finance |

**Watch:** Admin → **Payments** (`/admin/payments`), especially the **Pending** tab. Dashboard / alerts may show **“N Pending payments”** or **“Pending MoMo: {orderNumber}”**.

---

## What the customer did

1. Placed an order and chose MoMo.
2. Sees **“Send MoMo payment”** with payee details (default phone **0788 241 665**, name **Ines Umurerwa** — same as Settings if overridden).
3. Has **15 minutes** to send money. Countdown: **“Waiting for Huza to confirm… M:SS left”**.
4. They do **not** need to keep the page open for confirmation to work. If the tab is closed, confirm still applies; they can use **Track order**.
5. If nobody confirms in time, the system **expires** the payment: stock reservation is released, order is cancelled. Customer must place a **new** order to try again.

---

## Confirm a payment (happy path)

1. Open **Admin → Payments → Pending**.
2. Match MoMo SMS / statement to the row:
   - Order number
   - Amount (RWF)
   - Customer payment phone / name
3. Optional but useful: open the payment → **Set / edit ref** → paste MoMo transaction ID.
4. Click **Confirm**.
5. Expected result:
   - Payment → Successful (**CONFIRMED**)
   - Order → **CONFIRMED** (ready for pack / pickup or delivery)
   - Reserved stock is committed

**Reference is optional** for Confirm. Prefer setting it when available (helps Reconciliation later).

---

## If payment did not arrive / customer cancelled

1. On the Pending row, click **Fail** (add a short reason if asked).
2. Stock reservation is released; order is cancelled.
3. Prefer **Fail** early when you know payment will not come — do not wait for the 15‑minute auto-expire unless you are unsure.

---

## If the customer is late or confused (WhatsApp)

Same Huza line as checkout / Click-to-Chat:

- Phone: **0788 241 665**
- WhatsApp: [wa.me/250788241665](https://wa.me/250788241665)

Suggested replies (adapt as needed):

| Situation | Message idea |
|-----------|----------------|
| Window still open, money not seen | “Tugire amakuru ya MoMo (nimero y’ijambo / reference). Turareba mu Payments.” / “Send MoMo ref or screenshot — we are checking Payments.” |
| Window expired, no confirm | “Igihe cyo kwishyura cyarangiye; stock yasubitswe. Ongera usezerere order nshya.” / “The 15‑minute window closed and stock was released. Please place a new order, then pay again.” |
| Money arrived after expire | Do **not** Confirm the old cancelled payment. Ask them to place a **new** order (or escalate for manual refund / credit — Finance only). |

Checkout also offers **“WhatsApp / delivery help”** with an order-support preset.

---

## When the 15 minutes end (automatic)

You do not need to click Fail for timeout:

- A background job marks the payment **FAILED** and the order **CANCELLED**.
- Reserved stock is **released** (available again). Physical stock count was never reduced for a pending reservation.
- Customer message concept: payment window expired; place a new order if they still want to pay.

If a row still looks stuck on Pending after 15+ minutes, use **Sync** / **Reconciliation**, then escalate to Admin if needed.

---

## Reconciliation checklist (daily / shift end)

In **Payments → Reconciliation**, review:

- Stuck **Pending** beyond the window
- Missing MoMo **ref** on confirmed payments
- Amount mismatches vs expected order total

Fix refs with **Set / edit ref**. Do not double-confirm.

---

## Quick test (new staff)

1. Place a small test shop order as a customer → MoMo → note order number and amount.
2. Do **not** send real money if using a throwaway test — or send a known tiny amount if Finance allows.
3. In **Admin → Payments → Pending**, find the row → **Confirm**.
4. Reload customer Track order / awaiting screen → should show paid / confirmed.
5. Optional second test: leave another order unpaid for 15+ minutes → confirm it auto-failed and stock is free again.

**Done when:** you can confirm a test order without asking engineering.

---

## Do / don’t

| Do | Don’t |
|----|--------|
| Watch Pending during selling hours | Leave Pending overnight without Fail or note |
| Match amount + phone before Confirm | Confirm on guess when MoMo SMS is unclear |
| Set ref when you have it | Confirm an **expired/cancelled** order after the window |
| Fail early if customer abandons | Promise to “keep holding” stock past 15 minutes |

---

## Run log (optional)

| Date | Staff | Notes |
|------|-------|-------|
| | | e.g. “Test confirm OK / shift coverage 09–17” |
