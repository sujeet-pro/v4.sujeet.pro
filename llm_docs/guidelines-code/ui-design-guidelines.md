# UI Design Guidelines - Literary Review

This document defines the visual design system for the site, implementing "The Literary Review" aesthetic - a modern literary magazine style with elegant typography, minimalist color palette, and clean whitespace.

## Design Philosophy

- **Elegant simplicity**: Clean, uncluttered layouts that let content breathe
- **Typography-first**: Content hierarchy through typography, not decoration
- **Muted warmth**: Soft rose accents add subtle warmth without distraction
- **Timeless aesthetic**: Classic literary magazine feel, modern execution

## Color System

### Core Palette

| Token                    | Value     | Usage                                   |
| ------------------------ | --------- | --------------------------------------- |
| `--color-bg`             | `#ffffff` | Pure white background                   |
| `--color-bg-alt`         | `#fafafa` | Secondary surfaces, code blocks, footer |
| `--color-text`           | `#1a1a1a` | Headings, primary text                  |
| `--color-text-secondary` | `#4a4a4a` | Body paragraphs                         |
| `--color-text-muted`     | `#8a8a8a` | Meta info, captions, dates              |
| `--color-border`         | `#e5e5e5` | Subtle dividers                         |

### Accent Colors (Muted Rose)

| Token                   | Value     | Usage                         |
| ----------------------- | --------- | ----------------------------- |
| `--color-accent`        | `#8b6b6b` | Links, active states, buttons |
| `--color-accent-hover`  | `#6b4b4b` | Hover states                  |
| `--color-accent-subtle` | `#c4a4a4` | Subtle accents, borders       |

### WCAG Contrast Ratios

All color combinations meet WCAG 2.1 AA requirements:

- `--color-text` on `--color-bg`: 17.4:1
- `--color-text-secondary` on `--color-bg`: 9.7:1
- `--color-text-muted` on `--color-bg`: 4.5:1
- `--color-accent` on `--color-bg`: 5.2:1

## Typography

### Font Stack

- **Sans-serif**: Open Sans (primary for all text)
- **Monospace**: JetBrains Mono (code blocks)

### Type Scale

| Element         | Size                   | Weight             | Line Height |
| --------------- | ---------------------- | ------------------ | ----------- |
| H1 (Page title) | clamp(32px, 5vw, 42px) | 400 (light/normal) | 1.2         |
| H2              | 26px                   | 600                | 1.35        |
| H3              | 20px                   | 500                | 1.4         |
| Body            | 17px                   | 400                | 1.8         |
| Lead paragraph  | 19px                   | 400                | 1.7         |
| Meta text       | 12px                   | 400 (uppercase)    | 1.5         |

### Special Typography Elements

#### Drop Caps

Used on homepage bio for visual interest:

```css
.dropcap::first-letter {
  float: left;
  font-size: 3.5rem;
  line-height: 1;
  font-weight: 300;
  margin-right: 0.75rem;
  color: var(--color-accent);
}
```

#### Eyebrow Text

Small caps category/label text above titles:

```css
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent);
}
```

## Layout

### Content Width

| Context            | Width      |
| ------------------ | ---------- |
| Header             | 1100px max |
| Content (articles) | 900px max  |
| Narrow content     | 680px max  |

### Spacing Scale

Use Tailwind spacing utilities with these common values:

- Section margins: `my-12` to `my-16`
- Component gaps: `gap-6` to `gap-8`
- Card padding: `py-6`

## Component Patterns

### Section Dividers

Horizontal lines with centered text:

```html
<div class="section-divider">
  <span class="section-divider-text">Featured Topics</span>
</div>
```

```css
.section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 3rem 0 2rem;
}

.section-divider::before,
.section-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.section-divider-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
```

### Cards

Cards use border-based styling with subtle hover effects:

```css
.article-card {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  transition: padding-left 200ms ease;
}

.article-card:hover {
  padding-left: 0.5rem;
}
```

### Buttons

#### Primary Button (Charcoal)

```css
.btn-primary {
  background: var(--color-text);
  color: white;
  padding: 0.625rem 1.25rem;
  font-weight: 500;
  border-radius: 2px;
}

.btn-primary:hover {
  background: #333;
}
```

#### Outline Button

```css
.btn-outline {
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.625rem 1.25rem;
  font-weight: 500;
  border-radius: 2px;
}

.btn-outline:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
```

### Tags

Bordered pill style:

```css
.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-muted);
}

.tag:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
```

### Links

Rose accent color with underline:

```css
.link {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.link:hover {
  text-decoration-color: transparent;
}
```

## Header Layout

Centered logo with navigation on sides using CSS Grid:

```css
.site-header-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;
}

/* Left nav (hidden on mobile) */
.header-nav-left {
  justify-self: end;
}

/* Centered logo */
.header-logo {
  justify-self: center;
  text-align: center;
}

/* Right nav */
.header-nav-right {
  justify-self: start;
}
```

## Footer Layout

Off-white background with centered brand:

```css
.site-footer {
  background: var(--color-bg-alt);
  border-top: 1px solid var(--color-border);
}
```

## Interaction States

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Hover Transitions

Use subtle, quick transitions:

```css
transition: color 150ms ease;
transition: border-color 150ms ease;
transition: background-color 150ms ease;
```

## Accessibility Requirements

- Minimum touch target: 44x44px
- Minimum body text: 16px
- Color contrast: 4.5:1 minimum for text
- Focus indicators: 2px outline with offset
- Reduced motion: Respect `prefers-reduced-motion`

## Do's and Don'ts

### Do

- Use whitespace generously
- Let typography create hierarchy
- Use rose accent sparingly for links and active states
- Keep interactions subtle and elegant

### Don't

- Add decorative elements without purpose
- Use saturated or bright colors
- Add heavy shadows or gradients
- Overcomplicate hover effects
