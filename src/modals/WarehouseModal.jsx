import { useEffect, useMemo, useState } from "react";
import { Package, UserRound, X } from "lucide-react";
import { api } from "../api/client.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";

export default function WarehouseModal({ token, user, characters, onUserChange, onNotice, onClose, initialTargetState = null }) {
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
  }, [token]);

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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="warehouse-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="warehouse-header">
          <Package size={28} />
          <div>
            <h2>仓库</h2>
            <p className="quiet-text">查看并使用已经购买的道具。</p>
          </div>
        </header>
        {loading && <p className="quiet-text">加载中...</p>}
        {!loading && items.length === 0 && (
          <div className="warehouse-empty">
            <Package />
            <strong>暂无道具</strong>
          </div>
        )}
        <div className="warehouse-grid">
          {items.map((item) => (
            <article className="warehouse-item" key={item.itemId}>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" /> : <Package />}
              <div>
                <strong>{item.name}</strong>
                <p>{item.description || "效果待配置"}</p>
                <span>数量 {item.quantity}</span>
              </div>
              <button
                className="primary-action"
                disabled={usingItemId === item.itemId || item.quantity <= 0}
                onClick={() => item.targetType === "character" ? setTargetItem(item) : useItem(item)}
              >
                {usingItemId === item.itemId ? "使用中" : "使用"}
              </button>
            </article>
          ))}
        </div>
        {(targetItem || targetResult) && (
          <div className="modal-backdrop nested-backdrop" onClick={() => {
            setTargetItem(null);
            setTargetResult(null);
          }}>
            <section className="character-target-modal" onClick={(event) => event.stopPropagation()}>
              <button className="close-button" onClick={() => {
                setTargetItem(null);
                setTargetResult(null);
              }}><X size={18} /></button>
              {warehouseTargetState(targetResult).isResolved ? (
                <WarehouseEffectResult targetState={targetResult} characters={characters} />
              ) : (
                <>
                  <h2>选择角色</h2>
                  <div className="warehouse-character-grid">
                    {ownedCharacters.map((character) => (
                      <button key={character.id} type="button" onClick={() => useItem(targetItem, character.id)}>
                        <img src={resolveCandyPortrait(character, user?.itemEffects)} alt={character.name} loading="lazy" decoding="async" />
                        <span>{character.name}</span>
                      </button>
                    ))}
                    {ownedCharacters.length === 0 && (
                      <p className="quiet-text"><UserRound size={18} />暂无可选择角色</p>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function WarehouseEffectResult({ targetState, characters }) {
  const character = characters[targetState.characterId];
  if (!character) return null;
  return (
    <div className="warehouse-effect-result">
      <img src={resolveCandyPortrait(character, targetState.itemEffects)} alt={character.name} loading="lazy" decoding="async" />
      <strong>{character.name}</strong>
      <p>{targetState.effectText}</p>
    </div>
  );
}

export function warehouseTargetState(targetState) {
  return {
    isResolved: Boolean(targetState?.characterId && targetState?.effectText)
  };
}
