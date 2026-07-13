import { Link } from 'wouter';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import productDemo from '@/assets/product-demo.gif';

export function DemoVideoSection() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <section className="py-16 md:py-24 border-y bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            LegalFlow в действии
          </h2>
          <p className="text-muted-foreground mt-3">
            Дашборд, AI-анализ обращений, воронка клиентов и задачи — всё в одном рабочем пространстве.
          </p>
        </div>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-lg">
          <img
            src={productDemo}
            alt="Демо LegalFlow"
            className="w-full h-auto object-cover"
          />
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href={`${basePath}/demo`} className="gap-2">
              <Play className="h-4 w-4" /> Интерактивное демо
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${basePath}/sign-up`}>Начать бесплатно</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
