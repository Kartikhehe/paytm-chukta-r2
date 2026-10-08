# 📊 Deck & workbook kit · Paytm Chukta, Round 2 (final)

Everything in the deck and the annexure workbook is generated from the files in this folder, so the numbers cannot drift apart.

| Output | Built by |
|---|---|
| **`out/KartikRaj_R2.pdf`**: cover + 15 slides + 3 annexures (19 pages) | `build.py` ← `deck.html.j2` + `model.py` + `validation.json` |
| **`out/KartikRaj_R2_Annexure.xlsx`**: logs, dashboard, model, sensitivity, pilot, risks, sources | `build_xlsx.py` (structure) + `import_field.py` (field rows) |

## Files

| File | Role |
|---|---|
| `model.py` | Business model; inputs at the top. The single source for every ₹ figure in the deck. |
| `validation.json` | Round 2 field results (stated answers, 8 Oct 2026), copied from the workbook dashboard. **Only real data goes here.** |
| `deck.html.j2` | The deck: Jinja2 + HTML/CSS, 1280×720 slides. |
| `build.py` | Renders the PDF. `--png` also writes `out/s00–s18.png` and prints an overflow / spill check. |
| `build_xlsx.py` | Rebuilds the workbook structure (needs `inputs/KartikRaj_VOC.xlsx`, the 50 Round 1 VOCs). |
| `import_field.py` | Copies field answers from the working file into the workbook log sheets (rows 6+). |
| `fill_from_xlsx.py` | Reads the workbook dashboard ("deck key" column) into `validation.json`. |

## Build

```bash
# from the repo root, once:
python3 -m venv .venv && .venv/bin/pip install jinja2 openpyxl playwright pillow pandas
.venv/bin/python -m playwright install chromium

# every time:
cd chukta_handoff/Chukta_R2_kit
../../.venv/bin/python build.py --png
```

**Fonts matter.** The deck is laid out for **Carlito** (Calibri-metric) and **Noto Color Emoji**. Without them Chromium substitutes wider fonts and panels overflow. Install both (Google Fonts) before building, then check `out/s*.png`.

## Checks before submitting

- 19 pages; **no amber `.tbd` boxes** in `out/deck.html` (an amber box means a `null` in `validation.json`).
- Every number traces to `../r2_validation_log.csv` / `../distributor_log.csv` and the workbook dashboard.
- Workbook recalculates with **0 formula errors** (LibreOffice headless or Excel).
- Ladder results are **stated commitments** ("would / want to"), never "did / paid / signed".

## Data rules

Never type a number into `validation.json` that isn't in the field logs. If a result is weak, report it as it is: the pilot design (slide 12) already has SCALE / ITERATE / STOP rules.
