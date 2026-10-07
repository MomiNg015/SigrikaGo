# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

This directory contains guidelines for frontend development. Fill in each file with your project's specific conventions.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | Partially filled |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | Partially filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Partially filled |
| [CSS Architecture](./css-architecture.md) | Stylesheet layer order, theme contracts, Tailwind route | Filled |
| [Handbook Portrait Strips](./handbook-puzzle-contract.md) | Ordered diagonal slices, hover/touch expansion, ownership, portrait precedence and full-body details | Filled |
| [Identity Bust Portraits](./identity-bust-contract.md) | Shared student-ID/profile/battle crops, effective appearance, failure fallback, hidden teams and preloads | Filled |
| [Thinking Loading Art Prototype](./loading-art-prototype.md) | Transparent bulb masks, axis fill, frame animation, static completion and sample boundaries | Filled |
| [Button Colors](./button-colors.md) | Ordinary player action colors and protected visual boundaries | Filled |
| [Window Title Stickers](./window-title-stickers.md) | Restrained paper labels, required LXGW font, home opt-in and scroll ownership | Filled |
| [Costume System Contract](../backend/costume-system-contract.md) | Shared backend/frontend catalog, shop, wardrobe, portrait, and snapshot contract | Filled |
| [Recruitment Cinematic](./recruitment-cinematic-contract.md) | Aemeath payload, timing, interruption recovery, sprite assets, and CSS ownership | Filled |
| [Story Guide Layout](./story-guide-layout-contract.md) | Fixed story crop, layered paper, original NPC geometry and home measurement | Filled |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- Read [CSS Architecture](./css-architecture.md) before changing `src/styles/**`, theme CSS, HUD compatibility CSS, or CSS contract tests.
- Read [Recruitment Cinematic](./recruitment-cinematic-contract.md) before changing Aemeath memorial-ticket timing, assets, recovery state, or presentation CSS.
- Read [Quality Guidelines](./quality-guidelines.md) for feature-specific visual and mobile contracts that apply to the touched surface.
- Read [Identity Bust Portraits](./identity-bust-contract.md) before changing identity art, battle portraits, portrait resolution or critical portrait preloads.
- Read [Authentication Form And Session Contract](../backend/authentication-contract.md) before changing `AuthScreen`, auth API requests, or login/registration copy and validation.
- Read [Structured Skill Descriptions](../backend/skill-description-contract.md) before changing skill-copy parsing, trait popovers, overclock labels, or the admin trait editor.
- For UI changes, update desktop and mobile contracts together unless the task explicitly scopes one viewport only.

---

## How to Fill These Guidelines

For each guideline file:

1. Document your project's **actual conventions** (not ideals)
2. Include **code examples** from your codebase
3. List **forbidden patterns** and why
4. Add **common mistakes** your team has made

The goal is to help AI assistants and new team members understand how YOUR project works.

---

**Language**: All documentation should be written in **English**.
