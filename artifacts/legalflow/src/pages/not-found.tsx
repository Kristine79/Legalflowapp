import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">
              {t.notFound.title}
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            {t.notFound.description}
          </p>

          <div className="mt-6">
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.notFound.back}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
