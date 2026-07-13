import { Users, PhoneCall, FileText, Briefcase, CheckCircle2, type LucideIcon } from 'lucide-react';

interface FunnelStep {
  id: number;
  name: string;
  clients: number;
  conversion: number | null;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const steps: FunnelStep[] = [
  { id: 1, name: 'Новое обращение',       clients: 100, conversion: 75,   icon: Users,       iconBg: 'bg-slate-100',      iconColor: 'text-slate-600' },
  { id: 2, name: 'Первичная консультация', clients: 75,  conversion: 67,   icon: PhoneCall,   iconBg: 'bg-rose-100',       iconColor: 'text-rose-600' },
  { id: 3, name: 'Документы получены',     clients: 50,  conversion: 60,   icon: FileText,    iconBg: 'bg-blue-50',       iconColor: 'text-slate-600' },
  { id: 4, name: 'Дело в работе',          clients: 30,  conversion: 100,  icon: Briefcase,   iconBg: 'bg-amber-100',      iconColor: 'text-amber-700' },
  { id: 5, name: 'Закрыто',               clients: 30,  conversion: null,  icon: CheckCircle2, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
];

const maxClients = steps[0].clients;

export function FunnelChart() {
  return (
    <div className="w-full space-y-3">
      {steps.map((step) => {
        const progressPercent = (step.clients / maxClients) * 100;
        const StepIcon = step.icon;

        return (
          <div
            key={step.id}
            className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            {/* Icon — lucide-react style with stage-colored background */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.iconBg}`}>
              <StepIcon className={`h-5 w-5 ${step.iconColor}`} strokeWidth={1.75} />
            </div>

            {/* Name + clients */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">
                {step.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {step.clients} клиентов
              </div>
            </div>

            {/* Conversion + progress bar */}
            {step.conversion !== null && (
              <div className="w-32 shrink-0 sm:w-40">
                <div className="mb-1 flex items-end justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Конверсия
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {step.conversion}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FunnelChart;
