<div align="center">

# 📱 Paytm Chukta · clickable prototype

**Supplier bills, reminded by the Soundbox, paid in one tap from Paytm for Business.**

### [▶ Open the live prototype](https://chukta-r2-prototype.vercel.app)

Best on an Android phone in Chrome · on a laptop it opens inside a phone frame, with a QR code to switch to your phone

<img src="../chukta_handoff/Chukta_R2_kit/assets/proto_inbox.png" width="200" alt="Inbox"> &nbsp;
<img src="../chukta_handoff/Chukta_R2_kit/assets/proto_capture.png" width="200" alt="Capture"> &nbsp;
<img src="../chukta_handoff/Chukta_R2_kit/assets/proto_pay.png" width="200" alt="Pay">

</div>

> **It never moves money.** Payments happen only inside the owner's own Paytm app, with their own UPI PIN. Every fake value carries a visible **demo** label.

## A 2-minute tour

| # | From the home screen | What to look for |
|---|---|---|
| 1 | **Bills** (home) | Money in today next to bills due this week, grouped *Jaldi / Is hafte / Baad mein* |
| 2 | Centre **Scan** button | Signed e-invoice QR first; photo / PDF read on the phone; manual last. Try *Sample e-invoice QR* |
| 3 | **Chukta karein** on a bill | Payee check against the GST legal name, 24 h cooling-off for new or changed payees |
| 4 | **Aage: Chukta karein** | Pay screen: GST match tick, supplier's rail, *Abhi chukta* (UPI intent), the NPCI fallback, receipt |
| 5 | **7 din baad** | Pay-later explainer (no credit is offered) |
| 6 | **Soundbox** tab | Hindi voice reminder, mute-amounts switch, 9 pm reminder, push preview |
| 7 | **Collect** quick action | Distributor dashboard: invoices sent → seen → paid, retailers, settlements, Tally CSV |

Every screen on deck slide 9 is at most **two taps** from home.

## Screens

| Route | Screen |
|---|---|
| `/` | Inbox · *Dena hai / Diya / Suppliers* tabs, quick actions |
| `/capture` → `/confirm` | Add a bill: e-invoice QR (camera, image or PDF), photo / PDF OCR (`eng+hin`), manual; owner confirms every field; duplicate bills are flagged |
| `/bill/:id` | Bill detail: fields, e-invoice data, timeline, **Galat bill** (dispute → distributor) |
| `/payee/:id` | Payee check (bill name ↔ GST legal name, demo lookup) |
| `/pay/:id` | Full or part payment, UPI intent, fallback, owner-confirmed receipt |
| `/later/:id` | *7 din baad* explainer |
| `/supplier/new` | Add a supplier (scan their UPI QR) + 9 pm reminder |
| `/soundbox` | Web Speech API reminder (hi-IN voice when installed) |
| `/collect` | Chukta Collect, distributor view: **Overview** · **Invoices** (search, filter, CSV) · **Retailers** (outstanding per shop, Remind) · **Settlements** (rail + invoice match) · **Tally export** (receipt-voucher CSV) |

## What is real, what is demo

| ✅ Real | 🧩 Demo (labelled in the UI) |
|---|---|
| e-invoice signed-QR (JWT) decoding | GST legal-name lookup · IRP signature check |
| Photo / PDF bill reading (tesseract.js, Hindi + English) | The seed bills, "Aaj aaye ₹31,420", pay-from account |
| Standard UPI push intent (`upi://pay`), never a collect request | Chukta Collect data · 7 din baad credit |
| Hindi voice (Web Speech API) | Push / WhatsApp previews |

Demo payee UPI IDs end in `@invalid`, a handle no bank uses, so a test tap can never reach anyone.

**Why the fallback exists:** NPCI circular OC/76A (in force since April 2024) makes UPI apps block link-based (intent) payments to personal UPI IDs and to offline non-verified merchants. For most small suppliers the reliable path is *open Paytm → scan the supplier's QR → write `INV-<no>` in the note*. The research and sources are in [`NOTES.md`](NOTES.md).

## Run it yourself

```bash
cd prototype
npm install
npm run dev        # http://localhost:5173 (+ a LAN URL for your phone)
npm run build      # → dist/
npm run preview    # serve dist/ on http://localhost:4173
```

The camera (`getUserMedia`) only works on **HTTPS or localhost**, so use the deployed link on a phone.

**Deploy:** `vercel deploy --prod` (`vercel.json` routes everything to the SPA). Netlify works too: `public/_redirects`.

**Stack:** Vite · React 19 · Tailwind CSS 4 · React Router · jsQR · tesseract.js · pdf.js. Routes are code-split, so the home screen loads ~77 KB gzipped.

## Field-use tools (not linked in the UI)

`/log` is a field logger whose columns and dropdowns are generated from the workbook (`scripts/gen_log_schema.py`). It saves to the phone's `localStorage` and exports CSV / Excel-ready rows. It's reachable only by typing the URL. Round 2 interviews were done verbally, so it wasn't needed.

---

<sub>Concept prototype by Kartik Raj (IIT Kanpur) for the Paytm Innovation Challenge 2026. Not affiliated with or built by Paytm. Demo data only; it never moves money.</sub>
