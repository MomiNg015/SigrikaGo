import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";

export function useWarehouseInventory({
  characters,
  initialTargetState = null,
  token,
  user,
  onNotice,
  onUserChange
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetItem, setTargetItem] = useState(null);
  const [targetResult, setTargetResult] = useState(initialTargetState);
  const [usingItemId, setUsingItemId] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api("/api/items/inventory", { token })
      .then((data) => {
        if (alive) setItems(data.items ?? []);
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
  }, [token, onNotice]);

  async function useItem(item, characterId = "") {
    setUsingItemId(item.itemId);
    try {
      const data = await api(`/api/items/${item.itemId}/use`, {
        method: "POST",
        token,
        body: { characterId }
      });
      setItems(data.items ?? []);
      onUserChange(data.user);
      if (data.effectText && data.target?.characterId) {
        const character = characters[data.target.characterId];
        setTargetResult({
          item,
          characterId: data.target.characterId,
          effectText: data.effectText,
          itemEffects: data.user?.itemEffects
        });
        onNotice?.(`对${character?.name ?? data.target.characterId}成功使用了${item.name}`, "success");
      } else {
        setTargetItem(null);
        onNotice?.(`成功使用了${item.name}`, "success");
      }
    } catch (apiError) {
      onNotice?.(apiError.message, "danger");
    } finally {
      setUsingItemId("");
    }
  }

  const ownedCharacters = useMemo(() => (user?.ownedCharacters ?? [])
    .map((characterId) => characters[characterId])
    .filter(Boolean), [user?.ownedCharacters, characters]);

  function closeTargetModal() {
    setTargetItem(null);
    setTargetResult(null);
  }

  return {
    closeTargetModal,
    items,
    loading,
    ownedCharacters,
    setTargetItem,
    targetItem,
    targetResult,
    useItem,
    usingItemId
  };
}
