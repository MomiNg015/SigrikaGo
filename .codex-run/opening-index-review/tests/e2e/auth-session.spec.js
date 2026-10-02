import { expect, test } from "@playwright/test";

test("register refresh and logout maintain the browser refresh-cookie session", async ({ request }) => {
  const username = `e2e${Date.now().toString(36).slice(-5)}`;
  const password = "pwpass12";

  const register = await request.post("/api/auth/register", {
    data: { username, password }
  });
  expect(register.status()).toBe(200);
  const registered = await register.json();
  expect(registered.token).toBeTruthy();
  expect(registered.user.username).toBe(username);

  const refresh = await request.post("/api/auth/refresh");
  expect(refresh.status()).toBe(200);
  const refreshed = await refresh.json();
  expect(refreshed.token).toBeTruthy();
  expect(refreshed.user.username).toBe(username);

  const logout = await request.post("/api/auth/logout", {
    headers: { Authorization: `Bearer ${refreshed.token}` }
  });
  expect(logout.status()).toBe(200);

  const refreshAfterLogout = await request.post("/api/auth/refresh");
  expect(refreshAfterLogout.status()).toBe(401);
});
