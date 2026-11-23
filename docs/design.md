# Design

How the interface looks and behaves. It makes principle P6 concrete and applies the [principles](../.roclec/constitution.md), [ADR-001](adr/ADR-001-multi-country-content.md), the [architecture](architecture.md) and the [engineering conventions](engineering.md); UI technologies are in [docs/stack.md](stack.md).

## Accessibility

The target is WCAG 2.2 level AA. In this product that means:

- The whole wizard can be completed with the keyboard only, in a logical tab order and without keyboard traps.
- Focus is always visible and never hidden behind other content.
- Every field has a programmatic label. Help text and error messages are associated with their field.
- When a step cannot advance, focus moves to the first invalid field and the error is announced.
- When the step changes, focus moves to the new step's heading; the progress indicator marks the current step.
- Loading, error and empty states are announced to assistive technologies.
- Color is never the only way to convey meaning: the recommended plan, the selected plan and errors also have text or an icon with a label.
- Text and interface elements meet AA contrast; interactive targets are at least 24 × 24 CSS pixels.
- Motion respects the person's reduced-motion preference.

## Responsive design

- Mobile-first. Reference widths: 375 px (mobile) and 1280 px (desktop).
- Content reflows down to 320 px wide without horizontal scrolling.
- The wizard, the plan list and the summary work at both reference widths with the same content.

## Visual identity per country

- Each country has its own theme, configured in Strapi on its `Country` entry: primary color, accent color and logo.
- The application applies the theme at runtime as CSS custom properties consumed by the Tailwind and Spartan UI tokens. Layout, components and typography are shared by both countries (ADR-001, P1).
- Theme colors must meet AA contrast with the text placed on them. A missing or invalid theme falls back to the default theme (P3).
- The seeded themes for Colombia and Chile use the SURA identity below, which today is the same in both countries.

## Design system

The identity and patterns follow SURA's public insurance sites for [Chile](https://seguros.sura.cl/) and [Colombia](https://www.sura.co/seguros).

### Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#2D6DF6` | Header, secondary buttons, field labels, links |
| `primary-strong` | `#0033A0` | Navigation bar, text on the call to action, field values |
| `cta` | `#E3E829` | Background of the primary call to action |
| `cta-foreground` | `#26328C` | Text on the call to action |
| `accent` | `#00AEC7` | Secondary accent |
| `foreground` | `#1C1C24` | Body text |
| `muted` | `#888B8D` | Secondary text |
| `border` | `#B4B4B5` | Field and card borders |
| `disabled` | `#878789` | Disabled controls |
| `danger` | `#DB1A40` | Errors |
| `surface-info` | `#DFEAFF` | Highlighted sections, recommended plan background |
| `surface-cta` | `#F9FAE1` | Soft call-to-action sections |
| `surface-muted` | `#F8F8F8` | Neutral sections |

Contrast rules: `cta` is used only as a background with `cta-foreground` or `primary-strong` text (8:1), never as text on `primary` (3.4:1, below AA for normal text). White on `primary` and `primary` text on white are at the AA limit (4.5:1) and are not lightened.

### Typography

- Font family: `Nunito Sans` (regular, semibold, bold), an open font of similar shape to SURA's proprietary typeface, then `sans-serif`. The proprietary typeface is not used.
- Body 16 px; labels and helper text 14 px; headings 24 to 48 px in bold.

### Shape

- Radii: 8, 12, 16 and 24 px; fields and cards use 12 px; buttons are pills (28 px or more).
- Fields are 48 px high with a 1 px border.

### Components and patterns

- **Field:** label above the field in `primary`, 14 px, with `*` when required; placeholder with an example value (for example `Ej: ABC123`); help text and error message below the field.
- **Short choices:** segmented buttons (for example Sí / No) and radio cards for two or three options.
- **Primary call to action:** `cta` pill, disabled until the step is valid; a short expectation text above it and the terms link below it when applicable.
- **Plan cards:** shown side by side on desktop and stacked on mobile; each has a badge, name, subtitle, price, action and coverage list with highlighted amounts. The recommended plan has a `primary` border, `surface-info` background and a text badge.
- **Logo:** the official SURA logo when provided; a text placeholder until then.

## Components and styling

- Spartan UI components are used first; layouts and spacing use Tailwind utilities.
- Colors, spacing and typography come from the design tokens (CSS custom properties); no hard-coded colors and no inline styles.
- The recommended plan (US-02) is distinguished with a visible text label in addition to its styling.

## Copy

User-facing copy is in Spanish and comes from Strapi; only the fallback for unavailable content lives in the front end (engineering).

## Design skills

During the design stage (UX specification and prototypes) and when reviewing user interface changes, agents use these skills pinned in `skills-lock.json`:

| Skill | Use |
| --- | --- |
| `ui-ux-pro-max` | Interaction patterns for forms, wizards, plan comparison and states |
| `design-lab` | Alternative prototype variations to compare before choosing one |
| `impeccable` | Critique and polish of the chosen design |
| `web-design-guidelines` | Audit against web interface and accessibility guidelines |

The other pinned skills (`design-taste-frontend`, `frontend-design`) target public marketing pages and are not used for the wizard.

## Verification

Automated accessibility scans run inside the end-to-end tests (verification reference). Keyboard-only completion and the reference widths are checked in every prototype review and user interface review.
