import { useEffect, useMemo, useState } from "react";
import { Palette, ShieldCheck, Trophy, X } from "lucide-react";
import { api } from "../api/client.js";
import UserIdentity from "../shared/UserIdentity.jsx";

const SECTIONS = [
  { type: "title", field: "titleAssetId", label: "称号", icon: Trophy },
  { type: "badge", field: "badgeAssetId", label: "徽章", icon: ShieldCheck },
  { type: "nameplate", field: "nameplateAssetId", label: "用户名背景", icon: Palette }
];

export default function PersonalizationModal({ token, user, onClose, onNotice, onUserChange }) {
  const [assets, setAssets] = useState([]);
  const [equipment, setEquipment] = useState(() => normalizeEquipment(user?.achievementEquipment));
  const [savedEquipment, setSavedEquipment] = useState(() => normalizeEquipment(user?.achievementEquipment));
  const [equipmentAssets, setEquipmentAssets] = useState(() => user?.achievementEquipmentAssets ?? {});
  const [pickerType, setPickerType] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api("/api/me/achievement-equipment", { token })
      .then((data) => {
        if (cancelled) return;
        const nextEquipment = normalizeEquipment(data.equipment);
        setAssets(data.assets ?? []);
        setEquipment(nextEquipment);
        setSavedEquipment(nextEquipment);
        setEquipmentAssets(data.equipmentAssets ?? {});
      })
      .catch((error) => onNotice?.(error.message));
    return () => {
      cancelled = true;
    };
  }, [token, onNotice]);

  const grouped = useMemo(() => Object.fromEntries(
    SECTIONS.map((section) => [section.type, assets.filter((asset) => asset.type === section.type)])
  ), [assets]);

  const previewAssets = useMemo(() => ({
    title: selectedAsset(assets, equipment.titleAssetId) ?? fallbackAsset(equipmentAssets.title, equipment.titleAssetId),
    badge: selectedAsset(assets, equipment.badgeAssetId) ?? fallbackAsset(equipmentAssets.badge, equipment.badgeAssetId),
    nameplate: selectedAsset(assets, equipment.nameplateAssetId) ?? fallbackAsset(equipmentAssets.nameplate, equipment.nameplateAssetId)
  }), [assets, equipment, equipmentAssets]);

  async function save() {
    setSaving(true);
    try {
      const data = await api("/api/me/achievement-equipment", { method: "PATCH", token, body: equipment });
      const nextEquipment = normalizeEquipment(data.equipment);
      setEquipment(nextEquipment);
      setSavedEquipment(nextEquipment);
      setEquipmentAssets(data.equipmentAssets ?? {});
      onUserChange?.({
        ...user,
        achievementEquipment: nextEquipment,
        achievementEquipmentAssets: data.equipmentAssets ?? {}
      });
      onNotice?.("个性化装备已更新", "success");
    } catch (error) {
      onNotice?.(error.message);
    } finally {
      setSaving(false);
    }
  }

  function optionClass(section, assetId) {
    const activeId = equipment[section.field] || "";
    const savedId = savedEquipment[section.field] || "";
    const classes = [];
    if (savedId === assetId) classes.push("equipped");
    if (activeId === assetId && savedId !== assetId) classes.push("trying");
    if (activeId === assetId) classes.push("selected");
    return classes.join(" ");
  }

  function selectedOption(section) {
    const activeId = equipment[section.field] || "";
    return selectedAsset(assets, activeId) ?? fallbackAsset(equipmentAssets[section.type], activeId);
  }

  function chooseOption(section, assetId) {
    setEquipment((current) => ({ ...current, [section.field]: assetId }));
    setPickerType("");
  }

  const pickerSection = SECTIONS.find((section) => section.type === pickerType) ?? null;
  const previewUser = {
    ...user,
    achievementEquipment: equipment,
    achievementEquipmentAssets: previewAssets
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal personalization-modal" onClick={(event) => event.stopPropagation()}>
        <header className="house-header achievement-header">
          <h2>个性化</h2>
          <button className="close-button" type="button" onClick={onClose} aria-label="关闭个性化窗口"><X size={20} /></button>
        </header>
        <div className="personalization-preview" aria-label="个性化试穿预览">
          <UserIdentity user={previewUser} />
        </div>
        <div className="personalization-grid">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const currentAsset = selectedOption(section);
            const activeId = equipment[section.field] || "";
            return (
              <section key={section.type} className="personalization-section">
                <h3><Icon size={18} />{section.label}</h3>
                <div className="personalization-section-summary">
                  <span className="personalization-current-option">
                    {currentAsset?.imageUrl && <img src={currentAsset.imageUrl} alt="" />}
                    <b>{currentAsset?.name ?? "默认"}</b>
                  </span>
                  <button
                    type="button"
                    className={`personalization-style-trigger ${optionClass(section, activeId)}`}
                    onClick={() => setPickerType(section.type)}
                  >
                    样式选择
                  </button>
                </div>
              </section>
            );
          })}
        </div>
        {pickerSection && (
          <div className="nested-modal-backdrop personalization-picker-backdrop" onClick={() => setPickerType("")}>
            <section
              className="nested-modal personalization-picker-modal"
              aria-label={`选择${pickerSection.label}`}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="personalization-picker-header">
                <h3>选择{pickerSection.label}</h3>
                <button type="button" className="close-button" onClick={() => setPickerType("")} aria-label="关闭样式选择窗口">
                  <X size={18} />
                </button>
              </header>
              <div className="personalization-picker-list">
                <button
                  type="button"
                  className={optionClass(pickerSection, "")}
                  onClick={() => chooseOption(pickerSection, "")}
                >
                  <span className="personalization-option-preview" aria-hidden="true" />
                  <span>默认</span>
                </button>
                {(grouped[pickerSection.type] ?? []).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className={optionClass(pickerSection, asset.id)}
                    onClick={() => chooseOption(pickerSection, asset.id)}
                  >
                    <span className="personalization-option-preview">
                      {asset.imageUrl && <img src={asset.imageUrl} alt="" />}
                    </span>
                    <span>{asset.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
        <button className="primary-action" type="button" onClick={save} disabled={saving}>
          保存
        </button>
      </section>
    </div>
  );
}

function normalizeEquipment(equipment = {}) {
  return {
    titleAssetId: equipment.titleAssetId || "",
    badgeAssetId: equipment.badgeAssetId || "",
    nameplateAssetId: equipment.nameplateAssetId || ""
  };
}

function selectedAsset(assets, id) {
  return assets.find((asset) => asset.id === id) ?? null;
}

function fallbackAsset(asset, selectedId) {
  return selectedId ? asset : null;
}
