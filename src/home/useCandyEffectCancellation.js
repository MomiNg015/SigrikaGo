import { useRef, useState } from "react";
import { api } from "../api/client.js";
import { activeCharacterItemEffects } from "../shared/characterCandyEffects.js";

export function useCandyEffectCancellation({ token, user, onUserChange, onNotice }) {
  const busy = useRef(false);
  const [pending, setPending] = useState("");
  const enabled = import.meta.env.DEV && Boolean(token) && !user?.sigrikaCandyArc?.corrupted;
  async function cancel(characterId) {
    if (!enabled || busy.current || !user?.ownedCharacters?.includes(characterId)
      || !activeCharacterItemEffects(characterId, user?.itemEffects).length) return;
    busy.current = true;
    setPending(characterId);
    try {
      const data = await api(`/api/items/rainbow-bean-candy/effects/${characterId}/cancel`, { method: "POST", token });
      onUserChange?.(data.user);
      onNotice?.("已取消该角色的糖果效果（仅开发环境）", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      busy.current = false;
      setPending("");
    }
  }
  return { enabled, pending, cancel };
}
