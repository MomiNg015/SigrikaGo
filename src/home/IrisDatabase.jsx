import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ModalDialog } from "../modals/modalComponents.jsx";

export const IRIS_FRIENDLY_LINKS = [
  {
    href: "https://www.weiqi.org.cn/",
    title: "中国围棋协会",
    description: "赛事资讯 · 行业动态",
    host: "weiqi.org.cn"
  },
  {
    href: "https://online-go.com/",
    title: "Online Go Server",
    description: "线上对弈 · 棋局复盘",
    host: "online-go.com"
  },
  {
    href: "https://senseis.xmp.net/",
    title: "Sensei’s Library",
    description: "围棋术语与知识 Wiki",
    host: "senseis.xmp.net"
  }
];

export default function IrisDatabase() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="打开 IRIS 数据库"
        className="iris-database-entry"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span className="iris-entry-portrait-slot" aria-hidden="true" />
        <span className="iris-entry-copy">
          <strong>IRIS 数据库</strong>
          <small>ARCHIVE ONLINE</small>
        </span>
        <span className="iris-entry-status" aria-hidden="true" />
      </button>

      {open && (
        <div className="modal-backdrop iris-database-backdrop" onClick={() => setOpen(false)}>
          <ModalDialog
            ariaLabelledBy={titleId}
            className="iris-database-modal"
            onClick={(event) => event.stopPropagation()}
            onClose={() => setOpen(false)}
          >
            <button
              aria-label="关闭 IRIS 数据库"
              className="close-button iris-database-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <aside className="iris-database-portrait-panel">
              <div
                aria-label="IRIS 人物立绘预留区域，当前为空"
                className="iris-database-portrait-slot"
                role="img"
              />
              <div className="iris-database-identity">
                <strong>I.R.I.S.</strong>
                <span>Intelligent Retrieval &amp; Indexing System</span>
              </div>
            </aside>

            <div className="iris-database-content">
              <header className="iris-database-header">
                <span className="iris-database-path">Spacetrek archive / link index</span>
                <h2 className="text-window-title" id={titleId}>围棋资料索引</h2>
                <p>
                  常用围棋资料已经重新编入目录。规则、赛事、线上对弈和术语库，
                  可以从这里直接前往。
                </p>
              </header>

              <p className="iris-database-quote">
                “检索完成。顺便说一句，你昨天漏看的那盘棋我也找到了。”
              </p>

              <ul className="iris-database-links">
                {IRIS_FRIENDLY_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} rel="noreferrer" target="_blank">
                      <span className="iris-link-stone" aria-hidden="true" />
                      <span className="iris-link-copy">
                        <strong>{link.title}</strong>
                        <span>{link.description}</span>
                        <small>{link.host}</small>
                      </span>
                      <ExternalLink aria-hidden="true" size={20} strokeWidth={2.2} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </ModalDialog>
        </div>
      )}
    </>
  );
}
