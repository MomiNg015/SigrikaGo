import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { preloadImageAssets } from "../../shared/preloadAssets.js";
import {
  COSTUME_EMPTY_LINE,
  COSTUME_ERROR_LINE,
  COSTUME_GREETING_LINES,
  COSTUME_INSUFFICIENT_LINE,
  COSTUME_LOADING_LINE,
  COSTUME_REFRESH_COOLDOWN_MS,
  COSTUME_REFRESH_LINES,
  COSTUME_THANKS_LINE,
  eligibleCostumes,
  pickCostumeLine,
  selectCostumeBatch
} from "../costumeShopHelpers.js";

export function useCostumeCatalog({ token, user, onNotice, onPurchased }) {
  const [costumes, setCostumes] = useState([]);
  const [effectiveUser, setEffectiveUser] = useState(user);
  const [catalogState, setCatalogState] = useState("loading");
  const [currentBatch, setCurrentBatch] = useState([]);
  const [preparedBatch, setPreparedBatch] = useState(null);
  const [batchVersion, setBatchVersion] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [mascotLine, setMascotLine] = useState(COSTUME_LOADING_LINE);
  const [mascotMood, setMascotMood] = useState("greeting");
  const [purchasingId, setPurchasingId] = useState("");
  const [equippingId, setEquippingId] = useState("");
  const onNoticeRef = useRef(onNotice);
  const onPurchasedRef = useRef(onPurchased);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
    onNoticeRef.current = onNotice;
    onPurchasedRef.current = onPurchased;
  }, [onNotice, onPurchased, user]);

  useEffect(() => setEffectiveUser(user), [user]);

  useEffect(() => {
    let alive = true;
    if (!token || !user?.id) return undefined;
    setCatalogState("loading");
    setMascotMood("greeting");
    setMascotLine(COSTUME_LOADING_LINE);
    api("/api/costumes", { token })
      .then((data) => {
        if (!alive) return;
        const catalog = data.costumes ?? [];
        const batch = selectCostumeBatch(catalog);
        setCostumes(catalog);
        setCurrentBatch(batch);
        setPreparedBatch(null);
        setBatchVersion((version) => version + 1);
        setCatalogState("ready");
        setMascotMood(batch.length ? "greeting" : "empty");
        setMascotLine(batch.length ? pickCostumeLine(COSTUME_GREETING_LINES) : COSTUME_EMPTY_LINE);
        if (batch.length) startCooldown(setCooldownUntil, setCooldownRemaining);
      })
      .catch((error) => {
        if (!alive) return;
        setCatalogState("error");
        setMascotMood("empty");
        setMascotLine(COSTUME_ERROR_LINE);
        onNoticeRef.current?.(error.message, "danger");
      });
    return () => {
      alive = false;
    };
  }, [retryVersion, token, user?.id]);

  useEffect(() => {
    if (!cooldownUntil) return undefined;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) setCooldownUntil(0);
    };
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (catalogState !== "ready") return undefined;
    const previousIds = currentBatch.map((costume) => costume.id);
    const next = selectCostumeBatch(costumes, previousIds);
    setPreparedBatch(next);
    void preloadImageAssets(next.map((costume) => costume.portraitUrl), {
      concurrency: 3,
      taskTimeoutMs: COSTUME_REFRESH_COOLDOWN_MS
    });
    return undefined;
  }, [catalogState, costumes, currentBatch]);

  async function purchaseCostume(costume) {
    setPurchasingId(costume.id);
    try {
      const data = await api(`/api/costumes/${costume.id}/purchase`, { method: "POST", token });
      setEffectiveUser(data.user);
      onPurchasedRef.current?.(data.user);
      setCostumes((current) => current.map((entry) => (
        entry.id === costume.id ? { ...entry, ...data.costume, owned: true } : entry
      )));
      setCurrentBatch((current) => current.map((entry) => (
        entry.id === costume.id ? { ...entry, ...data.costume, owned: true } : entry
      )));
      setMascotFeedback("thanks", COSTUME_THANKS_LINE);
      onNoticeRef.current?.(`已购买${costume.name}`, "success");
      for (const unlock of data.achievementUnlocks ?? []) {
        onNoticeRef.current?.(`达成成就：${unlock.name}`, "achievement");
      }
      return data.costume;
    } catch (error) {
      if (error.message === "金币不足") setMascotFeedback("empty", COSTUME_INSUFFICIENT_LINE);
      onNoticeRef.current?.(error.message, "danger");
      return null;
    } finally {
      setPurchasingId("");
    }
  }

  async function equipCostume(costume) {
    setEquippingId(costume.id);
    try {
      const data = await api("/api/costumes/equip", {
        method: "POST",
        token,
        body: { characterSlug: costume.characterSlug, costumeId: costume.id }
      });
      setEffectiveUser(data.user);
      onPurchasedRef.current?.(data.user);
      setCostumes((current) => current.map((entry) => ({
        ...entry,
        equipped: entry.characterSlug === costume.characterSlug ? entry.id === costume.id : entry.equipped
      })));
      setCurrentBatch((current) => current.map((entry) => ({
        ...entry,
        equipped: entry.characterSlug === costume.characterSlug ? entry.id === costume.id : entry.equipped
      })));
      onNoticeRef.current?.(`已装扮${costume.name}`, "success");
      return true;
    } catch (error) {
      onNoticeRef.current?.(error.message, "danger");
      return false;
    } finally {
      setEquippingId("");
    }
  }

  function refreshCatalog() {
    if (catalogState === "error") {
      setRetryVersion((version) => version + 1);
      return;
    }
    if (catalogState !== "ready" || cooldownRemaining > 0 || preparedBatch === null) return;
    if (!currentBatch.length && !preparedBatch.length) return;
    setCurrentBatch(preparedBatch);
    setPreparedBatch(null);
    setBatchVersion((version) => version + 1);
    setMascotMood(preparedBatch.length ? "greeting" : "empty");
    setMascotLine(preparedBatch.length ? pickCostumeLine(COSTUME_REFRESH_LINES) : COSTUME_EMPTY_LINE);
    if (preparedBatch.length) startCooldown(setCooldownUntil, setCooldownRemaining);
  }

  function setMascotFeedback(mood, line) {
    setMascotMood(mood);
    setMascotLine(line);
  }

  const eligibleCount = eligibleCostumes(costumes).length;
  const refreshDisabled = catalogState === "loading"
    || (catalogState === "ready" && (cooldownRemaining > 0 || preparedBatch === null || (!currentBatch.length && eligibleCount === 0)));

  return {
    batchVersion,
    catalogState,
    cooldownRemaining,
    currentBatch,
    effectiveUser,
    equippingId,
    equipCostume,
    mascotLine,
    mascotMood,
    purchasingId,
    purchaseCostume,
    refreshCatalog,
    refreshDisabled,
    refreshMode: catalogState === "error" ? "retry" : cooldownRemaining > 0 ? "cooldown" : "refresh"
  };
}

function startCooldown(setCooldownUntil, setCooldownRemaining) {
  setCooldownRemaining(Math.ceil(COSTUME_REFRESH_COOLDOWN_MS / 1000));
  setCooldownUntil(Date.now() + COSTUME_REFRESH_COOLDOWN_MS);
}
