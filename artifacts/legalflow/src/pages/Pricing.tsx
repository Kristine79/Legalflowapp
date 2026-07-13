import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { PublicHeader } from '@/components/layout/PublicHeader';

export function Pricing() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const plans = t.landing?.pricing?.plans ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicHeader active="pricing" />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t.landing?.pricing?.title ?? 'Тарифы'}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {t.landing?.pricing?.subtitle ?? 'Начните бесплатно и переходите на старший тариф по мере роста практики'}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`shadow-sm flex flex-col ${plan.highlighted ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="pt-2">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-chart-3 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-auto" variant={plan.highlighted ? 'default' : 'outline'} asChild>
                      <Link href={`${basePath}/sign-up`}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="max-w-2xl mx-auto mt-12 rounded-2xl border bg-card p-8 shadow-sm text-center space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Нужен индивидуальный тариф?</h2>
              <p className="text-muted-foreground text-sm">
                Для юридических фирм, государственных заказчиков и интеграций под ключ — напишите нам, и мы подготовим персональное предложение.
              </p>
              <Button variant="outline" asChild>
                <Link href={`${basePath}/sign-up`} className="gap-2">
                  Начать бесплатно <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
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
