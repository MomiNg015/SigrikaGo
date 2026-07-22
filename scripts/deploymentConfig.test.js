import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY_DIRECTIVES } from "../server/securityHeaders.js";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

describe("production deployment templates", () => {
  it("keeps realtime, API, uploads, and static resources on separate Nginx boundaries", () => {
    const entry = read("deploy/nginx/sigrikago.conf");
    const config = read("deploy/nginx/sigrikago-routes.conf");

    expect(entry).toContain("server_name sigrikago.com www.sigrikago.com;");
    expect(entry).toContain("include /etc/nginx/snippets/sigrikago-routes.conf;");
    expect(config).toContain("location ^~ /socket.io/");
    expect(config).toContain("proxy_buffering off;");
    expect(config).toContain("proxy_read_timeout 90s;");
    expect(config).toContain("location ^~ /api/");
    expect(config).toContain("proxy_buffering on;");
    expect(config).toContain("location ^~ /uploads/");
    expect(config).toContain("alias /var/lib/sigrikago/uploads/;");
    expect(config).toContain("location /assets/");
    expect(config).toContain("try_files $uri $uri/ /index.html;");
  });

  it("locks the immutable, runtime, and HTML cache contracts", () => {
    const config = read("deploy/nginx/sigrikago-routes.conf");

    expect(config).toContain("max-age=31536000, immutable");
    expect(config).toContain("max-age=3600, stale-while-revalidate=86400");
    expect(config).toContain('Cache-Control "no-cache"');
    expect(config).toContain("gzip on;");
    expect(config).toContain("application/javascript");
  });

  it("keeps the HTTPS shell CSP aligned with Pixi Blob workers", () => {
    const config = read("deploy/nginx/sigrikago-routes.conf");
    const csp = Object.entries(CONTENT_SECURITY_POLICY_DIRECTIVES)
      .map(([name, values]) => `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}${values.length ? ` ${values.join(" ")}` : ""}`)
      .join("; ");

    expect(config).toContain("script-src 'self'; worker-src 'self' blob:");
    expect(config).not.toContain("script-src 'self' blob:");
    expect(config).toContain(`add_header Content-Security-Policy "${csp}" always;`);
  });

  it("keeps the single Node process inside the 2 GB host safety envelope", () => {
    const unit = read("deploy/systemd/sigrikago.service");

    expect(unit).toContain("ExecStart=/usr/bin/node /opt/sigrikago/server/index.js");
    expect(unit).toContain("Restart=on-failure");
    expect(unit).toContain("TimeoutStopSec=25");
    expect(unit).toContain("KillSignal=SIGTERM");
    expect(unit).toContain("LimitNOFILE=65535");
    expect(unit).toContain("MemoryHigh=1400M");
    expect(unit).toContain("MemoryMax=1600M");
  });

  it("keeps the production update script fail-fast, backed up, and ordered around downtime", () => {
    const script = read("deploy/update-production.sh");

    expect(script).toContain("set -Eeuo pipefail");
    expect(script).toContain("git diff --quiet");
    expect(script).toContain("git diff --cached --quiet");
    expect(script).toContain("set -a");
    expect(script).toContain('. "${PROJECT_DIR}/.env"');
    expect(script).toContain("set +a");
    expect(script.indexOf('. "${PROJECT_DIR}/.env"')).toBeLessThan(script.indexOf("npm run backup:sqlite"));
    expect(script.indexOf('. "${PROJECT_DIR}/.env"')).toBeLessThan(script.indexOf("npm run check:production"));
    expect(script).toContain('[[ -d "${PROJECT_DIR}/dist" ]] || fail "Current production bundle is missing: ${PROJECT_DIR}/dist"');
    expect(script).toContain('git pull --ff-only origin "${EXPECTED_BRANCH}"');
    expect(script).toContain('npm run backup:sqlite -- --source "${DATABASE_PATH}" --output "${DATABASE_BACKUP}"');
    expect(script.indexOf("umask 077")).toBeLessThan(script.indexOf("npm run backup:sqlite"));
    expect(script.indexOf("npm run backup:sqlite")).toBeLessThan(script.indexOf("umask 022"));
    expect(script.indexOf("umask 022")).toBeLessThan(script.indexOf('npm run build -- --outDir "${STAGED_DIST}"'));
    expect(script).toContain('npm run build -- --outDir "${STAGED_DIST}"');
    expect(script).toContain("if ! nginx -t; then");
    expect(script).toContain("npm run admin:sync-onboarding -- --apply");
    expect(script).toContain('curl --fail --silent --show-error "${HEALTH_URL}"');

    expect(script.indexOf('npm run build -- --outDir "${STAGED_DIST}"')).toBeLessThan(script.indexOf('systemctl stop "${SERVICE_NAME}"'));
    expect(script.indexOf('[[ -d "${PROJECT_DIR}/dist" ]]')).toBeLessThan(script.indexOf('systemctl stop "${SERVICE_NAME}"'));
    expect(script.indexOf("if ! nginx -t; then")).toBeLessThan(script.indexOf('systemctl stop "${SERVICE_NAME}"'));
    expect(script.indexOf('systemctl stop "${SERVICE_NAME}"')).toBeLessThan(script.indexOf("npx prisma migrate deploy"));
    expect(script.indexOf("npx prisma migrate deploy")).toBeLessThan(script.indexOf('mv -- "${PROJECT_DIR}/dist" "${PREVIOUS_DIST}"'));
    expect(script.indexOf("npx prisma migrate deploy")).toBeLessThan(script.lastIndexOf('systemctl start "${SERVICE_NAME}"'));
  });
});
