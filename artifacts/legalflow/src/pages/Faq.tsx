import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { PublicHeader } from '@/components/layout/PublicHeader';

export function Faq() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicHeader active="faq" />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t.faq.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {t.faq.subtitle}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {t.faq.items.map((item, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item.question}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
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
            <a href="/about" className="hover:text-foreground transition-colors">{t.shell.about}</a>
            <a href="/pricing" className="hover:text-foreground transition-colors">{t.landing?.pricing?.title ?? 'Тарифы'}</a>
            <a href="/faq" className="hover:text-foreground transition-colors">{t.shell.faq}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
