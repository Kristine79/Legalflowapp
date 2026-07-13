const steps = [
  { id: 1, name: 'Новое обращение', clients: 100, conversion: 75, icon: '👤' },
  { id: 2, name: 'Первичная консультация', clients: 75, conversion: 67, icon: '📞' },
  { id: 3, name: 'Документы получены', clients: 50, conversion: 60, icon: '📄' },
  { id: 4, name: 'Дело в работе', clients: 30, conversion: 100, icon: '💼' },
  { id: 5, name: 'Закрыто', clients: 30, conversion: null, icon: '✅' },
];

const maxClients = steps[0].clients;

export function FunnelChart() {
  return (
    <div className="w-full space-y-3">
      {steps.map((step) => {
        const progressPercent = (step.clients / maxClients) * 100;
        const hasConversion = step.conversion !== null;

        return (
          <div
            key={step.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
              {step.icon}
            </div>

            {/* Name + clients */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-800">
                {step.name}
              </div>
              <div className="text-xs text-slate-500">
                {step.clients} клиентов
              </div>
            </div>

            {/* Conversion + progress */}
            {hasConversion && (
              <div className="w-32 shrink-0 sm:w-40">
                <div className="mb-1 flex items-end justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Конверсия
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {step.conversion}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1e3a5f]"
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
