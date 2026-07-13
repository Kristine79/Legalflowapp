import { Link } from 'wouter';
import { Search, Sun, Moon, User, LogOut, Languages } from 'lucide-react';
import { NAV_ITEMS } from '@/config/navigation.config';
import logoIcon from '@/assets/logo-icon.png';
import { useClerk } from '@clerk/react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { useProfile } from '@/hooks/use-profile';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useT, useLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShellProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function Shell({ children, searchQuery, onSearchChange }: ShellProps) {
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL;

  // Ensure the signed-in Clerk user has a corresponding row in the app's
  // users table before any page under the Shell makes authenticated API
  // calls (documents, clients, cases, ...) — otherwise every request 401s
  // until the user happens to visit Settings/Profile first.
  useAuthUser();
  const t = useT();
  const { language, setLanguage } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6 gap-4">
          <Link href="/" className="flex items-center gap-2 mr-4 text-primary hover:opacity-90 transition-opacity">
            <img src={logoIcon} alt={t.app.brandName} className="h-8 w-8 rounded-lg" />
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">{t.app.brandName}</span>
          </Link>
          
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
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
            
            <nav className="flex items-center">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title={item.title}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
              <NotificationPopover />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: basePath || '/' })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                title={t.shell.logout}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-9 h-9 p-0 border-0 bg-transparent text-muted-foreground hover:text-foreground focus:ring-0" aria-label={t.shell.language}>
                  <Languages className="h-5 w-5" />
                </SelectTrigger>
                <SelectContent align="end">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
