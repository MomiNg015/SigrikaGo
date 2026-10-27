import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { characterListFromCatalog } from "../../shared/characters.js";
import { RAINBOW_BEAN_CANDY_ID } from "../../shared/rainbowBeanCandy.js";
import { SIGRIKA_CANDY_CORRUPTION_ENABLED } from "../../shared/sigrikaCandyAvailability.js";
import {
  SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID,
  SIGRIKA_CANDY_STORY_NODE_IDS
} from "../../shared/sigrikaCandyArc.js";

export function useWarehouseInventory({
  characters,
  initialTargetState = null,
  token,
  user,
  onNotice,
  onStoryScript,
  onSigrikaCorruptionEntry,
  onUserChange
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetItem, setTargetItem] = useState(null);
  const [targetResult, setTargetResult] = useState(initialTargetState);
  const [usingItemId, setUsingItemId] = useState("");
  const itemUseInFlightRef = useRef(false);
  const debugJumpPendingRef = useRef(false);

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
    if (itemUseInFlightRef.current) return;
    itemUseInFlightRef.current = true;
    setUsingItemId(item.itemId);
    try {
      const data = await api(`/api/items/${item.itemId}/use`, {
        method: "POST",
        token,
        body: { characterId }
      });
      setItems(data.items ?? []);
      onUserChange(data.user);
      const rejected = data.itemUseOutcome === "rejected";
      if (data.storyScript && data.target?.characterId) {
        const character = characters[data.target.characterId];
        const labels = itemStoryLabels(data.item?.name ?? item.name, data.itemUseOutcome);
        const storyScript = item.itemId === RAINBOW_BEAN_CANDY_ID
          ? withSigrikaCandyDebugJumpOption(data.storyScript, { characterId: data.target.characterId })
          : data.storyScript;
        setTargetItem(null);
        setTargetResult(null);
        if (storyScript === data.storyScript) {
          onStoryScript?.(storyScript, labels);
        } else {
          onStoryScript?.(storyScript, labels, {
            onNavigate(nextNodeId) {
              if (nextNodeId !== SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID) return false;
              if (debugJumpPendingRef.current) return true;
              debugJumpPendingRef.current = true;
              if (onSigrikaCorruptionEntry) {
                void onSigrikaCorruptionEntry({ debug: true })
                  .catch((apiError) => onNotice?.(apiError.message, "danger"))
                  .finally(() => { debugJumpPendingRef.current = false; });
                return true;
              }
              void api("/api/items/rainbow-bean-candy/sigrika/debug/jump-to-eight", {
                method: "POST",
                token
              })
                .then((jumpData) => {
                  onUserChange(jumpData.user);
                  onStoryScript?.({
                    ...data.storyScript,
                    startNodeId: SIGRIKA_CANDY_STORY_NODE_IDS.corruptionStart
                  }, labels, { dismissible: false });
                })
                .catch((apiError) => onNotice?.(apiError.message, "danger"))
                .finally(() => { debugJumpPendingRef.current = false; });
              return true;
            }
          });
        }
        const notice = characterItemUseNotice(character?.name ?? data.target.characterId, item.name, data.itemUseOutcome);
        onNotice?.(notice.message, notice.type);
      } else if (rejected && data.target?.characterId) {
        const character = characters[data.target.characterId];
        const notice = characterItemUseNotice(character?.name ?? data.target.characterId, item.name, data.itemUseOutcome);
        setTargetItem(null);
        setTargetResult(null);
        onNotice?.(notice.message, notice.type);
      } else if (data.effectText && data.target?.characterId) {
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
      notifyAchievementUnlocks(data.achievementUnlocks, onNotice);
    } catch (apiError) {
      onNotice?.(apiError.message, "danger");
    } finally {
      itemUseInFlightRef.current = false;
      setUsingItemId("");
    }
  }

  const ownedCharacters = useMemo(() => warehouseOwnedCharactersForDisplay(
    characters,
    user?.ownedCharacters
  ), [user?.ownedCharacters, characters]);

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

export function warehouseOwnedCharactersForDisplay(characters = {}, ownedCharacterIds = []) {
  const owned = new Set((ownedCharacterIds ?? []).map(canonicalCharacterId));
  return characterListFromCatalog(characters)
    .filter((character) => owned.has(canonicalCharacterId(character.id)));
}

function notifyAchievementUnlocks(unlocks = [], onNotice) {
  for (const unlock of unlocks) {
    onNotice?.(`达成成就：${unlock.name}`, "achievement");
  }
}

export function itemStoryLabels(itemName, itemUseOutcome = "accepted") {
  return {
    title: itemName || "道具互动",
    fastForward: "快进并跳过剧情",
    skipTitle: "确认跳过剧情？",
    skipMessage: itemUseOutcome === "rejected"
      ? "跳过只会关闭这段演出，道具没有消耗，效果也没有生效。"
      : "跳过只会关闭这段演出，道具效果已经生效。",
    noScript: "暂无可播放的剧情内容",
    close: "关闭剧情",
    textLabel: "道具互动剧情文本"
  };
}

export function withSigrikaCandyDebugJumpOption(script, {
  characterId = "",
  enabled = !import.meta.env.PROD
} = {}) {
  if (!SIGRIKA_CANDY_CORRUPTION_ENABLED || !enabled || canonicalCharacterId(characterId) !== "sigrika" || !script) return script;
  const startNodeId = String(script.startNodeId ?? "");
  if (!/^use-[1-7]-start$/.test(startNodeId)) return script;
  const nodes = Array.isArray(script.nodes) ? script.nodes : [];
  const startNode = nodes.find((node) => node.id === startNodeId);
  if (!startNode || !nodes.some((node) => node.id === SIGRIKA_CANDY_STORY_NODE_IDS.corruptionStart)) return script;
  const existingOptions = Array.isArray(startNode.options) ? startNode.options : [];
  if (existingOptions.some((option) => option.nextNodeId === SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID)) return script;
  const normalOptions = existingOptions.length > 0
    ? existingOptions
    : startNode.nextNodeId
      ? [{ label: "继续当前剧情", nextNodeId: startNode.nextNodeId }]
      : [];
  return {
    ...script,
    nodes: nodes.map((node) => node.id === startNodeId ? {
      ...node,
      options: [
        ...normalOptions,
        { label: "【测试】直接跳到第 8 次（黑化剧情）", nextNodeId: SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID }
      ]
    } : node)
  };
}

export function characterItemUseNotice(characterName, itemName, itemUseOutcome = "accepted") {
  return itemUseOutcome === "rejected"
    ? { message: `${characterName}拒绝了${itemName}，道具未消耗`, type: "danger" }
    : { message: `对${characterName}成功使用了${itemName}`, type: "success" };
}
