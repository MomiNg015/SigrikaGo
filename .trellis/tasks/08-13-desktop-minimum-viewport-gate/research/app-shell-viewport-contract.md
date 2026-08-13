# App shell viewport contract research

- The application composition root is `src/app/App.jsx`; route and overlay state remain mounted there.
- The product supports common phones but intentionally excludes tablets from the mobile exemption. The gate therefore rejects explicit tablet identities, then classifies a phone from device evidence plus an inclusive `480px` maximum device-screen short side. Screen geometry is stable across rotation and cannot be forged merely by narrowing a desktop viewport; Android without `Mobile`, iPad/Tablet/PlayBook/Silk/Kindle, and `481px+` screen short sides remain gated even with touch input.
- `useAppShellTheme` distinguishes the isolated admin theme, but the viewport gate belongs above route presentation and applies uniformly to every desktop route, including admin.
- Rendering the gate inside `.app-shell` avoids a global body-only layer and lets the selected player theme supply its existing tokens.
- A React resize hook is required because a one-time CSS media query cannot combine device-screen class, multiple mobile-device signals, an exact two-axis minimum, and testable runtime restoration cleanly.
