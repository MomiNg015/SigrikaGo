import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client.js";
import {
  buildShopSlots,
  getShopPageCount,
  pickShopMascotLine,
  SHOP_MASCOT_MOODS,
  SHOP_MASCOT_THANKS_LINE,
  SHOP_MASCOT_THANKS_DURATION_MS
} from "../shopModalHelpers.js";

export function useShopCatalog({ token, user, musicTracks, onNotice, onPurchased }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("item");
  const [activePage, setActivePage] = useState(1);
  const [initialMascotLine] = useState(() => pickShopMascotLine());
  const [mascotMood, setMascotMood] = useState(SHOP_MASCOT_MOODS.default);
  const [purchasingId, setPurchasingId] = useState("");
  const mascotResetTimerRef = useRef(null);

  useEffect(() => () => clearShopMascotThanksTimer(mascotResetTimerRef), []);

  useEffect(() => {
    let alive = true;
    if (!token || !user) {
      setLoading(false);
      setItems([]);
      onNotice?.("请先登录", "danger");
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    api("/api/shop", { token })
      .then((data) => {
        if (alive) setItems(applyMusicItemNames(data.items ?? [], musicTracks));
      })
      .catch((apiError) => {
        if (alive) onNotice?.(apiError.message, "danger");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, user, musicTracks, onNotice]);

  async function buyItem(item) {
    setPurchasingId(item.id);
    try {
      const data = await api(`/api/shop/${item.id}/purchase`, { method: "POST", token });
      onPurchased(data.user);
      if (data.item) {
        setItems((current) => current.map((shopItem) => shopItem.id === data.item.id ? data.item : shopItem));
      }
      scheduleShopMascotThanks({
        timerRef: mascotResetTimerRef,
        setMascotMood
      });
      onNotice?.(`已购买${item.name}`, "success");
      notifyAchievementUnlocks(data.achievementUnlocks, onNotice);
    } catch (apiError) {
      onNotice?.(apiError.message, "danger");
    } finally {
      setPurchasingId("");
    }
  }

  const pageCount = useMemo(() => getShopPageCount(items, activeCategory), [items, activeCategory]);

  useEffect(() => {
    setActivePage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const shopSlots = useMemo(() => buildShopSlots(items, activeCategory, activePage), [items, activeCategory, activePage]);

  function selectCategory(category) {
    setActiveCategory(category);
    setActivePage(1);
  }

  return {
    activeCategory,
    activePage,
    buyItem,
    loading,
    mascotLine: mascotMood === SHOP_MASCOT_MOODS.thanks ? SHOP_MASCOT_THANKS_LINE : initialMascotLine,
    mascotMood,
    pageCount,
    purchasingId,
    selectCategory,
    setActivePage,
    shopSlots
  };
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
  for (const unlock of unlocks) {
    onNotice?.(`达成成就：${unlock.name}`, "achievement");
  }
}

function applyMusicItemNames(items, musicTracks = {}) {
  return items.map((item) => {
    if (item.category !== "music") return item;
    const trackName = musicTracks?.[item.targetId]?.name;
    return trackName ? { ...item, name: trackName } : item;
  });
}
