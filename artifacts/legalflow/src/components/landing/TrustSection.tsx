import { Shield, Lock, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';

const ICONS = [Lock, Shield, Users, Star];
const COLORS = ['text-primary', 'text-chart-2', 'text-chart-3', 'text-chart-4'];

export function TrustSection() {
  const items = t.landing?.trust?.badges ?? [];
  return (
    <section className="border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.landing?.trust?.title ?? 'Почему юристы доверяют LegalFlow'}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = ICONS[index] ?? Shield;
            const color = COLORS[index] ?? 'text-primary';
            return (
              <Card key={index} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-start gap-2">
                    <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
                    <span>{item.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
