import { Plus } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import styles from './GreetingBanner.module.css';

interface GreetingBannerProps {
  name: string;
  onCreate: () => void;
}

export function GreetingBanner({ name, onCreate }: GreetingBannerProps) {
  const firstName = name.split(' ')[0] || name;

  return (
    <section className={styles.banner}>
      <div className={styles.copy}>
        <h2 className={styles.title}>Hello {firstName}!</h2>
        <p className={styles.text}>
          Create, update and track your tasks here. Status changes from your team appear instantly.
        </p>
        <Button variant="accent" size="sm" onClick={onCreate} className={styles.cta}>
          <Plus size={16} aria-hidden />
          Create task
        </Button>
      </div>

      <svg className={styles.art} viewBox="0 0 220 160" aria-hidden>
        <rect x="58" y="22" width="110" height="128" rx="14" fill="#fff" />
        <rect x="92" y="14" width="42" height="16" rx="8" fill="#f5a524" />
        {[52, 82, 112].map((y, i) => (
          <g key={y}>
            <rect x="74" y={y} width="16" height="16" rx="5" fill={i < 2 ? '#2fb57a' : '#e9eafb'} />
            {i < 2 && <path d={`M78 ${y + 8} l3 3 l6 -6`} stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
            <rect x="98" y={y + 3} width={i === 1 ? 44 : 56} height="10" rx="5" fill="#e7e8f3" />
          </g>
        ))}
      </svg>
    </section>
  );
}
