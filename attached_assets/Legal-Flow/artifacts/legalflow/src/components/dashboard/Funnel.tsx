import {
  Users,
  PhoneCall,
  FileText,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { t } from '@/lib/i18n';

interface FunnelStep {
  label: string;
  value: number;
  icon: LucideIcon;
  width: number;
}

const STEPS: FunnelStep[] = [
  { label: t.analytics.funnel.newInquiry, value: 100, icon: Users, width: 100 },
  { label: t.analytics.funnel.consultation, value: 75, icon: PhoneCall, width: 88 },
  { label: t.analytics.funnel.documents, value: 50, icon: FileText, width: 76 },
  { label: t.analytics.funnel.active, value: 30, icon: Briefcase, width: 64 },
  { label: t.analytics.funnel.closed, value: 30, icon: CheckCircle2, width: 64 },
];

export function Funnel() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      <div className="relative flex flex-col items-center">
        {STEPS.map((step, index) => {
          const nextStep = STEPS[index + 1];
          const conversion = nextStep
            ? Math.round((nextStep.value / step.value) * 100)
            : null;

          return (
            <div key={step.label} className="w-full flex flex-col items-center">
              <div
                className="group relative flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                style={{ width: `${step.width}%`, minWidth: 160 }}
                title={step.label}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/10">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium truncate">
                    {step.label}
                  </span>
                </div>
                <span className="shrink-0 text-sm sm:text-base font-bold tabular-nums tracking-tight">
                  {step.value}
                </span>
              </div>

              {conversion !== null && (
                <div className="relative flex h-8 w-full items-center justify-center">
                  <div className="absolute inset-0 mx-auto w-px bg-gradient-to-b from-primary/30 to-transparent" />
                  <div className="z-10 flex items-center gap-1 rounded-full bg-card border px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                    <ChevronDown className="h-3 w-3 text-primary" />
                    {conversion}%
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
