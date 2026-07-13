import { z } from 'zod';
import type { ClientStatus } from '@/types';
import { t } from '@/lib/i18n';

const clientStatusValues: [ClientStatus, ClientStatus, ClientStatus, ClientStatus] = [
  'new',
  'in-progress',
  'waiting',
  'closed',
];

export const clientFormSchema = z.object({
  name: z.string().min(1, t.validation.nameRequired).max(120, t.validation.nameTooLong),
  phone: z.string().min(1, t.validation.phoneRequired).max(40, t.validation.phoneTooLong),
  description: z.string().min(1, t.validation.descriptionRequired).max(2000, t.validation.descriptionTooLong),
  status: z.enum(clientStatusValues),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
