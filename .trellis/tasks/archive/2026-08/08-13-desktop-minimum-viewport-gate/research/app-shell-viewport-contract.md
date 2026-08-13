# App shell viewport contract research

- The application composition root is `src/app/App.jsx`; route and overlay state remain mounted there.
- The product supports common phone layouts and intentionally permits desktop browser emulation by resizing. The primary classifier is therefore the current viewport's inclusive short-side `320–480px` and long-side `568–1024px` range, independent of pointer capability. Explicit Android-tablet, iPad/iPadOS desktop-mode, Tablet, PlayBook, Silk, and Kindle identities stay excluded; real phone evidence plus phone-range device-screen geometry is only a fallback for temporarily compressed phone viewports.
- `useAppShellTheme` distinguishes the isolated admin theme, but the viewport gate belongs above route presentation and applies uniformly to every desktop route, including admin.
- Rendering the gate inside `.app-shell` avoids a global body-only layer and lets the selected player theme supply its existing tokens.
- A React resize hook is required because a one-time CSS media query cannot combine the bounded two-axis phone range, explicit tablet exclusion, compressed real-phone fallback, an exact desktop minimum, and testable runtime restoration cleanly.
