# Production deployment diagnosis

## Production modal blur

- Source Bright School rule contains:
  - `backdrop-filter: none !important`
  - `-webkit-backdrop-filter: none !important`
- The production CSS contains only the prefixed `none`, while the base modal rule retains both prefixed and standard `blur(9px)`.
- Browser CSSOM confirms the visible modal matches the Bright School selector but computes `backdrop-filter: blur(9px)`.
- Minimal transformation verification:
  - Lightning CSS keeps only the last declaration when standard then prefixed forms are adjacent.
  - Reversing the order preserves the standard `backdrop-filter` declaration.
- Remote `index-BcKFsVfW.css` and `index-B-1F7xuj.js` were byte-identical to local `dist`; Nginx and browser cache were ruled out.

## Production database and admin sync

- Production `prisma migrate deploy` reported no pending migrations because `0_init` was already recorded as applied.
- The current baseline was later expanded with `Character.illustName` and related fields, so an existing production database did not receive them.
- `deploy/update-production.sh` currently runs `admin:sync-defaults` immediately after `migrate deploy`.
- Runtime schema guards only run when the service starts, which is later than admin sync.
- The sync preview failed on `Character.illustName`, so `--apply` and frontend activation did not run during that attempt.

## Stale committed defaults

`npm run check:admin-snapshot` currently reports:

```text
Committed admin snapshot is stale in: siteSettings, characters, costumes.
```

The committed snapshot therefore cannot transfer the latest local illust metadata and costume names until it is regenerated and committed.
