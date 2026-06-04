# CAGE Market Entry Intelligence

A strategic market-entry decision-support tool. It evaluates target markets on
three separate axes — **Opportunity**, **Distance** (Ghemawat's CAGE), and
**Risk** — and reads the decision off a 2×2 prioritisation matrix rather than a
single black-box score.

- **Opportunity**: market size, wealth, growth, urbanisation, digital maturity
- **Distance**: Cultural, Administrative, Geographic, Economic (home-relative, industry-weighted)
- **Risk**: political stability, regulatory quality, corruption, currency volatility

Features: all-market screen with ranking, the prioritisation matrix, per-market
distance breakdown, deterministic entry-mode + AAA guidance, and a
dominant-distance flag that tells you which capability to fund first.

## Data

Curated 2024 snapshot for the top ~40 economies, from IMF WEO (Oct 2024),
World Bank WDI & Worldwide Governance Indicators (2023), Transparency
International CPI (2024), and CEPII-style geographic/structural attributes.
Figures are real and dated but hand-keyed for demonstration — verify against
source before any live decision.

To regenerate or extend the dataset: edit `build_data.py` and run
`python3 build_data.py`, which writes `src/data/countries.json`. To move to a
live feed, replace the RAW table in that script with output pulled from the
World Bank / IMF / Transparency International / CEPII APIs.

Framework: Pankaj Ghemawat, "Distance Still Matters" (HBR 2001) and
*Redefining Global Strategy* (Harvard Business School Press, 2007).

## Run locally

Requires Node.js 18+ (nodejs.org).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to ./dist
npm run preview  # preview the build
```

## Deploy to Vercel (free)

1. Push this folder to a new GitHub repository.
2. Go to vercel.com, sign in with GitHub, click **Add New… → Project**, and
   import the repository.
3. Vercel auto-detects Vite (Build: `npm run build`, Output: `dist`). Click
   **Deploy**. You get a free public URL, and every `git push` redeploys.

No environment variables or backend required — the data ships as a static JSON
file bundled at build time.

### Alternative: drag-and-drop (no Git)
Run `npm install && npm run build`, then drag the generated `dist` folder onto
**app.netlify.com/drop** for instant free hosting.
