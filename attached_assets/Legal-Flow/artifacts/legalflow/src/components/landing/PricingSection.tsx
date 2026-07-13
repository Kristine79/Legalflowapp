import { Link } from 'wouter';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';

export function PricingSection() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const plans = t.landing?.pricing?.plans ?? [];
  return (
    <section id="pricing" className="border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.landing?.pricing?.title ?? 'Тарифы'}
          </h2>
          <p className="text-muted-foreground mt-3">
            {t.landing?.pricing?.subtitle ?? 'Начните бесплатно и переходите на старший тариф по мере роста практики'}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
      </div>
    </section>
  );
}
