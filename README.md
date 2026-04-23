# MDS India — Official Website
### *Think Beyond*

> **"At MDS, we don't just build software — we build the future."**

A premium, fully static corporate website for **Mahadeva Digital Solutions Pvt. Ltd. (MDS India)** — built with pure HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies. Just open `index.html` and go.

---

## 🌐 Live Pages

| Page | File | Description |
|------|------|-------------|
| 🏠 Home | `index.html` | Hero, stats, about preview, Noorva teaser, core values, CTA |
| 🧭 About | `about.html` | Who we are, mission, vision, 10 core values |
| 🚀 Product | `product.html` | Noorva — launching soon, phone mockups, countdown, waitlist |
| 👥 Team | `team.html` | Leadership & core team profiles |
| 💼 Careers | `careers.html` | Why join, open roles & internships |
| 🎉 Events | `events.html` | Upcoming events & company milestone timeline |
| 📬 Contact | `contact.html` | Contact form, email, phone, socials |

---

## 📁 Project Structure

```
MDSIndia/
├── index.html          # Home page
├── about.html          # About Us
├── product.html        # Noorva product page
├── team.html           # Meet the Team
├── careers.html        # Careers & Job Openings
├── events.html         # Events & Milestones
├── contact.html        # Contact Us
├── css/
│   └── style.css       # Global design system & all styles
├── js/
│   └── main.js         # Shared JS — nav, animations, forms
└── README.md           # This file
```

---

## ✨ Features

### Design
- 🌑 **Dark glassmorphism** — premium dark theme with frosted glass cards
- 🎨 **Purple × Blue gradient branding** — consistent across all pages
- 🔤 **Space Grotesk + Inter** typography for a modern premium feel
- 📱 **Fully responsive** — mobile, tablet, and desktop layouts
- 🔮 **Futuristic phone mockups** on the Noorva product page

### Interactions
- 🎞️ **Smooth page transitions** — fade in/out between pages
- 👁️ **Scroll-reveal animations** — elements animate in as you scroll
- 🔢 **Animated stat counters** — numbers count up on the home page
- ⏱️ **Live countdown timer** — on the Noorva product page
- 🍔 **Mobile hamburger menu** — fully functional on all screen sizes
- ✅ **Working forms** — contact form and waitlist form with success states

### SEO & Accessibility
- Semantic HTML5 structure
- Descriptive `<title>` and `<meta description>` on every page
- `aria-label` attributes on interactive elements
- Single `<h1>` per page with proper heading hierarchy

---

## 🚀 Getting Started

No installation or build process required.

### Option 1 — Open Directly
Simply double-click `index.html` in your file explorer.

### Option 2 — Local Server (Recommended)
For the best experience (especially smooth page transitions), run a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension → Right-click index.html → Open with Live Server
```

Then open `http://localhost:8000` in your browser.

---

## 🎨 Design System

All design tokens are defined as CSS custom properties in `css/style.css`:

```css
--bg-base: #05050f;           /* Page background */
--bg-surface: #0d0d1a;        /* Section backgrounds */
--accent: #7c3aed;            /* Primary purple */
--accent-2: #2563eb;          /* Secondary blue */
--gold: #d4af37;              /* Noorva / premium gold */
--grad-primary: linear-gradient(135deg, #7c3aed, #2563eb);
--grad-text: linear-gradient(90deg, #a78bfa, #60a5fa);
```

### Typography
| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `h1` | Space Grotesk | clamp(2.4rem–4.2rem) | 800 | Page heroes |
| `h2` | Space Grotesk | clamp(1.8rem–3rem) | 700 | Section headings |
| `h3` | Space Grotesk | clamp(1.2rem–1.6rem) | 600 | Card titles |
| Body | Inter | 1rem | 400 | Paragraphs |

---

## 📦 Dependencies

| Resource | Source | Purpose |
|----------|--------|---------|
| Google Fonts — Inter | CDN | Body typography |
| Google Fonts — Space Grotesk | CDN | Heading typography |
| *(No JS frameworks)* | — | Vanilla JS only |
| *(No CSS frameworks)* | — | Vanilla CSS only |

> **Offline use:** The fonts load from Google Fonts CDN. For fully offline use, download and self-host the font files and update the `@import` in `css/style.css`.

---

## 📄 Page Details

### 🏠 Home (`index.html`)
- Full-height hero with animated badge, gradient headline, and 3 CTAs
- Stats bar with animated counters (10+ values, 1 platform, 100% purpose-driven)
- About preview cards (Mission, Vision, Promise)
- **Noorva** product teaser with floating mockup
- 10 Core Values grid
- CTA banner linking to Careers and Contact

### 🧭 About (`about.html`)
- Who we are — company overview and quote card
- Mission & Vision — dual glass cards with full text
- **10 Core Values** — full numbered grid with icons and descriptions

### 🚀 Product (`product.html`)
- Giant **Noorva** wordmark with gradient
- **3 stacked phone mockups** with animated dark UI internals
- Live countdown timer to launch date
- 6 feature teaser cards
- Email waitlist form with success state
- Feature pills section

### 👥 Team (`team.html`)
- Featured leadership card (Sumanth Mahadeva — Founder & CEO)
- Team member grid with avatars, roles, bios, and social links

### 💼 Careers (`careers.html`)
- 6 "Why Join MDS?" benefit cards
- 4 open role listings (Full-Stack, UI/UX, PM, Intern)
- Each role shows department tag, remote badge, and Apply button

### 🎉 Events (`events.html`)
- 3 upcoming event cards (Product Launch, Innovation Forum, Anniversary)
- Company milestone timeline from founding to beta launch

### 📬 Contact (`contact.html`)
- Contact info cards: Email, Phone, Social, Location
- Full contact form: Name, Email, Phone, Subject, Message
- Form submits with success state (no backend required)
- Closing brand quote section

---

## 🔧 Customization

### Update Contact Info
Edit `contact.html` — replace placeholder email, phone, and social links.

### Update Team Members
Edit `team.html` — add real names, bios, and LinkedIn URLs to the `.team-card` elements.

### Update Job Listings
Edit `careers.html` — modify or add `.job-card` blocks with role details and deadlines.

### Change Launch Date (Noorva Countdown)
In `product.html`, update the date in the countdown script:
```javascript
const launch = new Date('2025-12-31T00:00:00'); // Change this date
```

### Add Social Media URLs
Search for `href="#"` in footer sections across all pages and replace `#` with actual URLs.

---

## 🏢 About MDS India

**Mahadeva Digital Solutions Pvt. Ltd.** is a bold, innovation-driven technology company based in India. Built with the vision of becoming a global leader, MDS exists to solve the world's most urgent challenges through cutting-edge technology.

**Core Philosophy:** *Think Beyond*

**Flagship Product:** Noorva — a next-generation digital platform, launching soon.

---

## 📜 License

© 2025 Mahadeva Digital Solutions Pvt. Ltd. All rights reserved.

---

<p align="center">
  <strong>Think Beyond.</strong><br/>
  <em>Built with ❤️ by MDS India</em>
</p>
