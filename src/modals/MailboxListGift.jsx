export default function MailboxListGift({ state }) {
  return (
    <svg className="mailbox-list-gift" data-state={state} viewBox="0 0 20 20" aria-hidden="true">
      <g stroke="var(--mailbox-gift-ink)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path fill="var(--mailbox-gift-ribbon)" d="M10 7.2C6.8 7.1 4.8 5.6 5.2 3.9c.5-1.8 3.2-1.4 4.8 3.3Zm0 0c3.2-.1 5.2-1.6 4.8-3.3-.5-1.8-3.2-1.4-4.8 3.3Z" />
        <rect className="mailbox-list-gift-box" x="3.8" y="9.4" width="12.4" height="8.5" rx="1.2" fill="var(--mailbox-gift-fill)" />
        <rect x="2.6" y="7.2" width="14.8" height="3.7" rx="1" fill="var(--mailbox-gift-ribbon)" />
        <path d="M10 7.3v10.5" fill="none" />
      </g>
    </svg>
  );
}
