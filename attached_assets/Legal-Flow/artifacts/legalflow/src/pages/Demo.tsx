import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Eye, Plus, BarChart3, CheckCircle2, Clock, Inbox, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCards } from '@/components/dashboard/StatCards';
import { AnalyticsSection } from '@/components/dashboard/AnalyticsSection';
import { ClientTable } from '@/components/clients/ClientTable';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import logoIcon from '@/assets/logo-icon.png';
import type { ClientWithAi } from '@/types';
import type { DashboardStats } from '@workspace/api-client-react';

const DEMO_CLIENTS: ClientWithAi[] = [
  {
    id: 'demo-1',
    name: 'Петров Александр Иванович',
    phone: '+7 916 234-56-78',
    email: 'petrov@example.com',
    description: 'Трудовой спор — незаконное увольнение. Клиент работал в компании 8 лет, уволен без выходного пособия.',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Трудовое право',
      summary: 'Незаконное увольнение без выходного пособия. Высокие шансы выиграть дело.',
      type: 'Трудовой спор',
      priority: 'high',
      risks: ['Пропуск срока исковой давности (1 месяц)', 'Недостаточность письменных доказательств'],
      questions: ['Есть ли письменное уведомление об увольнении?', 'Была ли выплачена зарплата за последний месяц?'],
      documents: ['Трудовой договор', 'Приказ об увольнении', 'Расчётный лист'],
      nextAction: 'Направить претензию работодателю в течение 5 рабочих дней',
    },
  },
  {
    id: 'demo-2',
    name: 'Сидорова Мария Николаевна',
    phone: '+7 903 111-22-33',
    email: 'sidorova@example.com',
    description: 'Раздел имущества при разводе. Совместно нажитое имущество: квартира, автомобиль, банковские вклады.',
    status: 'new',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Семейное право',
      summary: 'Раздел совместно нажитого имущества. Рекомендуется досудебное урегулирование.',
      type: 'Развод и раздел имущества',
      priority: 'medium',
      risks: ['Сокрытие супругом части активов', 'Длительные судебные разбирательства'],
      questions: ['Есть ли брачный договор?', 'Дата регистрации брака?', 'Есть ли несовершеннолетние дети?'],
      documents: ['Свидетельство о браке', 'Свидетельства о праве собственности', 'Выписки из банков'],
      nextAction: 'Подготовить перечень совместно нажитого имущества',
    },
  },
  {
    id: 'demo-3',
    name: 'Козлов Дмитрий Сергеевич',
    phone: '+7 926 555-44-33',
    description: 'Взыскание долга по договору займа. Знакомый взял 850 000 руб. под расписку, не возвращает 14 месяцев.',
    status: 'waiting',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Гражданское право',
      summary: 'Взыскание долга по расписке. Срок исковой давности не истёк.',
      type: 'Взыскание задолженности',
      priority: 'high',
      risks: ['Должник может оспорить подпись в расписке', 'Возможное банкротство должника'],
      questions: ['Расписка удостоверена нотариально?', 'Есть ли переписка с требованием вернуть долг?'],
      documents: ['Расписка о займе', 'Переписка с должником', 'Паспортные данные должника'],
      nextAction: 'Направить досудебную претензию с требованием погасить долг в течение 10 дней',
    },
  },
  {
    id: 'demo-4',
    name: 'Новикова Елена Павловна',
    phone: '+7 965 777-88-99',
    description: 'Защита прав потребителя. Купила холодильник в магазине, через 3 недели вышел из строя. Магазин отказывает в возврате.',
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Защита прав потребителей',
      summary: 'Возврат товара ненадлежащего качества. Закон на стороне потребителя.',
      type: 'Защита прав потребителя',
      priority: 'medium',
      risks: ['Истечение 15-дневного срока для обмена', 'Отказ в проведении экспертизы магазином'],
      questions: ['Есть ли кассовый чек?', 'Проводилась ли независимая экспертиза?'],
      documents: ['Кассовый чек', 'Гарантийный талон', 'Акт о неисправности'],
      nextAction: 'Направить претензию в магазин с требованием возврата денег в течение 10 дней',
    },
  },
  {
    id: 'demo-5',
    name: 'Морозов Игорь Владимирович',
    phone: '+7 919 321-00-11',
    description: 'Арендный спор. Арендодатель повысил аренду в одностороннем порядке на 40% без уведомления.',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Гражданское право',
      summary: 'Оспаривание одностороннего повышения арендной платы. Нарушение условий договора.',
      type: 'Арендный спор',
      priority: 'urgent',
      risks: ['Расторжение договора аренды арендодателем', 'Вынужденный переезд бизнеса'],
      questions: ['Какой срок уведомления предусмотрен договором?', 'Есть ли пункт об изменении цены?'],
      documents: ['Договор аренды', 'Уведомление о повышении арендной платы', 'Платёжные документы'],
      nextAction: 'Направить письменный протест арендодателю, сослаться на п. договора',
    },
  },
  {
    id: 'demo-6',
    name: 'Захарова Ольга Фёдоровна',
    phone: '+7 912 456-78-90',
    description: 'Наследственный спор. Оспаривание завещания, составленного в недееспособном состоянии.',
    status: 'closed',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Наследственное право',
      summary: 'Дело выиграно. Завещание признано недействительным, наследство перераспределено.',
      type: 'Наследственный спор',
      priority: 'high',
      risks: [],
      questions: [],
      documents: [],
      nextAction: 'Дело закрыто',
    },
  },
  {
    id: 'demo-7',
    name: 'Белов Сергей Анатольевич',
    phone: '+7 985 123-45-67',
    description: 'ДТП, виновник скрылся с места происшествия. Страховая отказывает в выплате по ОСАГО.',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Страховое право',
      summary: 'Оспаривание отказа страховой компании в выплате. Необходим поиск виновника.',
      type: 'Страховой спор',
      priority: 'high',
      risks: ['Сложность установления виновника', 'Срок исковой давности 2 года'],
      questions: ['Есть ли запись с камер?', 'Был ли вызван инспектор ГИБДД?'],
      documents: ['Протокол ГИБДД', 'Полис ОСАГО', 'Фотографии с места ДТП'],
      nextAction: 'Подать иск к страховой компании о взыскании ущерба',
    },
  },
  {
    id: 'demo-8',
    name: 'Тихонова Анна Юрьевна',
    phone: '+7 977 654-32-10',
    description: 'Долевое строительство, застройщик нарушил сроки сдачи на 14 месяцев.',
    status: 'waiting',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    aiSummary: {
      category: 'Строительное право',
      summary: 'Взыскание неустойки по ДДУ. Задержка сдачи объекта 14 месяцев.',
      type: 'Долевое строительство',
      priority: 'medium',
      risks: ['Банкротство застройщика', 'Уменьшение неустойки судом'],
      questions: ['Дата ввода по ДДУ?', 'Договор зарегистрирован в Росреестре?'],
      documents: ['Договор ДДУ', 'Акт о несоблюдении сроков', 'Переписка с застройщиком'],
      nextAction: 'Рассчитать и направить требование об уплате неустойки застройщику',
    },
  },
];

const DEMO_STATS = {
  total: DEMO_CLIENTS.length,
  new: DEMO_CLIENTS.filter((c) => c.status === 'new').length,
  inProgress: DEMO_CLIENTS.filter((c) => c.status === 'in-progress').length,
  closed: DEMO_CLIENTS.filter((c) => c.status === 'closed').length,
};

const DEMO_ANALYTICS_STATS: DashboardStats = {
  totalClients: DEMO_STATS.total,
  newToday: DEMO_STATS.new,
  inProgress: DEMO_STATS.inProgress,
  closed: DEMO_STATS.closed,
  statusBreakdown: [
    { status: 'new', count: DEMO_CLIENTS.filter((c) => c.status === 'new').length },
    { status: 'in-progress', count: DEMO_CLIENTS.filter((c) => c.status === 'in-progress').length },
    { status: 'waiting', count: DEMO_CLIENTS.filter((c) => c.status === 'waiting').length },
    { status: 'closed', count: DEMO_CLIENTS.filter((c) => c.status === 'closed').length },
  ],
  weeklyTrend: Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    return { date: date.toISOString(), count: [3, 5, 2, 6, 4, 1, 0][i] };
  }),
};

function DemoHeader() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 mr-4 text-primary hover:opacity-90 transition-opacity">
          <img src={logoIcon} alt={t.app.brandName} className="h-8 w-8 rounded-lg" />
          <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">{t.app.brandName}</span>
        </Link>
        <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 text-amber-600 border-amber-300 bg-amber-50">
          <Eye className="h-3 w-3" />
          Демо-режим
        </Badge>
        <div className="flex-1" />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${basePath}/sign-in`}>Войти</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`${basePath}/sign-up`}>
              Начать бесплатно <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function DemoBanner() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <Eye className="h-4 w-4 shrink-0" />
          <span>
            <strong>Демо-режим</strong> — вы просматриваете продукт с тестовыми данными. Все действия заблокированы.
          </span>
        </div>
        <Button size="sm" className="shrink-0" asChild>
          <Link href={`${basePath}/sign-up`}>Создать аккаунт бесплатно</Link>
        </Button>
      </div>
    </div>
  );
}

export function Demo() {
  const { toast } = useToast();
  const [clients] = useState<ClientWithAi[]>(DEMO_CLIENTS);

  const noop = () => {
    toast({
      title: 'Демо-режим',
      description: 'Действия недоступны в демо. Зарегистрируйтесь, чтобы работать с данными.',
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <DemoHeader />
      <DemoBanner />

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col space-y-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">{t.dashboard.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">{t.dashboard.subtitle}</p>
            </div>
            <Button onClick={noop} className="w-full md:w-auto shadow-sm opacity-50 cursor-not-allowed" tabIndex={-1}>
              <Plus className="mr-2 h-4 w-4" /> {t.dashboard.newMatter}
            </Button>
          </div>

          <StatCards clients={clients} />

          <AnalyticsSection overrideStats={DEMO_ANALYTICS_STATS} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                {t.dashboard.activeCases}
                <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full font-medium">
                  {clients.length}
                </span>
              </h2>
            </div>

            <ClientTable
              clients={clients}
              onChangeStatus={noop as never}
              onEdit={noop as never}
              onDelete={noop as never}
              onViewActivity={noop as never}
            />
          </div>

          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center space-y-4 mt-4">
            <div className="flex justify-center gap-6 mb-2">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{DEMO_STATS.total}</div>
                <div className="text-xs text-muted-foreground mt-1">клиентов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-chart-2">{DEMO_STATS.new}</div>
                <div className="text-xs text-muted-foreground mt-1">новых</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{DEMO_STATS.inProgress}</div>
                <div className="text-xs text-muted-foreground mt-1">в работе</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-chart-3">{DEMO_STATS.closed}</div>
                <div className="text-xs text-muted-foreground mt-1">закрыто</div>
              </div>
            </div>
            <h3 className="text-xl font-semibold">Готовы вести реальные дела?</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Регистрация занимает 30 секунд. Ваши данные защищены и никуда не передаются.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" asChild>
                <Link href="/sign-up" className="gap-2">
                  Начать бесплатно <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Уже есть аккаунт</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
