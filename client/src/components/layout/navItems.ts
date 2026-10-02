import { BarChart3, ListChecks, type LucideIcon } from 'lucide-react';
import { PATHS } from '../../routes/paths';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Single source for the sidebar (desktop/tablet) and the bottom tab bar (phones). */
export const NAV_ITEMS: NavItem[] = [
  { to: PATHS.analytics, label: 'Analytics', icon: BarChart3 },
  { to: PATHS.tasks, label: 'Tasks', icon: ListChecks },
];
