export default function AuthChallenge({ challenge, disabled }) {
  if (!challenge.enabled) return null;
  return (
    <div className="auth-field auth-challenge">
      <label className="auth-label-row" htmlFor="auth-challenge-answer">
        <span>图片验证</span>
        <small id="auth-challenge-error" role={challenge.error ? "alert" : undefined}>{challenge.error || "不区分大小写"}</small>
      </label>
      <div className="auth-challenge-controls">
        <input id="auth-challenge-answer" name="challenge" ref={challenge.inputRef}
          value={challenge.answer} onChange={(event) => challenge.setAnswer(event.target.value)}
          maxLength={6} autoComplete="off" autoCapitalize="characters" spellCheck="false"
          aria-describedby="auth-challenge-error" aria-invalid={Boolean(challenge.error) || undefined}
          disabled={disabled} />
        <button type="button" className="auth-challenge-refresh" aria-label="换一张验证码"
          disabled={disabled || challenge.loading} onClick={challenge.refresh}>
          {challenge.image ? <img src={challenge.image} width="210" height="64" alt="验证码，点击换一张" /> : <span>{challenge.loading ? "加载中…" : "点击重试"}</span>}
        </button>
      </div>
    </div>
  );
}
