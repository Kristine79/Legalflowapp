import { Link } from 'wouter';
import { ArrowRight, Sparkles, UserPlus, Briefcase, Users, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoIcon from '@/assets/logo-icon.png';
import { t } from '@/lib/i18n';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { TrustSection } from '@/components/landing/TrustSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { LandingFaqSection } from '@/components/landing/LandingFaqSection';
import { DemoVideoSection } from '@/components/landing/DemoVideoSection';

export function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-4 py-1.5 text-sm font-medium text-accent-foreground">
                <Sparkles className="h-4 w-4" />
                <span>AI-помощник для юристов</span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t.landing?.hero?.title ?? 'Ваш AI-помощник для ведения юридической практики'}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t.landing?.hero?.subtitle ?? 'Принимайте клиентов, ведите дела, контролируйте документы и сроки в одном рабочем пространстве.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" asChild data-testid="button-hero-signup">
                  <Link href="/sign-up" className="gap-2">
                    {t.landing?.hero?.primaryCta ?? 'Создать первое дело'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-hero-demo">
                  <Link href="/demo" className="gap-2">
                    {t.landing?.hero?.secondaryCta ?? 'Посмотреть демо'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t.landing?.howItWorks?.title ?? 'Как работает LegalFlow'}
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {t.landing?.howItWorks?.steps?.map((step, index) => {
                const stepIcons = [UserPlus, Sparkles, Briefcase];
                const StepIcon = stepIcons[index] ?? Sparkles;
                return (
                  <div key={index} className="relative rounded-xl border bg-card p-6 shadow-sm">
                    <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground">{step.title}</h3>
                    {step.description && <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>}
                    {step.bullets && step.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {step.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t.landing?.benefits?.title ?? 'Всё необходимое юристу'}
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {t.landing?.benefits?.cards?.map((card, index) => {
                const benefitIcons = [Sparkles, Users, FileText, Clock];
                const BenefitIcon = benefitIcons[index] ?? Sparkles;
                return (
                  <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BenefitIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground">{card.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <DemoVideoSection />

        <TrustSection />

        <TestimonialsSection />

        <PricingSection />

        <LandingFaqSection />

        <section className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto rounded-2xl border bg-card p-8 md:p-10 shadow-sm text-center space-y-6">
              <div className="flex justify-center">
                <img src={logoIcon} alt={t.app.brandName} className="h-12 w-12 rounded-xl" />
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Готовы автоматизировать юридическую практику?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Регистрация бесплатная. Попробуйте AI-помощник, воронку дел и дашборд без ограничений по времени.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up" className="gap-2">
                    Начать бесплатно <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">Смотреть демо</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt={t.app.brandName} className="h-6 w-6 rounded-md shrink-0" />
            <span className="font-semibold text-foreground">{t.app.brandName}</span>
          </div>
          <p>© 2026 {t.app.brandName}. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">{t.shell.about}</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">{t.landing?.pricing?.title ?? 'Тарифы'}</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">{t.shell.faq}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
