import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clientFormSchema, type ClientFormValues } from '@/lib/validation';
import { STATUS_LABELS, STATUS_ORDER } from '@/types';
import { t } from '@/lib/i18n';
import type { AutomationResult } from '@/lib/automation';

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<ClientFormValues>;
  clientId?: string;
  onSubmit: (data: ClientFormValues) => Promise<AutomationResult | null | void>;
}

export function ClientModal({ open, onOpenChange, initialData, clientId, onSubmit }: ClientModalProps) {
  const isEditing = !!clientId;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      description: initialData?.description || '',
      status: initialData?.status || 'new',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        description: initialData?.description || '',
        status: initialData?.status || 'new',
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isSubmitting) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t.clientModal.editTitle : t.clientModal.newTitle}</DialogTitle>
          <DialogDescription>
            {isEditing ? t.clientModal.editDescription : t.clientModal.newDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.clientModal.name}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.clientModal.namePlaceholder} autoComplete="name" {...field} data-testid="input-client-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.clientModal.phone}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.clientModal.phonePlaceholder} autoComplete="tel" {...field} data-testid="input-client-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.clientModal.status}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-client-status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.clientModal.description}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.clientModal.descriptionPlaceholder}
                      className="min-h-[100px] resize-none"
                      {...field}
                      data-testid="input-client-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t.clientModal.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-save-client"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? t.clientModal.save : t.clientModal.openMatter}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
