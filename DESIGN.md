---
name: ContentStore
mode: dark (forced — `dark` class on <html>)
ratio: black surfaces (pure + one faded black) / accents: neon green = click, purple = highlight
colors:
  # Surfaces — ONLY these two. No other grey shades anywhere.
  black: "#000000"           # page background, header, sidebar
  faded-black: "#141414"     # cards, dialogs, inputs, secondary buttons, chips
  # Lines and hover are white overlays, so they read as faded black, not grey
  line: "rgb(255 255 255 / 9%)"    # borders, dividers, input outlines
  hover: "rgb(255 255 255 / 6%)"   # hover rows, menu hover
  # Text
  text: "#ffffff"
  text-muted: "#a3a3a3"      # secondary text only (text, never a surface)
  # Accents
  neon-green: "#2cff05"      # ONLY the main click target (primary CTA) + "done" status
  on-green: "#000000"
  purple: "#bf00ff"          # highlights: focus ring, active state, "in progress" status
shadcn-tokens:
  --background / --sidebar: black
  --card / --popover / --secondary / --muted: faded-black
  --accent / --sidebar-accent: hover
  --border / --input: line
  --foreground: text
  --muted-foreground: text-muted
  --primary / --sidebar-primary: neon-green
  --primary-foreground: on-green
  --ring / --highlight: purple
radius: 0.625rem
fonts:
  sans: Geist
  mono: Geist Mono
---

# ContentStore Design System

All UI must follow this file. Tokens live in `src/app/globals.css`. Always use
semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-card`,
`text-muted-foreground`, `border-border`, `bg-primary`, `text-highlight`). Never hardcode the hex values in components.

## Palette

| Color | Hex | Used for |
|---|---|---|
| Pure black | `#000000` | Page background, header, sidebar |
| Faded black | `#141414` | Cards, dialogs, inputs, secondary buttons, chips |
| Neon green | `#2cff05` | **Only** the main thing we want the user to click, plus "done" status |
| Electric purple | `#bf00ff` | Highlights: focus rings, active nav/tab, step labels, "in progress" status |

**No other grey surfaces.** Borders and hover states are faint white overlays (9% / 6%) so they stay
"faded black". Never add `#2d2d2d`, `zinc-*`, `neutral-*`, `gray-*` or any new grey hex.
Text is white `#ffffff`, with `#a3a3a3` for secondary text only.

## Neon green: strict usage rules

- ✅ The single main CTA on a screen ("New Idea", "Generate", "Save", "Get started")
- ❌ Never more than **one** green primary button per view/section. Other buttons use
  `variant="secondary"`, `"outline"` or `"ghost"` (faded black/white).
- ❌ Never for large areas, card backgrounds, borders on ordinary cards, body text or decorative glows.
- Text on green is always black (`text-primary-foreground`).

## Purple: highlight only

- ✅ Focus rings, the active nav item or tab indicator, step labels, a single key callout or tour spotlight
- ❌ Never a button fill. Clicking is green's job, and two accent buttons compete.
- Purple text is fine on black and faded black (≈4.7:1 and ≈4.3:1). Keep small purple text on pure black where possible.
- Purple and green never sit side by side as equals. One focal accent per area.

## Components

- **Buttons:** `default` = neon green with black text (main CTA only). `secondary` = faded black with white text.
  `outline` = transparent with a faint line border. `ghost` = transparent with a faint hover fill.
- **Cards and dialogs:** `bg-card` (faded black), `border-border`, white text.
- **Inputs:** faded-black fill, `border-input`, purple focus ring.
- **Menus and dropdown hover:** `bg-accent` (faint hover), never an accent color.
- **Status meaning:** green = done/success/connected (Completed ideas, published counts, verified,
  success toast), shown as text or a tinted badge, never a second green button. Purple = in progress/active
  (Pending ideas, needs research, mirror mode on, prompter eye line). Content formats (Article, Video,
  Article & Video) are neutral faded-black chips, not colors. Destructive red stays only for delete/error.
- **Charts:** use `var(--chart-1..5)` / `bg-chart-N`: 1 green, 2 purple, 3 grey, 4 light green, 5 light purple.
- **Never use Tailwind palette colors** (`emerald-*`, `blue-*`, `zinc-*`…) or hex in components. The only
  exception is third-party brand marks (the Google logo).
- **Gradients and glows:** none by default. A faint green glow (≤ 20% opacity) is allowed only behind the primary CTA.

## Contrast (WCAG)

- White on black 21:1 ✅, muted on black ≈ 8.3:1 ✅, muted on faded black ≈ 7.5:1 ✅
- Black on neon green ≈ 15.4:1 ✅
- Purple on black ≈ 4.7:1 ✅, on faded black ≈ 4.3:1 (fine for labels and large text)
