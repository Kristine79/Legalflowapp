import { Link } from 'wouter';
import { CheckCircle, Sparkles, Shield, Zap, FileText, Users, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { PublicHeader } from '@/components/layout/PublicHeader';

export function About() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicHeader active="about" />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t.about.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {t.about.subtitle}
              </p>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">{t.about.whatIs.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.whatIs.description}
              </p>

              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground pt-4">{t.about.mvp.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.mvp.description}
              </p>

              <div className="grid gap-4 md:grid-cols-2 pt-2">
                {t.about.mvp.features.map((feature, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">{t.about.vision.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.vision.description}
              </p>

              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground pt-4">{t.about.tech.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.tech.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {t.about.tech.stack.map((item, index) => (
                  <div key={index} className="rounded-lg border bg-card p-4 text-center shadow-sm">
                    <p className="font-medium text-card-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">{t.about.roadmap.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.roadmap.description}
              </p>

              <div className="space-y-3">
                {t.about.roadmap.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto rounded-2xl border bg-card p-8 shadow-sm text-center space-y-6">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">{t.about.cta.title}</h2>
              <p className="text-muted-foreground">{t.about.cta.description}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up" className="gap-2">
                    {t.about.cta.primary} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/faq"><HelpCircle className="mr-2 h-4 w-4" /> {t.shell.faq}</Link>
                </Button>
              </div>
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
