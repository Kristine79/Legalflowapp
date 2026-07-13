import type { AiAnalysis } from '@/types';

const CATEGORIES = [
  'Contract Law',
  'Family Law',
  'Criminal Defense',
  'Personal Injury',
  'Employment Law',
  'Housing & Tenant Law',
  'Immigration',
  'Intellectual Property',
  'Estate Planning',
  'Business & Corporate',
  'Civil Litigation',
  'Real Estate',
];

const KEYWORDS: Record<string, string[]> = {
  'Contract Law': ['contract', 'agreement', 'terms', 'breach', 'vendor', 'lease', 'nda', 'sla'],
  'Family Law': ['custody', 'divorce', 'marriage', 'child', 'adoption', 'alimony', 'family'],
  'Criminal Defense': ['arrest', 'charge', 'crime', 'defense', 'criminal', 'dui', 'felony'],
  'Personal Injury': ['injury', 'accident', 'slip', 'fall', 'medical', 'malpractice', 'compensation'],
  'Employment Law': ['employment', 'wrongful', 'termination', 'discrimination', 'harassment', 'wage', 'overtime'],
  'Housing & Tenant Law': ['landlord', 'tenant', 'eviction', 'rent', 'lease', 'housing', 'repair'],
  Immigration: ['visa', 'green card', 'citizenship', 'immigration', 'deportation', 'asylum'],
  'Intellectual Property': ['patent', 'trademark', 'copyright', 'ip', 'infringement', 'license'],
  'Estate Planning': ['will', 'trust', 'estate', 'probate', 'inheritance', 'power of attorney'],
  'Business & Corporate': ['incorporation', 'llc', 'corporate', 'merger', 'acquisition', 'startup', 'equity'],
  'Civil Litigation': ['lawsuit', 'plaintiff', 'defendant', 'court', 'litigation', 'settlement', 'damages'],
  'Real Estate': ['property', 'deed', 'title', 'mortgage', 'foreclosure', 'zoning'],
};

const NEXT_ACTIONS: Record<string, string[]> = {
  'Contract Law': ['Review contract clauses', 'Draft amendment or demand letter', 'Schedule client review call'],
  'Family Law': ['Schedule intake consultation', 'Gather financial and custody documents', 'File petition with family court'],
  'Criminal Defense': ['Review discovery and evidence', 'Arrange bail consultation', 'Prepare motion to dismiss'],
  'Personal Injury': ['Collect medical records', 'Send preservation of evidence letter', 'Schedule damages assessment'],
  'Employment Law': ['Request employment records', 'Draft EEOC or state agency charge', 'Prepare settlement demand'],
  'Housing & Tenant Law': ['Document habitability issues', 'Send landlord demand letter', 'File tenant complaint'],
  Immigration: ['Verify visa status and documents', 'Prepare USCIS filing package', 'Schedule attorney review'],
  'Intellectual Property': ['Run prior-art or trademark search', 'Draft cease-and-desist letter', 'Prepare USPTO filing'],
  'Estate Planning': ['Draft will or trust document', 'Review beneficiary designations', 'Schedule notarization'],
  'Business & Corporate': ['Draft organizational documents', 'Review cap table and equity docs', 'Schedule board consent'],
  'Civil Litigation': ['Draft complaint or answer', 'Serve discovery requests', 'Prepare settlement memorandum'],
  'Real Estate': ['Order title search', 'Review closing disclosures', 'Schedule property inspection'],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyCategory(text: string): string {
  const words = new Set(normalize(text).split(' '));
  let bestCategory = 'Civil Litigation';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    const score = keywords.reduce((acc, keyword) => acc + (words.has(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function inferPriority(text: string): AiAnalysis['priority'] {
  const urgentTerms = ['urgent', 'emergency', 'immediate', 'today', 'deadline', 'eviction', 'arrest', 'custody', 'safety', 'danger', 'threat', 'violence', 'injury', 'accident', 'hospital'];
  const highTerms = ['time-sensitive', 'lawsuit', 'court', 'notice', 'breach', 'complaint', 'disciplinary', 'termination', 'foreclosure'];
  const lowTerms = ['routine', 'review', 'standard', 'draft', 'simple', 'minor', 'consultation', 'question'];
  const normalized = normalize(text);

  if (urgentTerms.some((t) => normalized.includes(t))) return 'urgent';
  if (highTerms.some((t) => normalized.includes(t))) return 'high';
  if (lowTerms.some((t) => normalized.includes(t))) return 'low';
  return 'medium';
}

function generateSummary(text: string, category: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 120) {
    return `${category} matter: ${trimmed}`;
  }
  return `${category} matter: ${trimmed.slice(0, 120).trim()}...`;
}

function pickNextAction(category: string, priority: AiAnalysis['priority']): string {
  const actions = NEXT_ACTIONS[category] || NEXT_ACTIONS['Civil Litigation'];
  if (priority === 'urgent' || priority === 'high') {
    return actions[0];
  }
  if (priority === 'medium') {
    return actions[1] || actions[0];
  }
  return actions[2] || actions[1] || actions[0];
}

const TYPE_TEMPLATES: Record<string, string> = {
  'Family Law': 'Семейное дело',
  'Housing & Tenant Law': 'Жилищный спор',
  'Contract Law': 'Договорной спор',
  'Employment Law': 'Трудовой спор',
  'Criminal Defense': 'Уголовное дело',
  'Personal Injury': 'Дело о причинении вреда здоровью',
  'Civil Litigation': 'Гражданское дело',
  'Business & Corporate': 'Корпоративное дело',
  'Real Estate': 'Недвижимость',
  'Immigration': 'Миграционное дело',
  'Intellectual Property': 'Интеллектуальная собственность',
  'Estate Planning': 'Наследственное дело',
};

const RISK_TEMPLATES: Record<string, string[]> = {
  'Family Law': ['неизвестны детали имущественных споров', 'не уточнена позиция второй стороны', 'возможны сроки исковой давности'],
  'Housing & Tenant Law': ['не подтвержден факт нарушения', 'неизвестен срок договора', 'возможен риск выселения'],
  'Contract Law': ['не проверены условия договора', 'неясен размер убытков', 'возможен пропуск срока претензии'],
  'Employment Law': ['не подтверждены трудовые отношения', 'не собраны доказательства', 'возможен пропуск срока обращения'],
  'Criminal Defense': ['неизвестен состав обвинения', 'не собраны доказательства', 'возможны ограничения по срокам'],
  'Personal Injury': ['не собраны медицинские документы', 'не установлен причинитель', 'возможен срок исковой давности'],
  'Civil Litigation': ['неизвестен полный фактический состав', 'не собраны доказательства', 'возможны судебные расходы'],
  'Business & Corporate': ['не проверены учредительные документы', 'неясны полномочия сторон', 'возможны налоговые риски'],
  'Real Estate': ['не проверено правоустанавливающее документ', 'неизвестны обременения', 'возможны сроки регистрации'],
  'Immigration': ['не проверен статус миграционного учета', 'неизвестны сроки действия документов'],
  'Intellectual Property': ['не проверена правовая охрана', 'не собраны доказательства нарушения'],
  'Estate Planning': ['не установлен круг наследников', 'не проверены завещания', 'возможны сроки принятия наследства'],
};

const QUESTION_TEMPLATES: Record<string, string[]> = {
  'Family Law': ['Есть ли дети?', 'Есть ли совместное имущество?', 'Есть ли согласие супругов?'],
  'Housing & Tenant Law': ['Есть ли письменный договор?', 'Есть ли доказательства нарушений?', 'Какой срок просрочки?'],
  'Contract Law': ['Есть ли подписанный договор?', 'Какие условия нарушены?', 'Есть ли переписка по спору?'],
  'Employment Law': ['Есть ли трудовой договор?', 'Каков срок работы?', 'Есть ли доказательства нарушений?'],
  'Criminal Defense': ['Какие обвинения предъявлены?', 'Есть ли постановление?', 'Есть ли свидетели?'],
  'Personal Injury': ['Есть ли медицинские документы?', 'Когда произошел инцидент?', 'Есть ли свидетели?'],
  'Civil Litigation': ['Какие документы имеются по делу?', 'Есть ли судебные акты?', 'Какие требования предъявляются?'],
  'Business & Corporate': ['Есть ли учредительные документы?', 'Какие договоры заключены?', 'Есть ли протоколы собраний?'],
  'Real Estate': ['Есть ли выписка из ЕГРН?', 'Есть ли договор купли-продажи?', 'Есть ли обременения?'],
  'Immigration': ['Какой документ нужен?', 'Есть ли основания для подачи?', 'Каков срок действия текущего статуса?'],
  'Intellectual Property': ['Есть ли свидетельство/патент?', 'Когда обнаружено нарушение?', 'Есть ли доказательства убытков?'],
  'Estate Planning': ['Есть ли завещание?', 'Кто наследники?', 'Есть ли спор об имуществе?'],
};

const DOCUMENT_TEMPLATES: Record<string, string[]> = {
  'Family Law': ['паспорт', 'свидетельство о браке', 'свидетельство о рождении детей'],
  'Housing & Tenant Law': ['договор аренды', 'фото/видео нарушений', 'переписка с арендодателем'],
  'Contract Law': ['договор', 'переписка', 'документы об исполнении'],
  'Employment Law': ['трудовой договор', 'трудовая книжка', 'расчетные листки'],
  'Criminal Defense': ['постановление', 'протокол', 'доказательства невиновности'],
  'Personal Injury': ['медицинские документы', 'заключение эксперта', 'доказательства причинения вреда'],
  'Civil Litigation': ['исковое заявление', 'доказательства', 'переписка'],
  'Business & Corporate': ['учредительные документы', 'договоры', 'протоколы'],
  'Real Estate': ['выписка из ЕГРН', 'договор', 'кадастровый паспорт'],
  'Immigration': ['паспорт', 'миграционные документы', 'заявление'],
  'Intellectual Property': ['свидетельство о регистрации', 'доказательства нарушения', 'договор лицензии'],
  'Estate Planning': ['свидетельство о смерти', 'завещание', 'документы на наследуемое имущество'],
};

export function analyzeIntake(text: string): AiAnalysis {
  const category = classifyCategory(text);
  const priority = inferPriority(text);
  const type = TYPE_TEMPLATES[category] || 'Юридический вопрос';
  return {
    summary: generateSummary(text, category),
    category,
    type,
    priority,
    risks: RISK_TEMPLATES[category] || ['требуется уточнение деталей'],
    questions: QUESTION_TEMPLATES[category] || ['Что именно произошло?', 'Какие документы имеются?', 'Каковы цели клиента?'],
    documents: DOCUMENT_TEMPLATES[category] || ['паспорт', 'переписка по делу'],
    nextAction: 'Создать дело',
  };
}

export function generateAiSummaryForClient(description: string): AiAnalysis {
  return analyzeIntake(description);
}
