---
name: SigrikaGo Bright School
description: A playful, tactical school-notebook interface for fast, dependable Go play.
colors:
  paper: "#fffbf2"
  sheet: "#fffaf0"
  sheet-clean: "#ffffff"
  ink: "#3d2b25"
  muted-ink: "#6a554d"
  campus-pink: "#ff9ebb"
  notebook-blue: "#9ad3de"
  club-mint: "#bfe8dd"
  danger: "#c0182d"
typography:
  display:
    fontFamily: "Sigrika Accent Latin, Microsoft YaHei UI, Microsoft YaHei, PingFang SC, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Sigrika Window Title, Microsoft YaHei UI, Microsoft YaHei, PingFang SC, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Microsoft YaHei UI, Microsoft YaHei, PingFang SC, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Microsoft YaHei UI, Microsoft YaHei, PingFang SC, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0"
rounded:
  control: "8px"
  action: "14px"
  panel: "16px"
  feature: "18px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  panel: "26px"
components:
  button-primary:
    backgroundColor: "{colors.campus-pink}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 14px"
  button-secondary:
    backgroundColor: "{colors.sheet-clean}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 14px"
  input:
    backgroundColor: "{colors.sheet-clean}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "26px"
---

# Design System: SigrikaGo Bright School

## Overview

**Creative North Star: "The Bright School Club Notebook"**

SigrikaGo presents a playful school-club world without weakening the precision required by a live strategy game. Paper surfaces, dark ink outlines, campus pink, notebook blue, and mint accents provide the anime-school energy; familiar controls, explicit states, and compact information hierarchy keep every action dependable.

Player surfaces use a stacked or purpose-built game layout with strong paper silhouettes and restrained decoration. Desktop and portrait mobile keep equivalent workflows, while mobile receives explicit layout rules instead of being treated as a scaled-down desktop.

**Key Characteristics:**

- Warm notebook paper with visible but quiet grid structure.
- Dark, high-contrast ink outlines and short hard shadows.
- Pink for primary confirmation, blue and mint for supporting state roles.
- Familiar form controls, explicit feedback, and legible game state before decoration.
- Motion communicates state in roughly 160–250ms and disappears under reduced-motion preferences.

## Colors

The palette reads like a clean school notebook annotated with bright stationery, with dark brown ink carrying the hierarchy.

### Primary

- **Campus Pink:** Primary actions, active choices, and small moments of confirmation. It is never a passive background wash.

### Secondary

- **Notebook Blue:** Information, rules, dividers, and cool supporting detail.
- **Club Mint:** Success, readiness, and friendly secondary emphasis.

### Neutral

- **Notebook Paper:** Default player-facing page and panel surface.
- **Clean Sheet:** Inputs and controls that need a quieter, clearer field.
- **Dark Ink:** Text, structural borders, hard shadows, and focus contrast.
- **Muted Ink:** Secondary labels that still meet readable contrast.

**The Ink-First Rule.** A surface is not complete until its text, border, and active state remain readable without relying on color alone.

**The Stationery Accent Rule.** Campus pink, notebook blue, and club mint carry semantic roles; they are accents, not decorative gradients spread across inactive surfaces.

## Typography

**Display Font:** Sigrika Accent Latin with the default Chinese UI sans fallback
**Body Font:** Microsoft YaHei UI, Microsoft YaHei, PingFang SC, system-ui, sans-serif
**Title Font:** Sigrika Window Title with the default Chinese UI sans fallback

**Character:** Titles feel handwritten and club-specific, while labels, forms, and gameplay copy stay familiar and highly legible. Accent faces never replace the UI sans for controls or dense information.

### Hierarchy

- **Display** (400, contextual fixed size, 1.1): Latin identity marks and short accent text only.
- **Title** (400, contextual fixed size, 1.2): Window and feature titles with balanced wrapping.
- **Body** (400, 1rem, 1.5): Instructions, messages, and form content; prose stays within 65–75ch.
- **Label** (700, 0.875rem, 1.35): Form labels, tabs, status text, and control copy.

**The Familiar-Control Rule.** Buttons, labels, form values, and dense operational text always use the UI sans; display faces are reserved for identity and titles.

## Elevation

Depth is structural rather than atmospheric. Player surfaces use dark, short-offset shadows that read like stacked paper or stickers. Wide blurred shadows are reserved for neutral fallback surfaces and are not paired decoratively with a thin border.

### Shadow Vocabulary

- **Paper Rest** (`4px 5px 0 rgba(61, 43, 37, 0.82)`): Default raised player panels and cards.
- **Paper Lift** (`7px 8px 0 rgba(61, 43, 37, 0.86), 0 14px 28px rgba(255, 158, 187, 0.2)`): Deliberate hover lift on high-value interactive items.
- **Login Panel** (`6px 6px 0 #3d2b25`): Strong authentication surface silhouette.

**The Short-Shadow Rule.** Bright School depth uses crisp paper offsets; broad blur is not the default visual language.

## Components

### Buttons

- **Shape:** Gently squared sticker control with a 14px radius and a 3px dark-ink border.
- **Primary:** Campus pink surface, dark-ink text, strong label weight, and a short 4px offset shadow.
- **Hover / Focus:** Small upward movement, visible outline, and restrained brightness; focus never depends on color alone.
- **Secondary:** Clean-sheet surface with the same border, radius, and shadow vocabulary.
- **Disabled / Loading:** Reduced opacity and saturation, no lift, and an explicit busy cursor or label.

### Chips

- **Style:** Full pill only for compact semantic tags, with a 2px dark-ink outline and at most a 2px offset shadow.
- **State:** Selection changes fill and text treatment while keeping the silhouette stable.

### Cards / Containers

- **Corner Style:** 16–18px on player panels; small cards remain at or below 16px.
- **Background:** Notebook paper or clean sheet, optionally with the subtle 20px notebook grid.
- **Shadow Strategy:** Paper Rest by default; Paper Lift only on meaningful interactive hover.
- **Border:** 2–3px dark ink on Bright School player surfaces.
- **Internal Padding:** 18–26px, reduced explicitly on portrait mobile.

### Inputs / Fields

- **Style:** Clean-sheet fill, 8px radius, 12px by 14px padding, and a clear dark or theme-aware stroke.
- **Focus:** Visible outline or border shift with adequate contrast.
- **Error / Disabled:** Danger ink plus a focus-like ring for invalid fields; disabled controls remain legible and stop motion.

### Navigation

- Tabs and segmented controls use familiar two-state behavior. Active state changes fill, ink, and pressed depth without changing control size. Mobile navigation keeps 44px touch targets and avoids horizontal overflow.

### Authentication Panel

- The login panel and visible mascot form one centered composition rather than two independently positioned elements. The ink-and-blue divider extends left out of the notebook sheet as a quiet shelf beneath the mascot, while the compact form remains inside the paper panel.
- Desktop composition width includes the mascot overhang; the established 900px mobile-layout range collapses that horizontal reserve, scales the mascot with the panel, and keeps the title and form at full usable width across phones and narrow previews.

## Do's and Don'ts

### Do:

- **Do** make game state legible before making it decorative.
- **Do** preserve the Bright School paper-and-campus identity while keeping standard controls familiar.
- **Do** use explicit loading, error, unread, disabled, selected, and dangerous states.
- **Do** keep portrait-mobile touch targets at 44px where practical and prevent horizontal overflow.
- **Do** respect reduced motion and keep ordinary state transitions between 150ms and 250ms.

### Don't:

- **Don't** let generic dark sci-fi HUD styling bleed into the Bright School theme.
- **Don't** use marketing-page hero layouts inside app surfaces.
- **Don't** add decorative motion that does not communicate state.
- **Don't** build overbuilt card stacks or vague AI-tool aesthetics.
- **Don't** use unreadable low-contrast paper tints.
- **Don't** allow mobile overflow or treat mobile as a late shrink pass.
- **Don't** replace context with modal flows when a separate detail window is expected.
- **Don't** invent nonstandard form controls for flavor.
