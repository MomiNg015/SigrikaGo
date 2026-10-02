import { Shirt, X } from "lucide-react";
import { createPortal } from "react-dom";
import { CharacterMusicPreview } from "../../audio/CharacterMusicPreview.jsx";
import { characterThemeStyle } from "../../shared/characterDisplay.js";
import { derivedSkillDefinitionsFromSkill } from "../../shared/derivedSkills.js";
import { normalizeCharacterCvName, normalizeCharacterCvUrl } from "../../shared/characterCv.js";
import { resolveSkillMusicTrack, skillMusicOptionsForCharacter } from "../../shared/musicLibrary.js";
import { PaginatedReplayList } from "../ReplayList.jsx";
import { ModalDialog } from "../modalComponents.jsx";
import { characterCandyPortraitProps } from "./houseStats.js";
import SkillDescription from "../../shared/SkillDescription.jsx";
import WindowTitleSticker from "../WindowTitleSticker.jsx";
import { formatSkillOverclock } from "../../shared/skillTraits.js";

export function CharacterDetailDialog({
  character,
  detailOwned,
  itemEffects,
  user,
  audioSettings,
  musicTracks,
  onSelectCharacterMusic,
  onOpenCostumes,
  onPlayDetailVoice,
  onClose
}) {
  if (!character) return null;
  const derivedSkills = derivedSkillDefinitionsFromSkill(character.skill);
  const musicSlots = characterMusicSlots({ character, derivedSkills, musicTracks, user });
  const cvName = normalizeCharacterCvName(character.cvName);
  const cvUrl = normalizeCharacterCvUrl(character.cvUrl);
  const cvLabel = cvName ? `CV：${cvName}` : "";
  const skillLabelStyle = {
    "--detail-label-color": "#111111",
    "--detail-label-bg": "color-mix(in srgb, var(--character-theme-color) 24%, #ffffff)"
  };
  const acquisitionLabelStyle = {
    "--detail-label-color": "#111111",
    "--detail-label-bg": "#e5e7eb",
    "--detail-label-border": "2px solid #6b7280",
    "--detail-label-radius": "0"
  };
  const portrait = characterCandyPortraitProps(character, itemEffects, user);
  const handleMusicChange = ({ trackId, effectType = "" }) => onSelectCharacterMusic?.({
    characterId: character.id,
    trackId,
    ...(effectType ? { effectType } : {})
  });
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section
        className={`nested-modal character-detail character-details-modal ${detailOwned ? "" : "unowned"}`}
        style={characterThemeStyle(character)}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        <div className="character-detail-art">
          <button className="character-costume-open-button" type="button" aria-label={`查看${character.name}的服装`} onClick={onOpenCostumes}>
            <Shirt aria-hidden="true" />
          </button>
          <img src={portrait.src} style={portrait.style} alt={character.name} />
        </div>
        <div className="character-detail-copy">
          <div className="character-detail-heading">
            <div className="character-detail-title-line">
              <h3>{character.name}</h3>
              {cvLabel && (cvUrl ? (
                <a className="character-cv-label" href={cvUrl} target="_blank" rel="noreferrer">{cvLabel}</a>
              ) : (
                <span className="character-cv-label">{cvLabel}</span>
              ))}
            </div>
            <CharacterMusicPreview
              characterId={character.id}
              slots={musicSlots}
              audioSettings={audioSettings}
              onTrackChange={handleMusicChange}
            />
          </div>
          <div className="skill-title-row">
            <strong style={skillLabelStyle}>{character.skill.name}</strong>
            <span className="skill-overclock-badge">{formatSkillOverclock(character.skill)}</span>
          </div>
          <SkillDescription
            className="character-skill-description"
            description={character.skill.description}
          />
          {derivedSkills.map((skill) => (
            <div className="derived-skill-detail" key={skill.effectType}>
              <div className="skill-title-row">
                <strong style={skillLabelStyle}>{skill.name}</strong>
                <span className="skill-overclock-badge">{formatSkillOverclock(skill)}</span>
              </div>
              <SkillDescription
                className="character-skill-description"
                description={skill.description}
              />
            </div>
          ))}
          <p className="acquisition-method"><strong style={acquisitionLabelStyle}>获得途径</strong>{character.acquisitionMethod || "初始可用"}</p>
          <p
            className="character-description"
            role={onPlayDetailVoice ? "button" : undefined}
            tabIndex={onPlayDetailVoice ? 0 : undefined}
            onClick={onPlayDetailVoice}
            onKeyDown={(event) => {
              if (!onPlayDetailVoice || (event.key !== "Enter" && event.key !== " ")) return;
              event.preventDefault();
              onPlayDetailVoice();
            }}
          >
            {character.description || "暂无角色描述"}
          </p>
        </div>
      </section>
    </div>
  );
}
export function characterMusicSlots({ character, derivedSkills = [], musicTracks, user }) {
  if (!character?.id) return [];
  const slotDefinitions = [
    {
      id: "base",
      effectType: "",
      label: `普通技·${character.skill?.name ?? "角色技能"}`,
      fallbackTrackId: ""
    },
    ...derivedSkills.map((skill) => ({
      id: `derived:${skill.effectType}`,
      effectType: skill.effectType,
      label: `派生技·${skill.name}`,
      fallbackTrackId: skill.musicTrackId ?? ""
    }))
  ];

  return slotDefinitions
    .map((slot) => {
      const options = skillMusicOptionsForCharacter({
        characterId: character.id,
        effectType: slot.effectType,
        ownedMusicIds: user?.ownedMusicIds,
        tracks: musicTracks
      });
      const track = resolveSkillMusicTrack({
        characterId: character.id,
        effectType: slot.effectType,
        fallbackTrackId: slot.fallbackTrackId,
        selections: user?.musicSelections,
        ownedMusicIds: user?.ownedMusicIds,
        tracks: musicTracks
      });
      return { ...slot, options, track };
    })
    .filter((slot) => slot.track || slot.options.length > 0);
}

export function HouseReplayDialog({ characterListView, currentUser, onClose, onOpenReplay, pagination, titleStickers = false }) {
  const dialog = (
    <div className="nested-modal-backdrop standalone-replay-backdrop" onClick={onClose}>
      <ModalDialog
        className={`nested-modal replay-dialog${titleStickers ? " window-sticker-host" : ""}`}
        ariaLabelledBy="resume-replay-title"
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" aria-label="关闭对局回放" onClick={onClose}><X size={18} /></button>
        <WindowTitleSticker titleKey="replays" as="h3" id="resume-replay-title" enabled={titleStickers} />
        <div className="replay-dialog-list-scroll" onScroll={pagination.onScroll}>
          <PaginatedReplayList
            pagination={pagination}
            characters={characterListView}
            currentUser={currentUser}
            onOpenReplay={onOpenReplay}
          />
        </div>
      </ModalDialog>
    </div>
  );

  if (typeof document === "undefined") return dialog;
  return createPortal(dialog, document.querySelector(".app-shell") ?? document.body);
}
