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
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- Read [CSS Architecture](./css-architecture.md) before changing `src/styles/**`, theme CSS, HUD compatibility CSS, or CSS contract tests.
- Read [Quality Guidelines](./quality-guidelines.md) for feature-specific visual and mobile contracts that apply to the touched surface.
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
