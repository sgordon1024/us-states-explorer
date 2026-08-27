# The State of the States

An interactive atlas of all 50 US states + DC across ~90 metrics — economy, housing, taxes,
health, education, safety, climate, politics, outdoors and culture — compiled August 2026.

**Live site:** https://sgordon1024.github.io/us-states-explorer/

## What's here

- **`index.html`** — homepage: an interactive choropleth map (16 switchable overlays) plus
  scroll-animated "key insights" sections (migration, housing, real incomes, taxes, health & safety,
  climate & outdoors, politics, and one iconic food per state).
- **`explore.html`** — the full dataset as a sortable, filterable table (category picker, region
  filter, quick toggles like *no income tax* / *cannabis legal*, state search).
- **`survey.html`** — "Find your state", three ways: a short (8-question) quiz, a long (25-question)
  quiz, and **the mixing board** — 20 live faders that re-match you to a state in real time, with
  savable named presets. Answers become a target percentile profile and all 51 jurisdictions are
  scored against it, so any state can win — extremes match extremes, middles match middles.
- **`analytics.html`** — quiz responses are recorded anonymously in each visitor's localStorage;
  this dashboard aggregates them and exports Claude-friendly JSON/CSV. To pool responses from all
  visitors into one Google Sheet, wire up `assets/analytics-config.js` (a one-question Google Form
  acts as the zero-backend sink; instructions in the file).

## Tech

Plain HTML/CSS/JS — no build step, no frameworks, no tracking. Dark theme, mobile-friendly,
keyboard-accessible map (every state is a focusable button), `prefers-reduced-motion` respected.

- `assets/data.js` — the dataset (generated from the source spreadsheet) + column metadata +
  US map path data (Wikimedia Commons blank US map, public domain).
- `assets/common.js` — formatting, percentiles, color scales, the state-detail dialog, scroll reveals.
- `assets/map.js` — the choropleth component.
- `assets/insights.js`, `assets/explore.js`, `assets/survey.js` — per-page logic.

## Data sources

US Census Bureau (population, SAIPE income & poverty, urbanization, school finances), BEA (GDP,
income, regional price parities), BLS (unemployment), Zillow (home values & rents), Tax Foundation
(tax rates, burdens, competitiveness), CDC/NCHS (life expectancy, obesity), FBI (crime), EIA
(electricity & gas taxes), NOAA (climate normals), NREL (solar), Pew Research Center (religion,
2023–24 Religious Landscape Study), Giffords Law Center (gun-law grades, 2025), NCSL (legislature
control), HSLDA (homeschool regulation), and state agencies (licenses, parks).

Caveats: DC is included as a 51st jurisdiction and distorts density/crime/income comparisons;
license prices, park counts and ski-area counts are approximate; iconic foods are editorial.
Verify anything before making legal or financial decisions on it.
