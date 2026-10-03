import net from "node:net";

export async function assertTestPortAvailable(port) {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(Number(port), "127.0.0.1", () => probe.close(resolve));
  });
}

function hasExited(child) {
  return !child.pid || child.exitCode !== null || child.signalCode !== null;
}

export async function stopTestProcesses(children, { graceMs = 18_000, forceMs = 5_000 } = {}) {
  await Promise.all(children.filter(Boolean).map((child) => new Promise((resolve, reject) => {
    if (hasExited(child)) return resolve();
    let timer;
    const finish = (error) => {
      clearTimeout(timer);
      child.off("exit", exited);
      child.off("error", failed);
      if (error) reject(error);
      else resolve();
    };
    const exited = () => finish();
    const failed = (error) => finish(error);
    child.once("exit", exited);
    child.once("error", failed);
    timer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch (error) { finish(error); return; }
      timer = setTimeout(() => finish(new Error(`Test process ${child.pid} did not exit; preserving its database`)), forceMs);
    }, graceMs);
    try { child.kill("SIGTERM"); } catch (error) { finish(error); }
  })));
}
