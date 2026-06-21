import { X } from "lucide-react";
import { CharacterMusicPreview } from "../../audio/CharacterMusicPreview.jsx";
import { resolveSkillMusicTrack, skillMusicOptionsForCharacter } from "../../shared/musicLibrary.js";
import { ReplayList } from "../ReplayList.jsx";
import { characterRecordColumns } from "../UserProfileCard.jsx";
import { characterCandyPortrait } from "./houseStats.js";

export function CharacterDetailDialog({ character, detailOwned, itemEffects, user, audioSettings, musicTracks, onSelectCharacterMusic, onClose }) {
  if (!character) return null;
  const musicOptions = skillMusicOptionsForCharacter({
    characterId: character.id,
    ownedMusicIds: user?.ownedMusicIds,
    tracks: musicTracks
  });
  const currentMusicTrack = resolveSkillMusicTrack({
    characterId: character.id,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds,
    tracks: musicTracks
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

export function CharacterRecordsPanel({ characterRecords, itemEffects }) {
  return (
    <div className="character-record-list">
      {characterRecords.length === 0 && <p className="quiet-text">{"\u6682\u65e0\u89d2\u8272\u6218\u7ee9\u3002"}</p>}
      {characterRecords.map((entry) => {
        const record = characterRecordColumns(entry);
        return (
          <article className="character-record-row" key={entry.character.id}>
            <img src={characterCandyPortrait(entry.character, itemEffects)} alt={entry.character.name} />
            <strong>{entry.character.name}</strong>
            <span className="character-record-total">{record.total}{"\u5c40"}</span>
            <span className="character-record-wins">{record.wins}{"\u80dc"}</span>
            <span className="character-record-losses">{record.losses}{"\u8d1f"}</span>
            <span className="character-record-draws">{record.draws}{"\u548c"}</span>
            <b className="character-record-rate">{record.winRate}</b>
          </article>
        );
      })}
    </div>
  );
}

export function CharacterRecordsDialog({ characterRecords, itemEffects, onClose }) {
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section className="nested-modal character-record-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        <h3>角色战绩</h3>
        <CharacterRecordsPanel characterRecords={characterRecords} itemEffects={itemEffects} />
      </section>
    </div>
  );
}
