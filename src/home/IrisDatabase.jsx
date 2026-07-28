import { useId, useState } from "react";
import { playUiIrisDatabaseOpenSound } from "../audio/playback.jsx";
import { ModalDialog } from "../modals/modalComponents.jsx";
import { pickIrisGreeting } from "../shared/irisGreeting.js";
import { normalizeIrisLinks } from "../shared/irisLinks.js";

export default function IrisDatabase({ audioSettings, greeting, links }) {
  const [open, setOpen] = useState(false);
  const [activeGreeting, setActiveGreeting] = useState("");
  const titleId = useId();
  const friendlyLinks = normalizeIrisLinks(links);

  function openDatabase() {
    playUiIrisDatabaseOpenSound(audioSettings);
    setActiveGreeting(pickIrisGreeting(greeting));
    setOpen(true);
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="打开 IRIS 数据库"
        className="iris-database-entry"
        data-ui-sound="none"
        type="button"
        onClick={openDatabase}
      >
        <span className="iris-entry-shard" aria-hidden="true" />
        <span className="iris-entry-portrait-slot" aria-hidden="true" />
        <span className="iris-entry-nodes" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="iris-entry-data">
          <span>
            <strong>IRIS 数据库</strong>
            <small>ARCHIVE // ONLINE</small>
          </span>
          <span className="iris-entry-code">IDX-07</span>
        </span>
      </button>

      {open && (
        <div className="modal-backdrop iris-database-backdrop" onClick={() => setOpen(false)}>
          <ModalDialog
            ariaLabelledBy={titleId}
            className="iris-database-modal"
            onClick={(event) => event.stopPropagation()}
            onClose={() => setOpen(false)}
          >
            <span className="iris-database-shell-code is-top" aria-hidden="true">
              IRIS.NODE / ARCHIVE_LINK_INDEX / 07
            </span>
            <span className="iris-database-shell-code is-bottom" aria-hidden="true">
              CONNECTION STABLE // LATENCY 018MS
            </span>
            <span className="iris-database-edge-stream is-top" aria-hidden="true" />
            <span className="iris-database-edge-stream is-right" aria-hidden="true" />

            <button
              aria-label="关闭 IRIS 数据库"
              className="iris-database-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <aside className="iris-database-portrait-panel">
              <span className="iris-database-portrait-label" aria-hidden="true">
                SUBJECT VISUAL // RESERVED
              </span>
              <div className="iris-database-greeting">
                <span className="iris-database-greeting-channel">
                  IRIS // DIRECT LINK
                </span>
                <span className="iris-database-greeting-copy">{activeGreeting}</span>
              </div>
              <div
                aria-label="IRIS 人物立绘预留区域，当前为空"
                className="iris-database-portrait-slot"
                role="img"
              />
              <span className="iris-database-portrait-anchor" aria-hidden="true" />
              <div className="iris-database-identity">
                <div>
                  <strong>I.R.I.S.</strong>
                  <span>Intelligent Retrieval<br />&amp; Indexing System</span>
                </div>
                <small>SYS:READY<br />NODE:07<br />SYNC:100</small>
              </div>
            </aside>

            <div className="iris-database-content">
              <header className="iris-database-header">
                <span className="iris-database-path">archive / go / external-index</span>
                <h2 id={titleId}>围棋资料索引 <span aria-hidden="true">LINK.DB</span></h2>
                <div className="iris-database-status" aria-hidden="true">
                  <span>RECORDS</span><b>{String(friendlyLinks.length).padStart(3, "0")}</b>
                  <span>STATUS</span><b>ONLINE</b>
                </div>
              </header>

              <ul aria-label="围棋资料链接" className="iris-database-links">
                {friendlyLinks.map((link, index) => (
                  <li key={link.href}>
                    <a href={link.href} rel="noreferrer" target="_blank">
                      <span className="iris-link-index" aria-hidden="true">
                        <b>{String(index + 1).padStart(2, "0")}</b>
                        DB.NODE
                      </span>
                      <span className="iris-link-copy">
                        <strong>{link.title}</strong>
                        <span>{link.description}</span>
                        <small>{link.host}</small>
                      </span>
                      <span className="iris-link-arrow" aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
                {friendlyLinks.length === 0 && (
                  <li className="iris-database-links-empty">暂无资料条目</li>
                )}
              </ul>
            </div>
          </ModalDialog>
        </div>
      )}
    </>
  );
}
