# ADCB Open Finance — Knowledge Base

A single-page knowledge base that explains how the ADCB Open Finance platform works. Built for developers and stakeholders who need to understand the system without reading spec documents.

## What's Inside

**TPP Project (Third Party Provider)**
- **General Overview** — The players involved, how Data Sharing works (7 steps), how SIP Payment flows (8 steps), side-by-side comparison, and payment status codes
- **Consent & Scheduler** — System architecture map, the 10-step consent lifecycle, the nightly data fetch scheduler, and error scenarios

**LFI Project (Licensed Financial Institution)**
- Coming soon

## Run Locally

```bash
python3 -m http.server 8888
```

Open [http://localhost:8888](http://localhost:8888)

## Project Structure

```
index.html              HTML content (sections, sidebar, layout shell)
assets/
  brand.css             ADCB design tokens (colors, typography, spacing)
  layout.css            App shell styles (sidebar, topbar, responsive)
  components.css        UI component styles (cards, tabs, diagrams)
  fonts/                Proxima Nova (light, regular, semibold, bold)
  images/               ADCB logo
js/
  data.js               Step content arrays — edit here to update content
  components.js         UI rendering (accordions, tabs, player cards)
  router.js             Hash-based URL routing
  nav.js                Sidebar navigation and breadcrumbs
  app.js                App bootstrap
```

## URL Routing

Each section has a shareable URL:

| URL | Page |
|-----|------|
| `#/overview` | General Overview |
| `#/overview/the-players` | The Players |
| `#/overview/data-sharing` | Data Sharing Flow |
| `#/overview/sip-payment` | SIP Payment Flow |
| `#/overview/side-by-side` | Comparison |
| `#/overview/payment-status` | Payment Status Codes |
| `#/consent` | Consent & Scheduler |
| `#/consent/system-map` | System Architecture |
| `#/consent/consent-lifecycle` | Consent Lifecycle |
| `#/consent/data-scheduler` | Data Fetch Scheduler |
| `#/consent/error-scenarios` | Error Scenarios |
| `#/lfi` | LFI Project |

## No Build Tools

Plain HTML, CSS, and JavaScript. No npm, no bundler, no framework. Serve with any static HTTP server.
