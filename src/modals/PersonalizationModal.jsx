import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Palette, ShieldCheck, Trophy, X } from "lucide-react";
import { api } from "../api/client.js";

const SECTIONS = [
  { type: "title", field: "titleAssetId", label: "称号", icon: Trophy },
  { type: "badge", field: "badgeAssetId", label: "徽章", icon: ShieldCheck },
  { type: "nameplate", field: "nameplateAssetId", label: "用户名背景", icon: Palette }
];

export default function PersonalizationModal({ token, user, onClose, onNotice, onUserChange }) {
  const [assets, setAssets] = useState([]);
  const [equipment, setEquipment] = useState(() => user?.achievementEquipment ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api("/api/me/achievement-equipment", { token })
      .then((data) => {
        if (cancelled) return;
        setAssets(data.assets ?? []);
        setEquipment(data.equipment ?? {});
      })
      .catch((error) => onNotice?.(error.message));
    return () => {
      cancelled = true;
    };
  }, [token, onNotice]);

  const grouped = useMemo(() => Object.fromEntries(
    SECTIONS.map((section) => [section.type, assets.filter((asset) => asset.type === section.type)])
  ), [assets]);

  async function save() {
    setSaving(true);
    try {
      const data = await api("/api/me/achievement-equipment", { method: "PATCH", token, body: equipment });
      setEquipment(data.equipment ?? {});
      onUserChange?.({ ...user, achievementEquipment: data.equipment ?? {} });
      onNotice?.("个性化装备已更新", "success");
    } catch (error) {
      onNotice?.(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal personalization-modal" onClick={(event) => event.stopPropagation()}>
        <header className="house-header achievement-header">
          <h2>个性化</h2>
          <button className="close-button" type="button" onClick={onClose} aria-label="关闭个性化窗口"><X size={20} /></button>
        </header>
        <div className="personalization-preview">
          <span className="profile-nameplate-preview">
            {selectedAsset(assets, equipment.nameplateAssetId)?.name || "默认背景"}
          </span>
          <strong>{selectedAsset(assets, equipment.titleAssetId)?.name || "未装备称号"}</strong>
          <p>
            <BadgeCheck size={16} />
            {selectedAsset(assets, equipment.badgeAssetId)?.name || "未装备徽章"}
          </p>
        </div>
        <div className="personalization-grid">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const options = grouped[section.type] ?? [];
            return (
              <section key={section.type} className="personalization-section">
                <h3><Icon size={18} />{section.label}</h3>
                <button
                  type="button"
                  className={!equipment[section.field] ? "selected" : ""}
                  onClick={() => setEquipment((current) => ({ ...current, [section.field]: "" }))}
                >
                  默认
                </button>
                {options.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className={equipment[section.field] === asset.id ? "selected" : ""}
                    onClick={() => setEquipment((current) => ({ ...current, [section.field]: asset.id }))}
                  >
                    {asset.imageUrl && <img src={asset.imageUrl} alt="" />}
                    <span>{asset.name}</span>
                  </button>
                ))}
                {options.length === 0 && <p>达成相关成就后会出现在这里。</p>}
              </section>
            );
          })}
        </div>
        <button className="primary-action" type="button" onClick={save} disabled={saving}>
          保存装备
        </button>
      </section>
    </div>
  );
}

function selectedAsset(assets, id) {
  return assets.find((asset) => asset.id === id) ?? null;
}
