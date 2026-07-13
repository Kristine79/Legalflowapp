import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, Sun, Moon, LogOut, Languages, MoreHorizontal,
  Bell, FileText, Settings, Info, CheckSquare, CalendarDays,
  Sparkles, User, ChevronDown, Check,
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import { useClerk } from '@clerk/react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useT, useLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useListNotifications, useMarkNotificationRead } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatRelative } from '@/lib/date';

/* ─── types ─────────────────────────────────────────────── */
interface ShellProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

/* ─── Primary nav (4 icons always visible) ───────────────── */
const PRIMARY_NAV = [
  { path: '/tasks',    Icon: CheckSquare,  tKey: 'tasks'    },
  { path: '/calendar', Icon: CalendarDays, tKey: 'calendar' },
  { path: '/ai-tools', Icon: Sparkles,     tKey: 'ai'       },
  { path: '/profile',  Icon: User,         tKey: 'profile'  },
] as const;

/* ─── Media query hook ───────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

/* ─── Inline notification list (reuses existing API hooks) ── */
function NotificationList() {
  const qc = useQueryClient();
  const t = useT();
  const { data: items = [] } = useListNotifications({ query: { queryKey: ['notifications'] } });
  const markRead = useMarkNotificationRead({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) },
  });

  const markAllRead = () =>
    items.filter((i) => !i.read).forEach((i) => markRead.mutate({ notificationId: i.id }));

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="mt-1 border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">{t.notifications.title}</span>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> {t.notifications.markRead}
          </button>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">{t.notifications.empty}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/40 transition-colors ${
                !item.read ? 'bg-primary/[0.03]' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-snug ${!item.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(item.createdAt)}</p>
              </div>
              {!item.read && <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── More menu content (shared between Dropdown and Sheet) ── */
function MoreMenuContent({
  onClose,
  t,
  theme,
  onToggleTheme,
  language,
  onLangChange,
  onSignOut,
  unreadCount,
}: {
  onClose: () => void;
  t: ReturnType<typeof useT>;
  theme: string | undefined;
  onToggleTheme: () => void;
  language: Language;
  onLangChange: (l: Language) => void;
  onSignOut: () => void;
  unreadCount: number;
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  const secondaryNav = [
    { path: '/documents', Icon: FileText,  label: t.documents.title },
    { path: '/settings',  Icon: Settings,  label: t.shell.settings  },
    { path: '/about',     Icon: Info,      label: t.shell.about     },
  ];

  return (
    <div className="flex flex-col gap-0.5">
      {/* Secondary nav links */}
      {secondaryNav.map(({ path, Icon, label }) => (
        <Link key={path} href={path} onClick={onClose}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-accent cursor-pointer transition-colors">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{label}</span>
          </div>
        </Link>
      ))}

      {/* Notifications (inline expand) */}
      <button
        type="button"
        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-accent cursor-pointer transition-colors w-full text-left"
        onClick={() => setNotifOpen((v) => !v)}
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1">{t.notifications.title}</span>
        {unreadCount > 0 && (
          <span className="h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-semibold">
            {unreadCount}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${notifOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {notifOpen && (
        <div className="px-2 pb-1">
          <NotificationList />
        </div>
      )}

      <div className="h-px bg-border my-1" />

      {/* Theme toggle */}
      <button
        type="button"
        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-accent cursor-pointer transition-colors w-full text-left"
        onClick={() => { onToggleTheme(); onClose(); }}
      >
        {theme === 'dark'
          ? <Sun className="h-4 w-4 text-muted-foreground" />
          : <Moon className="h-4 w-4 text-muted-foreground" />}
        <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
      </button>

      {/* Language switcher */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t.shell.language}</span>
        </div>
        <div className="flex gap-1.5 pl-6">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLangChange(lang)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                language === lang
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border my-1" />

      {/* Logout */}
      <button
        type="button"
        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-destructive/10 text-destructive cursor-pointer transition-colors w-full text-left"
        onClick={onSignOut}
      >
        <LogOut className="h-4 w-4" />
        <span>{t.shell.logout}</span>
      </button>
    </div>
  );
}

/* ─── Shell ──────────────────────────────────────────────── */
export function Shell({ children, searchQuery, onSearchChange }: ShellProps) {
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL;
  const [location] = useLocation();
  useAuthUser();
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);
  const qc = useQueryClient();
  const { data: notifs = [] } = useListNotifications({ query: { queryKey: ['notifications'] } });
  const unreadCount = notifs.filter((n) => !n.read).length;

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleSignOut = useCallback(() => {
    setMoreOpen(false);
    void signOut({ redirectUrl: basePath || '/' });
  }, [signOut, basePath]);

  // Close more menu when screen size crosses the 768 breakpoint
  useEffect(() => { setMoreOpen(false); }, [isMobile]);

  // Nav title lookup (AI key is not in t.shell, use hardcoded)
  const navTitle = (key: string) => {
    if (key === 'tasks')    return t.shell.tasks;
    if (key === 'calendar') return t.shell.calendar;
    if (key === 'profile')  return t.shell.profile;
    return 'AI';
  };

  const moreProps = {
    t,
    theme,
    onToggleTheme: toggleTheme,
    language,
    onLangChange: setLanguage,
    onSignOut: handleSignOut,
    unreadCount,
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4 text-primary hover:opacity-90 transition-opacity">
            <img src={logoIcon} alt={t.app.brandName} className="h-8 w-8 rounded-lg" />
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">
              {t.app.brandName}
            </span>
          </Link>

          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            {/* Search */}
            <div className="w-full max-w-xs md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t.shell.searchPlaceholder}
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full bg-muted/50 border-none pl-9 focus-visible:ring-primary/20"
                  data-testid="input-search"
                />
              </div>
            </div>

            <nav className="flex items-center gap-0.5">
              {/* ── 4 primary icons ── */}
              {PRIMARY_NAV.map(({ path, Icon, tKey }) => {
                const isActive = location === path || location.startsWith(path + '/');
                return (
                  <Link
                    key={path}
                    href={path}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    title={navTitle(tKey)}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}

              {/* ── More button ── */}
              {isMobile ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground relative"
                    onClick={() => setMoreOpen(true)}
                    aria-label="Ещё"
                    data-testid="button-more"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>

                  {/* Mobile: bottom sheet */}
                  <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                    <SheetContent
                      side="bottom"
                      className="rounded-t-2xl pb-safe max-h-[85dvh] overflow-y-auto"
                    >
                      <SheetHeader className="mb-3">
                        <SheetTitle className="text-base font-semibold">
                          {t.app.brandName}
                        </SheetTitle>
                      </SheetHeader>
                      <MoreMenuContent onClose={() => setMoreOpen(false)} {...moreProps} />
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                /* Desktop: dropdown */
                <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground relative"
                      aria-label="Ещё"
                      data-testid="button-more"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <MoreMenuContent onClose={() => setMoreOpen(false)} {...moreProps} />
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Avatar */}
              <div className="pl-2 border-l ml-2 hidden sm:block">
                <Avatar className="h-8 w-8 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
                    {profile.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
