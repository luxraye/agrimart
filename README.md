# AgriMart v0.3

**Pre-season crop decision system for Botswana horticulture.**

Mobile-first PWA for farmers, buyers, and cooperatives.

---

## Quick start

```bash
# Delete any leftover package-lock.json from other tools
# then:
yarn install
yarn dev
# → http://localhost:3000
```

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Profile creation (name, district, phone) |
| `/` | Auth | Supply Check — pre-season supply/demand by district + crop |
| `/risk` | Auth | Risk Monitor — climate, soil, logistics, inference engine |
| `/map` | Auth | Interactive Leaflet map: traffic, water, market zones, weather |
| `/forecast` | Auth | My Farm — viability engine + PDF export (settings persisted) |
| `/profile` | Auth | Edit profile, sign out |
| `/about` | Hidden | Internal roadmap — tap the AgriMart logo 5× on profile page |

---

## Deploy to Vercel

```bash
# Via CLI
npx vercel

# Via GitHub → vercel.com/new (auto-detects Next.js)
```

The `vercel.json` sets `yarn build` explicitly.

---

## Architecture

```
agrimart/
├── app/
│   ├── layout.jsx          Root layout + AuthProvider
│   ├── page.jsx            Supply Check (/)
│   ├── risk/               Risk Monitor + inference engine
│   ├── map/                Full-screen Leaflet map
│   ├── forecast/           My Farm + PDF export
│   ├── profile/            User profile (hidden roadmap: tap logo 5×)
│   ├── login/              Registration / sign-in
│   └── about/              Internal roadmap (not in nav)
├── components/
│   ├── Nav.jsx             Desktop top-bar + mobile bottom-tab nav
│   ├── AgriMap.jsx         Leaflet map (client-only, dynamic import)
│   ├── RequireAuth.jsx     Auth gate
│   └── ...shared UI
├── contexts/
│   └── AuthContext.jsx     localStorage auth + profile + farm persistence
├── lib/
│   ├── data.js             All intelligence data + forecast engine + roadmap
│   ├── utils.js            Shared helpers
│   └── pdfReport.js        jsPDF export
└── public/data/
    ├── traffic_nodes.json  15 Botswana road nodes
    └── water_points.json   22 water source points
```

---

## Mobile nav

On mobile (< 768px), a bottom tab bar replaces the top nav:
**Supply · Risk · Map · My Farm · Profile**

On desktop, a standard sticky top nav is shown.

---

*AgriMart v0.3 — EU delegation presentation build, Botswana 2026.*
