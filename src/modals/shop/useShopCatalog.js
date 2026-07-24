import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { preloadImageAssets } from "../../shared/preloadAssets.js";
import {
  buildShopCardPresentation,
  eligibleShopItems,
  pickShopMascotLine,
  selectShopBatch,
  SHOP_MASCOT_EMPTY_LINE,
  SHOP_MASCOT_ERROR_LINE,
  SHOP_MASCOT_LOADING_LINE,
  SHOP_MASCOT_MOODS,
  SHOP_MASCOT_REFRESH_LINES,
  SHOP_MASCOT_THANKS_LINE,
  SHOP_MASCOT_THANKS_DURATION_MS,
  SHOP_REFRESH_COOLDOWN_MS
} from "../shopModalHelpers.js";

export function useShopCatalog({ token, user, musicTracks, onNotice, onPurchased }) {
  const [items, setItems] = useState([]);
  const [effectiveUser, setEffectiveUser] = useState(user);
  const [catalogState, setCatalogState] = useState("loading");
  const [currentBatch, setCurrentBatch] = useState([]);
  const [preparedBatch, setPreparedBatch] = useState(null);
  const [batchVersion, setBatchVersion] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [contextualLine, setContextualLine] = useState(SHOP_MASCOT_LOADING_LINE);
  const [mascotMood, setMascotMood] = useState(SHOP_MASCOT_MOODS.default);
  const [purchasingId, setPurchasingId] = useState("");
  const mascotResetTimerRef = useRef(null);
  const userRef = useRef(user);
  const musicTracksRef = useRef(musicTracks);
  const onNoticeRef = useRef(onNotice);
  const onPurchasedRef = useRef(onPurchased);

  useEffect(() => {
    userRef.current = user;
    musicTracksRef.current = musicTracks;
    onNoticeRef.current = onNotice;
    onPurchasedRef.current = onPurchased;
  }, [musicTracks, onNotice, onPurchased, user]);

  useEffect(() => setEffectiveUser(user), [user]);
  useEffect(() => () => clearShopMascotThanksTimer(mascotResetTimerRef), []);

  useEffect(() => {
    let alive = true;
    if (!token || !user) {
      setCatalogState("ready");
      setItems([]);
      setCurrentBatch([]);
      setPreparedBatch([]);
      setContextualLine(SHOP_MASCOT_EMPTY_LINE);
      onNoticeRef.current?.("请先登录", "danger");
      return () => {
        alive = false;
      };
    }

    setCatalogState("loading");
    setContextualLine(SHOP_MASCOT_LOADING_LINE);
    setCurrentBatch([]);
    setPreparedBatch(null);
    api("/api/shop", { token })
      .then((data) => {
        if (!alive) return;
        const catalog = applyMusicItemNames(data.items ?? [], musicTracksRef.current);
        const currentUser = userRef.current;
        const batch = selectShopBatch(catalog, currentUser);
        setItems(catalog);
        setEffectiveUser(currentUser);
        setCurrentBatch(buildShopCardPresentation(batch));
        setBatchVersion((version) => version + 1);
        setContextualLine(batch.length ? pickShopMascotLine() : SHOP_MASCOT_EMPTY_LINE);
        setCatalogState("ready");
        if (batch.length) startShopCooldown(setCooldownUntil, setCooldownRemaining);
      })
      .catch((apiError) => {
        if (!alive) return;
        setCatalogState("error");
        setContextualLine(SHOP_MASCOT_ERROR_LINE);
        onNoticeRef.current?.(apiError.message, "danger");
      });
    return () => {
      alive = false;
    };
  }, [retryVersion, token, user?.id]);

  useEffect(() => {
    if (!cooldownUntil) return undefined;
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) setCooldownUntil(0);
    };
    updateRemaining();
    const intervalId = setInterval(updateRemaining, 200);
    return () => clearInterval(intervalId);
  }, [cooldownUntil]);

  useEffect(() => {
    if (catalogState !== "ready") return undefined;
    const previousIds = currentBatch.map(({ item }) => item.id);
    const nextItems = selectShopBatch(items, effectiveUser, previousIds);
    const nextPresentation = buildShopCardPresentation(nextItems);
    setPreparedBatch(nextPresentation);
    void preloadImageAssets(nextItems.map((item) => item.imageUrl), {
      concurrency: 3,
      taskTimeoutMs: SHOP_REFRESH_COOLDOWN_MS
    });
    return undefined;
  }, [catalogState, currentBatch, effectiveUser, items]);

  async function buyItem(item) {
    setPurchasingId(item.id);
    try {
      const data = await api(`/api/shop/${item.id}/purchase`, { method: "POST", token });
      onPurchasedRef.current?.(data.user);
      setEffectiveUser(data.user);
      if (data.item) {
        setItems((current) => current.map((shopItem) => shopItem.id === data.item.id ? data.item : shopItem));
        setCurrentBatch((current) => current.map((entry) => (
          entry.item.id === data.item.id ? { ...entry, item: data.item } : entry
        )));
      }
      scheduleShopMascotThanks({ timerRef: mascotResetTimerRef, setMascotMood });
      onNoticeRef.current?.(`已购买${item.name}`, "success");
      notifyAchievementUnlocks(data.achievementUnlocks, onNoticeRef.current);
    } catch (apiError) {
      onNoticeRef.current?.(apiError.message, "danger");
    } finally {
      setPurchasingId("");
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
    setContextualLine(preparedBatch.length
      ? pickShopMascotLine(Math.random, SHOP_MASCOT_REFRESH_LINES)
      : SHOP_MASCOT_EMPTY_LINE);
    if (preparedBatch.length) startShopCooldown(setCooldownUntil, setCooldownRemaining);
  }

  const eligibleCount = eligibleShopItems(items, effectiveUser).length;
  const refreshDisabled = catalogState === "loading"
    || (catalogState === "ready" && (cooldownRemaining > 0 || preparedBatch === null || (!currentBatch.length && eligibleCount === 0)));

  return {
    batchVersion,
    buyItem,
    catalogState,
    cooldownRemaining,
    currentBatch,
    effectiveUser,
    mascotLine: mascotMood === SHOP_MASCOT_MOODS.thanks ? SHOP_MASCOT_THANKS_LINE : contextualLine,
    mascotMood,
    purchasingId,
    refreshCatalog,
    refreshDisabled,
    refreshMode: catalogState === "error" ? "retry" : cooldownRemaining > 0 ? "cooldown" : "refresh"
  };
}

function startShopCooldown(setCooldownUntil, setCooldownRemaining) {
  setCooldownRemaining(Math.ceil(SHOP_REFRESH_COOLDOWN_MS / 1000));
  setCooldownUntil(Date.now() + SHOP_REFRESH_COOLDOWN_MS);
}

export function scheduleShopMascotThanks({
  timerRef,
  setMascotMood,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout
}) {
  clearShopMascotThanksTimer(timerRef, clearTimeoutFn);
  setMascotMood(SHOP_MASCOT_MOODS.thanks);
  timerRef.current = setTimeoutFn(() => {
    setMascotMood(SHOP_MASCOT_MOODS.default);
    timerRef.current = null;
  }, SHOP_MASCOT_THANKS_DURATION_MS);
}

export function clearShopMascotThanksTimer(timerRef, clearTimeoutFn = clearTimeout) {
  if (!timerRef.current) return;
  clearTimeoutFn(timerRef.current);
  timerRef.current = null;
}

function notifyAchievementUnlocks(unlocks = [], onNotice) {
  for (const unlock of unlocks) onNotice?.(`达成成就：${unlock.name}`, "achievement");
}

function applyMusicItemNames(items, musicTracks = {}) {
  return items.map((item) => {
    if (item.category !== "music") return item;
    const trackName = musicTracks?.[item.targetId]?.name;
    return trackName ? { ...item, name: trackName } : item;
  });
}
