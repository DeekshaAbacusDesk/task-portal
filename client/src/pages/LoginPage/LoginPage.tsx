import { useState, type FormEvent } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { Button } from '../../components/ui/Button/Button';
import { TextField } from '../../components/ui/TextField/TextField';
import { useLogin } from '../../hooks/useLogin';
import styles from './LoginPage.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

const PREVIEW_ROWS = [
  { label: 'Pending', tone: styles.dotPending, width: '62%' },
  { label: 'In Progress', tone: styles.dotProgress, width: '78%' },
  { label: 'Completed', tone: styles.dotDone, width: '54%' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    login.mutate({ email: email.trim(), password });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <aside className={styles.brandPanel}>
          <Logo tone="light" />

          <div className={styles.brandCopy}>
            <h2 className={styles.brandTitle}>Stay on top of every task</h2>
            <p className={styles.brandText}>
              Create, track and update your team's work. Status changes sync live across every screen.
            </p>
          </div>

          <div className={styles.preview} aria-hidden>
            {PREVIEW_ROWS.map((row) => (
              <div key={row.label} className={styles.previewRow}>
                <span className={styles.previewAvatar} />
                <span className={styles.previewLine} style={{ width: row.width }} />
                <span className={styles.previewStatus}>
                  <span className={`${styles.dot} ${row.tone}`} />
                  {row.label}
                </span>
              </div>
            ))}
          </div>

          <span className={`${styles.blob} ${styles.blobLarge}`} aria-hidden />
          <span className={`${styles.blob} ${styles.blobSmall}`} aria-hidden />
        </aside>

        <main className={styles.formPanel}>
          <div className={styles.mobileLogo}>
            <Logo />
          </div>

          <header className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to manage your tasks.</p>
          </header>

          {login.isError && (
            <div className={styles.alert} role="alert">
              <AlertCircle size={18} aria-hidden />
              <span>{login.error.message}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              leadingIcon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              autoFocus
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              leadingIcon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              trailing={
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Button type="submit" fullWidth loading={login.isPending} className={styles.submit}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}
