import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { t } from '@/lib/i18n';

export function LandingFaqSection() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const items = t.faq?.items ?? [];
  const teaser = t.landing?.faqTeaser ?? { title: 'Частые вопросы', viewAll: 'Все вопросы' };
  const visibleItems = items.slice(0, 5);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {teaser.title}
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {visibleItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link href={`${basePath}/faq`} className="gap-2">
                {teaser.viewAll} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
