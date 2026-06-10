import { X } from "lucide-react";
import { CharacterMusicPreview } from "../../audio/CharacterMusicPreview.jsx";
import { resolveSkillMusicTrack, skillMusicOptionsForCharacter } from "../../shared/musicLibrary.js";
import { ReplayList } from "../ReplayList.jsx";
import { characterCandyPortrait } from "./houseStats.js";

export function CharacterDetailDialog({ character, detailOwned, itemEffects, user, audioSettings, onSelectCharacterMusic, onClose }) {
  if (!character) return null;
  const musicOptions = skillMusicOptionsForCharacter({
    characterId: character.id,
    ownedMusicIds: user?.ownedMusicIds
  });
  const currentMusicTrack = resolveSkillMusicTrack({
    characterId: character.id,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds
  });
  const handleMusicChange = (trackId) => onSelectCharacterMusic?.({ characterId: character.id, trackId });
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section className={`nested-modal character-detail character-details-modal ${detailOwned ? "" : "unowned"}`} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        <div className="character-detail-art">
          <img src={characterCandyPortrait(character, itemEffects)} alt={character.name} />
        </div>
        <div className="character-detail-copy">
          <div className="character-detail-heading">
            <h3>{character.name}</h3>
            <CharacterMusicPreview
              track={currentMusicTrack}
              options={musicOptions}
              audioSettings={audioSettings}
              onTrackChange={handleMusicChange}
            />
          </div>
          <div className="skill-title-row">
            <strong>{character.skill.name}</strong>
            <span className="skill-cost-badge">超频 {formatSkillCost(character.skill)}</span>
          </div>
          <p>{character.skill.description}</p>
          <p className="acquisition-method"><strong>获得途径</strong>{character.acquisitionMethod || "初始可用"}</p>
          <p className="character-description">{character.description || "暂无角色描述"}</p>
        </div>
      </section>
    </div>
  );
}

export function HouseReplayDialog({ characterListView, records, currentUser, onClose, onOpenReplay }) {
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section className="nested-modal replay-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        <h3>对局回放</h3>
        <ReplayList records={records} characters={characterListView} currentUser={currentUser} onOpenReplay={onOpenReplay} />
      </section>
    </div>
  );
}

export function CharacterRecordsDialog({ characterRecords, itemEffects, onClose }) {
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section className="nested-modal character-record-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        <h3>角色战绩</h3>
        <div className="character-record-list">
          {characterRecords.length === 0 && <p className="quiet-text">暂无角色战绩。</p>}
          {characterRecords.map((entry) => (
            <article className="character-record-row" key={entry.character.id}>
              <img src={characterCandyPortrait(entry.character, itemEffects)} alt={entry.character.name} />
              <strong>{entry.character.name}</strong>
              <span>{entry.total}局 · {entry.wins}胜{entry.losses}负{entry.draws}和</span>
              <b>{entry.total > 0 ? `${((entry.wins / entry.total) * 100).toFixed(1)}%` : "0.0%"}</b>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatSkillCost(skillOrCost) {
  if (skillOrCost && typeof skillOrCost === "object") {
    const costType = skillOrCost.costType ?? "numeric";
    const costValue = String(skillOrCost.costValue ?? skillOrCost.cost ?? 0);
    return costType === "numeric" ? `${costValue || 0}子` : costValue;
  }
  return typeof skillOrCost === "number" ? `${skillOrCost}子` : skillOrCost;
}
