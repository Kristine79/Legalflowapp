import { useState } from 'react';
import { Save, CheckCircle2, Send, Mail, ShieldAlert, RefreshCw, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shell } from '@/components/layout/Shell';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListUsers, useUpdateUserRole, UserRole, type User, type UserRole as UserRoleType } from '@workspace/api-client-react';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useProfile } from '@/hooks/use-profile';
import { t } from '@/lib/i18n';
import { resetOnboarding } from '@/lib/storage';

const settingsSchema = z.object({
  enabled: z.boolean(),
  fallbackToEmail: z.boolean(),
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().email(t.errors.invalidEmail).optional().or(z.literal('')),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const BOT_LINK = t.integrations.telegram.botLink;

const ROLES = Object.values(UserRole);

function UsersSection() {
  const { user: me } = useAuthUser();
  const isAdmin = me?.role === 'owner' || me?.role === 'admin';
  const { data: users, isLoading, error } = useListUsers({
    query: { enabled: isAdmin, queryKey: ['users'] },
  });
  const update = useUpdateUserRole();
  const { toast } = useToast();

  if (!isAdmin) return null;

  const handleChange = (userId: string, role: string) => {
    update.mutate(
      { userId, data: { role: role as UserRoleType } },
      {
        onSuccess: () => {
          toast({ title: 'Роль обновлена', description: 'Права пользователя изменены.' });
        },
        onError: (err: Error) => {
          toast({
            title: 'Не удалось обновить роль',
            description: err.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Пользователи
        </CardTitle>
        <CardDescription>Управление ролями сотрудников фирмы</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {error && <p className="text-sm text-destructive">Ошибка загрузки пользователей</p>}
        {users && (
          <div className="space-y-3">
            {users.map((u: User) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{u.name || u.email}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <Select
                  value={u.role}
                  onValueChange={(value) => handleChange(u.id, value)}
                  disabled={update.isPending || u.id === me?.id}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [chatIdInput, setChatIdInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const {
    telegramChatId,
    telegramEnabled,
    connectTelegram,
    disconnectTelegram,
    testTelegram,
    isConnectingTelegram,
  } = useProfile();
  const telegramConnected = telegramEnabled && !!telegramChatId;

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      enabled: settings.notifications.enabled,
      fallbackToEmail: settings.notifications.fallbackToEmail,
      smtpHost: settings.notifications.smtpHost,
      smtpPort: settings.notifications.smtpPort,
      smtpUser: settings.notifications.smtpUser,
      smtpPassword: settings.notifications.smtpPassword,
      smtpFrom: settings.notifications.smtpFrom,
    },
  });

  const onSubmit = (data: SettingsValues) => {
    setIsSaving(true);
    setTimeout(() => {
      updateSettings({
        notifications: {
          ...settings.notifications,
          enabled: data.enabled,
          fallbackToEmail: data.fallbackToEmail,
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || '587',
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword || '',
          smtpFrom: data.smtpFrom || '',
        }
      });
      setIsSaving(false);
      toast({
        title: t.settings.saved,
        description: t.settings.savedDescription,
      });
    }, 600);
  };

  const handleConnectTelegram = async () => {
    if (!chatIdInput.trim()) {
      window.open(BOT_LINK, '_blank');
      return;
    }
    try {
      await connectTelegram(chatIdInput.trim());
      setChatIdInput('');
      toast({
        title: t.integrations.telegram.title,
        description: t.integrations.telegram.connectedHint,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось подключить Telegram',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      await disconnectTelegram();
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось отключить Telegram',
        variant: 'destructive',
      });
    }
  };

  const handleTestTelegram = async () => {
    setIsTesting(true);
    try {
      const result = await testTelegram();
      if (result.ok) {
        toast({ title: t.integrations.telegram.title, description: 'Тестовое сообщение отправлено.' });
      } else {
        toast({ title: 'Ошибка', description: result.error || 'Не удалось отправить сообщение', variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    window.location.reload();
  };

  const isEnabled = form.watch("enabled");
  const useEmailFallback = form.watch("fallbackToEmail");

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">{t.settings.title}</h1>
          <p className="text-muted-foreground mt-1">{t.settings.subtitle}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight">{t.integrations.title}</h2>
              <p className="text-muted-foreground">{t.integrations.subtitle}</p>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" /> {t.integrations.telegram.title}
                      </CardTitle>
                      <CardDescription>{t.integrations.telegram.description}</CardDescription>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {telegramConnected ? t.integrations.telegram.connected : t.integrations.telegram.notConnected}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {telegramConnected ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {t.integrations.telegram.connected}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleTestTelegram} disabled={isTesting}>
                        <Send className="mr-2 h-4 w-4" /> Отправить тест
                      </Button>
                      <Button type="button" variant="ghost" onClick={handleDisconnectTelegram}>
                        Отключить
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                        {t.integrations.telegram.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder={t.integrations.telegram.inputPlaceholder}
                          autoComplete="off"
                          value={chatIdInput}
                          onChange={(e) => setChatIdInput(e.target.value)}
                          className="sm:max-w-sm"
                        />
                        <Button
                          type="button"
                          onClick={handleConnectTelegram}
                          disabled={isConnectingTelegram}
                          className="w-full sm:w-auto"
                        >
                          <Send className="mr-2 h-4 w-4" /> {t.integrations.telegram.connect}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" /> {t.integrations.email.title}
                      </CardTitle>
                      <CardDescription>{t.integrations.email.description}</CardDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="fallbackToEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardHeader>
                {useEmailFallback && (
                  <>
                    <Separator />
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="smtpHost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.settings.smtpHost}</FormLabel>
                              <FormControl>
                                <Input placeholder="smtp.mailgun.org" autoComplete="off" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="smtpPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.settings.smtpPort}</FormLabel>
                              <FormControl>
                                <Input placeholder="587" autoComplete="off" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="smtpUser"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.settings.smtpUser}</FormLabel>
                              <FormControl>
                                <Input placeholder="postmaster@yourdomain.com" autoComplete="username" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="smtpPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.settings.smtpPassword}</FormLabel>
                              <FormControl>
                                <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="smtpFrom"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>{t.settings.smtpFrom}</FormLabel>
                              <FormControl>
                                <Input placeholder="intake@yourdomain.com" autoComplete="email" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Save className="h-5 w-5 text-primary" /> {t.settings.automation}
                    </CardTitle>
                    <CardDescription>{t.settings.automationDescription}</CardDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardHeader>

              <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-between items-center">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {t.settings.localWarning}
                </p>
                <Button type="submit" disabled={isSaving} data-testid="button-save-settings">
                  {isSaving ? t.settings.saving : <><Save className="mr-2 h-4 w-4" /> {t.settings.save}</>}
                </Button>
              </CardFooter>
            </Card>

            <UsersSection />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" /> {t.onboardingReset.title}
                </CardTitle>
                <CardDescription>{t.onboardingReset.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" onClick={handleResetOnboarding}>
                  <RefreshCw className="mr-2 h-4 w-4" /> {t.onboardingReset.button}
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </Shell>
  );
}
