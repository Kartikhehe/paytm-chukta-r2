# Research notes (rule 4), checked 7 Oct 2026

## (a) e-invoice signed QR payload

**Confirmed.** The IRP returns `SignedQRCode`, a JWT (JWS compact form: `header.payload.signature`) signed with RSA-SHA256 by the IRP.

- **Header:** `{"alg":"RS256","kid":"…","typ":"JWT","x5t":"…"}`. Some IRPs/samples use `alg = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"`.
- **Payload:** the invoice fields are a **JSON string nested inside `data`**, plus `iss` (e.g. `"NIC"`):
  ```json
  {"data":"{\"SellerGstin\":\"27AAAPI3182M002\",\"BuyerGstin\":\"24AAAPI3182M002\",\"DocNo\":\"LBGINVX10222X\",\"DocTyp\":\"CRN\",\"DocDt\":\"03/05/2021\",\"TotInvVal\":100.00,\"ItemCnt\":1,\"MainHsnCode\":\"721119\",\"Irn\":\"d34b…6480\",\"IrnDt\":\"2021-05-10 19:58:21\"}","iss":"NIC"}
  ```
- **Fields:** `SellerGstin, BuyerGstin, DocNo, DocTyp, DocDt (dd/mm/yyyy), TotInvVal, ItemCnt, MainHsnCode, Irn (64-hex hash), IrnDt (yyyy-mm-dd HH:MM:SS)`. `DocTyp` (INV / CRN / DBN) is the one field not in our list; the prototype shows it too.
- **Signature verification:** the public key is published by GSTN/NIC for the official offline "QR Code Verify" app. Several IRPs now exist (NIC, Clear, Cygnet, IRIS, EY…), each with its own signing key. I did not embed and validate those keys, so **the prototype shows "IRP signature check: demo"**. In the field, an e-invoice can be truly verified with the official app linked below.
- The decoder handles both the nested-`data` shape and a flat payload.

Sources:
- Sample signed QR plus decoded output: [Logitax: Get Decrypted Signed QR Code (PDF)](https://docs.logitax.in/Docs/Get_Decrypted_Signed_QR_Code)
- JWT structure and field list: [ClearTax e-invoicing API basics](https://docs.cleartax.in/cleartax-docs/e-invoicing-api/learn-e-invoicing-api-basics)
- Verifiable fields (irn, irnDate, sellerGstin, …): [Vayana: verify QR code](https://docs.enriched-api.vayana.com/routes/enriched/Trade-Verification-Service/Verify%20EInvoice/apis/Verify-Qrcode/verify-qrcode/)
- Signing: SHA256RSA; public key from GSTN: [IVL DSP: e-invoicing guidelines pt 2](https://www.ivldsp.com/blog/e-invoicing/government-notifications-and-guidelines-of-e-invoicing-continued/)
- Official verifier app: [einvoice1.gst.gov.in/Others/QRCodeVerifyApp](https://einvoice1.gst.gov.in/Others/QRCodeVerifyApp) (via [Tax2Win](https://tax2win.in/guide/gst-e-invoice-qr-code-verifier-app-by-gstn), [ClearTax](https://cleartax.in/s/qr-code-verify-app-e-invoicing))

## (b) Are intent payments restricted by payee type?

**Yes, and it is an NPCI rule, not one app's choice.** NPCI circular **NPCI/UPI/2023-24/OC/76A** (12 Mar 2024, effective 1 Apr 2024):

> "Payer PSP shall ensure **P2P Intent based transactions** (Initiation mode '04' and '05') shall be **disallowed**."
>
> "Payee PSP shall ensure Intent based transactions (Initiation mode '04') shall be **disallowed for all 'Offline' non-verified merchants**."
>
> "QR share & Pay shall have a limit of INR 2000/- for all P2P transactions" (and for P2M to non-verified offline merchants).

What this means for the prototype:

| Supplier's VPA | `upi://pay` intent from our web page | What works instead |
|---|---|---|
| Personal VPA (P2P) | **Blocked** by the payer app (Paytm, PhonePe, GPay all apply it) | Owner opens Paytm and **scans the supplier's printed QR with the camera** (QR mode, not intent), or pays to the UPI ID / bank account inside Paytm |
| Offline merchant, not "verified" (most small-shop / P2PM QRs) | **Blocked** by the payee PSP | Same: scan the QR in Paytm |
| Verified merchant (full-KYC, typically larger or online) | Allowed | Intent opens the app chooser, then Paytm, then the owner's own PIN |
| Image of a QR shared on WhatsApp ("QR share & pay") | n/a | Capped at ₹2,000 for P2P / non-verified merchants, so **scan the physical QR** |

So the prototype's **Abhi chukta** still builds the standard intent (it works for verified-merchant payees). The fallback **"Paytm kholein aur supplier ka QR scan karein, invoice no. note karein"**, with a **"Paid via Paytm (owner confirmed)"** button, is shown on the same screen as a first-class path, not hidden. Both routes are logged for L3. I did not find a public list showing which distributor VPAs are "verified", so plan for the fallback to be the common L3 route in Kanpur.

Deck updated to match (text only, no numbers): slide 9 "✅ UPI intent or QR → Paytm, real bill" and Annexure A2 L3 "UPI intent opens Paytm; where NPCI blocks intent to personal / non-verified payees, owner scans the supplier QR in Paytm". The printed interview script (fieldkit) uses the same wording.

Sources:
- [TaxGuru: NPCI circular OC/76A text](https://taxguru.in/finance/npci-circular-revision-transaction-limits-upi-merchants.html)
- [TeamLease RegTech: addendum on transaction limits by merchant and transaction type](https://teamleaseregtech.com/updates/article/30601/npci-issued-an-addendum-to-the-notification-related-to-the-revision-in/)
- Background on intent vs collect in 2026: [Razorpay blog](https://razorpay.com/blog/upi-intent-vs-collect-success-rates/), [PhonePe UPI Intent](https://business.phonepe.com/upi-intent-flow)

## (c) P2P collect requests are discontinued

**Confirmed.** NPCI circular **UPI-OC-No-220-FY-2025-26** (dated 29 Jul 2025) told all banks, PSPs and UPI apps to make sure no P2P collect transaction is initiated, routed or processed after **1 Oct 2025**. Merchant (P2M) collect stays only for regulated use cases, and PG collect flows are being sunset as well (Razorpay cites 28 Feb 2026).

**The prototype never creates a collect request.** It only builds push intents (`upi://pay`). Reminders go through Soundbox, push or WhatsApp (demo), never as a UPI collect.

Sources:
- [MediaNama: NPCI to stop P2P collect from Oct 1](https://www.medianama.com/2025/08/223-npci-p2p-collect-payments-oct-1-what-it-means/)
- [Business Today](https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13)
- [TeamLease RegTech: discontinuation of P2P collect](https://www.teamleaseregtech.com/updates/article/45492/npci-issued-a-notification-regarding-the-discontinuation-of-the-servic/)
- [Angel One: what users must know](https://www.angelone.in/news/personal-finance/upi-collect-requests-to-end-from-october-1-what-phonepe-google-pay-paytm-users-must-know)

## Side finding: MDR (checked against `model.py`, nothing changed)

Govt notification (15 Sep 2026), effective **15 Oct 2026**: 0.4% MDR only on **P2M > ₹2,000**; P2P free; **small merchants receiving ≤ ₹1 lakh/month via UPI QR stay at zero MDR**; MDR **capped at ₹300** per transaction ≥ ₹75,000. Source: [Business Today, 15 Sep 2026](https://www.businesstoday.in/personal-finance/story/upi-payments-to-remain-free-for-p2p-transactions-0-4-mdr-applicable-only-on-merchant-payments-above-rs2000-555715-2026-09-15).

This is consistent with the deck's "0.4% MDR on P2M > ₹2,000 from 15 Oct". Two details are not modelled explicitly:
1. The ₹1 lakh/month zero-MDR exemption for small payees.
2. The ₹300 cap on very large bills.

`mdr_elig = 0.50` already removes bank-a/c, P2PM and small payments, so I am **not** proposing a change. If you want to be conservative, the exemption is an argument for the low end of the `mdr_elig` tornado range (20%). The article does not state the payer/acquirer split (`tpap` 0.08%, `acq` 0.12%), so those remain your assumptions.
