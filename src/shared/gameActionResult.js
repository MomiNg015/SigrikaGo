export function ok(state, extra = {}) {
  return { ok: true, state, ...extra };
}

export function fail(error) {
  return { ok: false, error };
}
