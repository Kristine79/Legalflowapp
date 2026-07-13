import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import logoIcon from '@/assets/logo-icon.png';

interface PublicHeaderProps {
  /** Highlights the current page link in the nav. */
  active?: 'about' | 'pricing' | 'faq';
}

export function PublicHeader({ active }: PublicHeaderProps) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  const linkClass = (page: 'about' | 'pricing' | 'faq') =>
    `text-sm font-medium transition-colors ${active === page ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
          <img src={logoIcon} alt={t.app.brandName} className="h-8 w-8 rounded-lg shrink-0" />
          <span className="font-serif font-bold text-lg tracking-tight leading-tight hidden sm:inline">{t.app.brandName}</span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <Link href={`${basePath}/about`} className={linkClass('about')}>
            {t.shell.about}
          </Link>
          <Link href={`${basePath}/pricing`} className={linkClass('pricing')}>
            {t.landing?.pricing?.title ?? 'Тарифы'}
          </Link>
          <Link href={`${basePath}/faq`} className={linkClass('faq')}>
            {t.shell.faq}
          </Link>
          <Link
            href={`${basePath}/sign-in`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Войти
          </Link>
          <Button asChild data-testid="button-landing-signup">
            <Link href={`${basePath}/sign-up`}>Начать бесплатно</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
