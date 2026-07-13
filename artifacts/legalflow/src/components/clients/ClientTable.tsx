import { useState } from 'react';
import { Edit2, MoreHorizontal, Trash2, History, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UseClientsReturn } from '@/hooks/use-clients';
import { STATUS_LABELS, STATUS_ORDER, ClientStatus, ClientWithAi } from '@/types';
import { t } from '@/lib/i18n';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClientTableProps {
  clients: ClientWithAi[];
  onChangeStatus: UseClientsReturn['changeStatus'];
  onEdit: (client: ClientWithAi) => void;
  onDelete: UseClientsReturn['removeClient'];
  onViewActivity: (client: ClientWithAi) => void;
  onCreate?: () => void;
}

export function ClientTable({ clients, onChangeStatus, onEdit, onDelete, onViewActivity, onCreate }: ClientTableProps) {
  const [clientToDelete, setClientToDelete] = useState<ClientWithAi | null>(null);

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'new': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary/80 dark:border-primary/30';
      case 'waiting': return 'bg-muted/60 text-muted-foreground border-border dark:bg-muted/40 dark:text-muted-foreground';
      case 'closed': return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    if (priority === 'urgent') return <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" title={t.ai.priorityLabels.urgent} />;
    if (priority === 'high') return <div className="w-2 h-2 rounded-full bg-chart-2 flex-shrink-0" title={t.ai.priorityLabels.high} />;
    return null;
  };

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">{t.clientTable.clientIssue}</TableHead>
              <TableHead>{t.clientTable.contact}</TableHead>
              <TableHead>{t.clientTable.status}</TableHead>
              <TableHead>{t.clientTable.created}</TableHead>
              <TableHead className="text-right">{t.clientTable.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <p className="font-medium text-foreground">{t.clientTable.emptyTitle}</p>
                    <p className="text-sm text-muted-foreground max-w-sm">{t.clientTable.emptyDescription}</p>
                    {onCreate && (
                      <Button onClick={onCreate} size="sm" className="mt-1">
                        <Plus className="mr-2 h-4 w-4" />
                        {t.clientTable.emptyCta}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {getPriorityBadge(client.aiSummary?.priority)}
                      {client.name}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-1 max-w-[280px]" title={client.aiSummary?.summary || client.description}>
                      {client.aiSummary?.summary || client.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{client.phone}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent data-[state=open]:bg-transparent">
                          <Badge variant="outline" className={`cursor-pointer ${getStatusColor(client.status)}`}>
                            {STATUS_LABELS[client.status]}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>{t.clientTable.changeStatus}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={client.status} onValueChange={(v) => onChangeStatus(client.id, v as ClientStatus)}>
                          {STATUS_ORDER.map((s) => (
                            <DropdownMenuRadioItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(client.createdAt), 'd MMM yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-menu-${client.id}`}>
                          <span className="sr-only">{t.clientTable.menu}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewActivity(client)}>
                          <History className="mr-2 h-4 w-4" />
                          <span>{t.clientTable.viewHistory}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>{t.clientTable.editClient}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setClientToDelete(client)}
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t.clientTable.delete}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.clientTable.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.clientTable.deleteDescription} <strong>{clientToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.clientTable.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (clientToDelete) onDelete(clientToDelete.id);
                setClientToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.clientTable.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
