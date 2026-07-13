import {
  CheckSquare,
  CalendarDays,
  Sparkles,
  Info,
  FileText,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  icon: LucideIcon;
  title: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/tasks', icon: CheckSquare, title: 'Задачи' },
  { path: '/calendar', icon: CalendarDays, title: 'Календарь' },
  { path: '/ai-tools', icon: Sparkles, title: 'AI-помощник юриста' },
  { path: '/documents', icon: FileText, title: 'Документы' },
  { path: '/settings', icon: Settings, title: 'Настройки' },
  { path: '/about', icon: Info, title: 'О проекте' },
  { path: '/profile', icon: User, title: 'Профиль' },
];

export const ICON_NAV_ITEMS = NAV_ITEMS;
