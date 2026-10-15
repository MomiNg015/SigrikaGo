import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { validateAuthSubmit, validateAuthField, authSubmitText, authPendingText, AUTH_REGISTER_LABEL_NOTES } from '../../../src/auth/AuthScreen.jsx';
import './style.css';

function Sample() {
  const requested = new URLSearchParams(location.search).get('view');
  const view = ['sheet', 'welcome', 'register'].includes(requested) ? requested : 'sheet';
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ username: '', password: '', confirmPassword: '' });
  const [shown, setShown] = useState({});
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const timer = useRef();
  const formRef = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function switchMode(next) {
    if (pending || next === mode) return;
    setMode(next); setValues(v => ({ username: v.username, password: '', confirmPassword: '' }));
    setShown({}); setErrors({}); setFeedback('');
  }
  function update(field, value) {
    const next = { ...values, [field]: value };
    setValues(next); setFeedback('');
    setErrors(old => Object.fromEntries(Object.entries(old).map(([key, error]) => [key, error ? validateAuthField(key, next[key], { mode, password: next.password }) : ''])));
  }
  function submit(event) {
    event.preventDefault();
    if (pending) return;
    const result = validateAuthSubmit({ mode, ...values });
    setFeedback('');
    if (!result.ok) {
      setErrors(result.fieldErrors);
      formRef.current.elements.namedItem(Object.keys(result.fieldErrors).find(key => result.fieldErrors[key]))?.focus();
      return;
    }
    setPending(true);
    timer.current = setTimeout(() => { setPending(false); setFeedback('演示完成，未提交账号信息。'); }, 900);
  }
  const fields = mode === 'register' ? ['username', 'password', 'confirmPassword'] : ['username', 'password'];
  const labels = { username: '用户名', password: '密码', confirmPassword: '确认密码' };
  return <main className={`scene ${view}`}>
    <section className={`composition mode-${mode}`} aria-label="星炬学院围棋部账号入口">
      <header className="identity">
        <img className="mascot" src="/assets/login-sigrika-mascot.webp" alt="" />
        <div className="brand"><p className="wordmark">SigrikaGo</p><h1>星炬学院围棋部</h1></div>
      </header>
      <div className="form-area">
        <div className="modes" role="group" aria-label="账号操作">
          {['login', 'register'].map(value => <button key={value} type="button" aria-pressed={mode === value} disabled={pending} onClick={() => switchMode(value)}>{value === 'login' ? '登录' : '注册'}</button>)}
        </div>
        <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
          {fields.map(field => <div className="field" key={field}>
            <label htmlFor={field}>{labels[field]}</label>
            <div className="input-shell"><input id={field} name={field} value={values[field]} onChange={event => update(field, event.target.value)} onBlur={() => setErrors(old => ({ ...old, [field]: validateAuthField(field, values[field], { mode, password: values.password }) }))} type={field === 'username' || shown[field] ? 'text' : 'password'} autoComplete={field === 'username' ? 'username' : mode === 'login' ? 'current-password' : 'new-password'} autoCapitalize="none" spellCheck={false} required disabled={pending} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : mode === 'register' && AUTH_REGISTER_LABEL_NOTES[field] ? `${field}-hint` : undefined} />
              {field !== 'username' && <button className="visibility" type="button" aria-label={shown[field] ? `隐藏${labels[field]}` : `显示${labels[field]}`} aria-pressed={Boolean(shown[field])} aria-controls={field} disabled={pending} onClick={() => setShown(old => ({ ...old, [field]: !old[field] }))}>{shown[field] ? <EyeOff size={19} /> : <Eye size={19} />}</button>}
            </div>
            {errors[field] ? <small className="error" id={`${field}-error`} role="alert">{errors[field]}</small> : mode === 'register' && AUTH_REGISTER_LABEL_NOTES[field] ? <small className="hint" id={`${field}-hint`}>{AUTH_REGISTER_LABEL_NOTES[field]}</small> : null}
          </div>)}
          <button type="submit" className="submit" disabled={pending}>{pending ? authPendingText(mode) : authSubmitText(mode)}<ArrowRight size={20} aria-hidden="true" /></button>
          <p className="feedback" role="status">{feedback}</p>
        </form>
        <p className="version">v0.1.0</p>
      </div>
    </section>
  </main>;
}
const root = createRoot(document.getElementById('root'));
root.render(<Sample />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
