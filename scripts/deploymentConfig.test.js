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
});
