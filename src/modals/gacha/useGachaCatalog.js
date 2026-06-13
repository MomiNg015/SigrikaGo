import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import { selectInitialGachaPool } from "./gachaHelpers.js";

export function useGachaCatalog({ token, initialPools = [], user, onNotice, onUserChange }) {
  const [pools, setPools] = useState(initialPools);
  const [wallet, setWallet] = useState({ coins: user?.coins ?? 0, blueGems: user?.blueGems ?? 0 });
  const [activePoolId, setActivePoolId] = useState(initialPools[0]?.id ?? "");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(initialPools.length === 0);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api("/api/gacha/pools", { token })
      .then((data) => {
        if (cancelled) return;
        const nextPools = data.pools ?? [];
        setPools(nextPools);
        setWallet(data.wallet ?? { coins: user?.coins ?? 0, blueGems: user?.blueGems ?? 0 });
        setActivePoolId((current) => nextPools.some((pool) => pool.id === current)
          ? current
          : (selectInitialGachaPool(nextPools)?.id ?? ""));
      })
      .catch((error) => onNotice?.(error.message, "danger"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activePool = useMemo(
    () => pools.find((pool) => pool.id === activePoolId) ?? selectInitialGachaPool(pools),
    [activePoolId, pools]
  );

  async function refreshHistory() {
    try {
      const data = await api("/api/gacha/history", { token });
      setHistory(data.records ?? []);
    } catch (error) {
      onNotice?.(error.message, "danger");
    }
  }

  async function draw(count) {
    if (!activePool || drawing) return;
    setDrawing(true);
    setResult(null);
    try {
      const data = await api(`/api/gacha/pools/${activePool.id}/draw`, {
        method: "POST",
        token,
        body: { count }
      });
      await new Promise((resolve) => setTimeout(resolve, 760));
      setResult(data);
      if (data.user) {
        setWallet({ coins: data.user.coins ?? 0, blueGems: data.user.blueGems ?? 0 });
        onUserChange?.(data.user);
      }
      refreshHistory();
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setDrawing(false);
    }
  }

  return {
    activePool,
    activePoolId,
    draw,
    drawing,
    history,
    loading,
    pools,
    refreshHistory,
    result,
    setActivePoolId,
    setResult,
    wallet
  };
}
