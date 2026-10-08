# 🎒 Field kit · Round 2 (Kanpur)

Print-ready **A4** PDFs made from deck Annexure A2. Print in colour, single-sided.

| File | Pages | What it is |
|---|---|---|
| [`concept_board.pdf`](concept_board.pdf) | 1 | Hindi-first concept board: ① bill arrives ② Soundbox "Kal ₹12,400 dene hain" ③ "Chukta karein" ④ "7 din baad: supplier ko aaj hi paisa", plus the 1–5 usefulness row for A1 |
| [`interview_script.pdf`](interview_script.pdf) | 4 | Screener S1–S3, Stage A (A1–A3), Stage B tasks T1–T4 with scoring rules, Stage C ladder L1–L4 (with the NPCI fallback for L3), distributor questions, consent line, "never" list, neutral replies, question → workbook column map, kit checklist |
| [`daily_tracker.pdf`](daily_tracker.pdf) | 1 | Quota grid (kirana/FMCG 10 · pharmacy 5 · canteen/dairy 5 · other 5 · distributors 3–5), the seven areas, the four pass bars, top objections |

> **Note:** fieldwork on 8 Oct 2026 was run as a verbal interview (voice notes); Stage B prototype tasks were moved to pilot week 1. The deck's Annexure A2 shows the script as actually used.

## Rebuild

```bash
# from the repo root (needs internet once for Google Fonts)
.venv/bin/python fieldkit/build_fieldkit.py          # → fieldkit/*.pdf
.venv/bin/python fieldkit/build_fieldkit.py --png    # + preview_*.png for a visual check
```

The build fails loudly if any page overflows A4 or any box is clipped. Sources are plain HTML in [`src/`](src/) sharing one stylesheet, [`src/base.css`](src/base.css).
