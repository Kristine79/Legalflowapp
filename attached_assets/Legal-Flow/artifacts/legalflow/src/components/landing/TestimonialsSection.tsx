import { Quote } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n';

export function TestimonialsSection() {
  const items = t.landing?.testimonials?.items ?? [];
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.landing?.testimonials?.title ?? 'Что говорят пользователи'}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-6">
                <Quote className="h-5 w-5 text-primary/40 mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.quote}</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {item.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
