from pathlib import Path
p=Path('src/styles/mobile-adaptive/battle-paper-panels.css');s=p.read_text(encoding='utf-8').replace('.room-screen:not(.sigrika-candy-duel-room)', '.room-screen:not(.sigrika-candy-duel-room):not(.mobile-room-screen)');p.write_text(s,encoding='utf-8')
p=Path('src/styles/mobile-adaptive/battle-paper-panels-mobile.css');s=p.read_text(encoding='utf-8');s=s[:s.index('    & .player-info[data-paper-player]')]+'''    /* Original two-row information layout; the paper edge tucks behind the art. */
    & .player-info[data-paper-player] {
      position: relative;
      isolation: isolate;
      height: 94px !important;
      min-height: 94px !important;
      max-height: none !important;
      grid-template-columns: 66px minmax(0, 1fr) minmax(104px, 0.7fr) !important;
      grid-template-rows: 30px 26px !important;
      grid-template-areas: "portrait meta time" "portrait captures skill" !important;
      padding: 18px 12px 16px 0 !important;
      gap: 4px 6px !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      translate: none !important;
      overflow: visible !important;

      &::before {
        content: "";
        position: absolute;
        inset: 12px 6px 10px 48px;
        z-index: -1;
        background: var(--bright-sheet);
        border: 2px solid var(--bright-border);
        border-radius: 16px;
        translate: 3px 3px;
        pointer-events: none;
      }
      &.active-turn::before {
        background: #fff0a6;
        box-shadow: 3px 3px 0 var(--bright-border);
        translate: 0 0;
      }
      & .player-clock-panel { display: contents; }
      & .portrait-wrap {
        grid-area: portrait !important;
        z-index: 2;
      }
      & .portrait-wrap:not(.no-character):not(:has(.team-portrait-strip)) {
        height: 70px !important;
        align-self: center;
        margin-bottom: 4px;
        & > img { height: 90px !important; }
      }
      & .battle-character-label { font-size: 9px; padding: 2px 4px; bottom: -2px; left: 5px; }
      & .player-meta { grid-area: meta !important; min-width: 0; }
      & .player-skill-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      & .player-skill-count { flex: none; white-space: pre; }
    }
  }
}
''';p.write_text(s,encoding='utf-8')
