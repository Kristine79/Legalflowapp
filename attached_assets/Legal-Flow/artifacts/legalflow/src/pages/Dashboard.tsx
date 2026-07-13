import { useMemo, useRef, useState } from 'react';
import { Plus, Sparkles, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { StatCards } from '@/components/dashboard/StatCards';
import { AnalyticsSection } from '@/components/dashboard/AnalyticsSection';
import { AiIntake } from '@/components/clients/AiIntake';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientModal } from '@/components/clients/ClientModal';
import { ClientActivitySheet } from '@/components/clients/ClientActivitySheet';
import { SuccessToast } from '@/components/notifications/SuccessToast';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import { useActivities } from '@/hooks/use-activities';
import { useTasks } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { ClientWithAi, AiAnalysis } from '@/types';
import type { ClientFormValues } from '@/lib/validation';
import type { AutomationResult } from '@/lib/automation';

export function Dashboard() {
  const { clients, createClient, updateClient, changeStatus, removeClient } = useClients();
  const { activities, reload: reloadActivities } = useActivities();
  const { tasks } = useTasks();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const aiIntakeRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<Partial<ClientFormValues> | undefined>();
  const [editingClientId, setEditingClientId] = useState<string | undefined>();
  const [pendingAnalysis, setPendingAnalysis] = useState<AiAnalysis | undefined>();
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<ClientWithAi | null>(null);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.aiSummary?.category.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const handleAiAnalyzeComplete = (description: string, analysis?: AiAnalysis) => {
    setModalInitialData({ description, status: 'new' });
    setPendingAnalysis(analysis);
    setEditingClientId(undefined);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setModalInitialData(undefined);
    setPendingAnalysis(undefined);
    setEditingClientId(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (client: ClientWithAi) => {
    setModalInitialData({
      name: client.name,
      phone: client.phone,
      description: client.description,
      status: client.status,
    });
    setPendingAnalysis(undefined);
    setEditingClientId(client.id);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (data: ClientFormValues): Promise<AutomationResult | null | void> => {
    if (editingClientId) {
      updateClient(editingClientId, data);
      setPendingAnalysis(undefined);
      reloadActivities();
      toast({
        title: t.clientModal.editTitle,
        description: t.successToast.clientUpdated,
      });
    } else {
      const result = await createClient(data, pendingAnalysis);
      setPendingAnalysis(undefined);
      reloadActivities();
      if (result?.success) {
        toast({
          title: t.successToast.title,
          description: <SuccessToast result={result} />,
        });
      }
      return result;
    }
  };

  const handleViewHistory = (client: ClientWithAi) => {
    setSelectedClientForHistory(client);
  };

  return (
    <Shell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="flex flex-col space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">{t.dashboard.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{t.dashboard.subtitle}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{t.dashboard.quickActions}</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreateNew} data-testid="button-new-client" size="sm">
              <Plus className="mr-2 h-4 w-4" /> {t.dashboard.newClient}
            </Button>
            <Button onClick={handleCreateNew} data-testid="button-new-matter" size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> {t.dashboard.newCase}
            </Button>
            <Button
              onClick={() => aiIntakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              data-testid="button-ai-intake"
              size="sm"
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" /> {t.dashboard.aiIntake}
            </Button>
            <Button
              onClick={() => setLocation('/documents')}
              data-testid="button-upload-document"
              size="sm"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" /> {t.dashboard.uploadDocument}
            </Button>
          </div>
        </div>

        <StatCards clients={clients} tasks={tasks} />

        <AnalyticsSection clients={clients} tasks={tasks} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8 items-start">
          <div className="xl:col-span-1" ref={aiIntakeRef}>
            <div className="sticky top-24">
              <AiIntake onAnalyzeComplete={handleAiAnalyzeComplete} />
            </div>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                {t.dashboard.activeCases}
                <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full font-medium">
                  {filteredClients.length}
                </span>
              </h2>
            </div>

            <ClientTable
              clients={filteredClients}
              onChangeStatus={changeStatus}
              onEdit={handleEdit}
              onDelete={removeClient}
              onViewActivity={handleViewHistory}
              onCreate={handleCreateNew}
            />
          </div>
        </div>
      </div>

      <ClientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={modalInitialData}
        clientId={editingClientId}
        onSubmit={handleSaveModal}
      />

      <ClientActivitySheet
        open={!!selectedClientForHistory}
        onOpenChange={(open) => !open && setSelectedClientForHistory(null)}
        client={selectedClientForHistory}
        activities={activities.filter((a) => a.clientId === selectedClientForHistory?.id)}
      />
    </Shell>
  );
}
