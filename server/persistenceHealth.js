const failures = new Map();

export function notePersistenceFailure(key, now = Date.now()) {
  const previous = failures.get(key);
  failures.set(key, { since: previous?.since ?? now, attempts: (previous?.attempts ?? 0) + 1 });
}

export function notePersistenceSuccess(key) {
  failures.delete(key);
}

export function persistenceHealthStats(now = Date.now()) {
  return {
    failedPersistenceOperations: failures.size,
    unhealthyPersistenceOperations: [...failures.values()].filter((failure) => (
      failure.attempts >= 3 && now - failure.since >= 30_000
    )).length
  };
}
