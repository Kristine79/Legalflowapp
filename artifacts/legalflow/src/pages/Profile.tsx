import { useEffect, useRef, useState } from 'react';
import { Save, User, Building2, Mail, Briefcase, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shell } from '@/components/layout/Shell';
import { useProfile } from '@/hooks/use-profile';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(1, 'Введите имя'),
  email: z.string().email(t.errors.invalidEmail),
  role: z.string().min(1, 'Введите роль'),
  initials: z.string().min(1, 'Введите инициалы').max(3, 'Не более 3 символов'),
  firmName: z.string().min(1, 'Введите название фирмы'),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function Profile() {
  const { profile, updateProfile } = useProfile();
  const { user: serverUser, isLoading: serverLoading } = useAuthUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const didSyncRole = useRef(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  useEffect(() => {
    form.reset(profile);
  }, [profile, form]);

  useEffect(() => {
    if (serverUser && !didSyncRole.current && profile.role !== serverUser.role) {
      didSyncRole.current = true;
      // Role is managed server-side by admins; do not include it in profile sync.
      updateProfile({ name: profile.name, email: profile.email, initials: profile.initials, firmName: profile.firmName });
    }
  }, [serverUser, profile, updateProfile]);

  const onSubmit = (data: ProfileValues) => {
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({
        name: data.name,
        email: data.email,
        initials: data.initials,
        firmName: data.firmName,
      });
      setIsSaving(false);
      toast({
        title: t.profile.saved,
        description: t.profile.savedDescription,
      });
    }, 500);
  };

  const displayRole = serverUser?.role ?? profile.role;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">{t.profile.title}</h1>
          <p className="text-muted-foreground mt-1">{t.profile.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-primary/10 ring-offset-4 ring-offset-background">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-semibold text-foreground">{profile.name}</p>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                <Shield className="h-3 w-3 mr-1" />
                {displayRole}
              </Badge>
              <span>·</span>
              <span>{profile.firmName}</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> {t.profile.title}
                </CardTitle>
                <CardDescription>{t.profile.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> {t.profile.name}</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t.profile.email}</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> {t.profile.role}
                    </label>
                    <Input value={displayRole} disabled readOnly />
                    <p className="text-xs text-muted-foreground mt-1">
                      Роль управляется владельцем или администратором фирмы.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="initials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.profile.initials}</FormLabel>
                        <FormControl>
                          <Input maxLength={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="firmName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {t.profile.firmName}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
                <Button type="submit" disabled={isSaving || serverLoading} data-testid="button-save-profile">
                  {isSaving ? 'Сохранение...' : <><Save className="mr-2 h-4 w-4" /> {t.profile.save}</>}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </Shell>
  );
}
