import type { ReactNode } from 'react';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  title: string;
  /** Page-specific controls rendered in the top bar (e.g. search). */
  topbarContent?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, topbarContent, children }: AppLayoutProps) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar title={title}>{topbarContent}</Topbar>
        <main className={styles.content}>{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
