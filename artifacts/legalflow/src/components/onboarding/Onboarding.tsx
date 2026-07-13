import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ChevronLeft, User, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/use-profile';
import { setOnboardingComplete } from '@/lib/storage';
import { t } from '@/lib/i18n';
import logoIcon from '@/assets/logo-icon.png';

interface OnboardingProps {
  onComplete: () => void;
}

const BOT_LINK = t.integrations.telegram.botLink;

export function Onboarding({ onComplete }: OnboardingProps) {
  const { profile, updateProfile, telegramEnabled, connectTelegram } = useProfile();
  const [step, setStep] = useState(0);
  const [localProfile, setLocalProfile] = useState(profile);
  const [chatIdInput, setChatIdInput] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(telegramEnabled);

  const totalSteps = 4;
  const isLast = step === totalSteps - 1;

  const steps = [
    t.onboarding.steps.welcome,
    t.onboarding.steps.profile,
    t.onboarding.steps.telegram,
    t.onboarding.steps.done,
  ];

  const handleNext = () => {
    if (step === 1) {
      updateProfile(localProfile);
    }
    if (isLast) {
      setOnboardingComplete();
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = () => {
    setOnboardingComplete();
    onComplete();
  };

  const handleConnectTelegram = async () => {
    if (!chatIdInput.trim()) {
      window.open(BOT_LINK, '_blank');
      return;
    }
    try {
      await connectTelegram(chatIdInput.trim());
      setTelegramConnected(true);
    } catch {
      // Ignore here; user can retry from Settings.
    }
  };

  const icons = [
    <img src={logoIcon} alt={t.app.name} className="h-12 w-12 object-contain shrink-0 rounded-xl" />,
    <User className="h-8 w-8 text-primary shrink-0" />,
    <Send className="h-8 w-8 text-primary shrink-0" />,
    <Sparkles className="h-8 w-8 text-primary shrink-0" />,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-muted/50 px-6 py-4 border-b flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {t.onboarding.step.replace('{step}', String(step + 1)).replace('{total}', String(totalSteps))}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-8 min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary/10 rounded-xl shrink-0">{icons[step]}</div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                    {steps[step].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{steps[step].description}</p>
                </div>
              </div>

              {step === 1 && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.profile.name}</Label>
                      <Input
                        value={localProfile.name}
                        onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.profile.initials}</Label>
                      <Input
                        value={localProfile.initials}
                        maxLength={3}
                        onChange={(e) => setLocalProfile({ ...localProfile, initials: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.profile.role}</Label>
                    <Input
                      value={localProfile.role}
                      onChange={(e) => setLocalProfile({ ...localProfile, role: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.profile.firmName}</Label>
                    <Input
                      value={localProfile.firmName}
                      onChange={(e) => setLocalProfile({ ...localProfile, firmName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {!telegramConnected && (
                    <Input
                      placeholder="Chat ID из бота"
                      autoComplete="off"
                      value={chatIdInput}
                      onChange={(e) => setChatIdInput(e.target.value)}
                    />
                  )}
                  <Button
                    variant={telegramConnected ? 'secondary' : 'default'}
                    className="w-full"
                    onClick={handleConnectTelegram}
                    disabled={telegramConnected}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {telegramConnected ? t.onboarding.steps.telegram.connected : t.onboarding.steps.telegram.connect}
                  </Button>
                  {telegramConnected && (
                    <div className="flex items-center gap-2 text-sm text-chart-3 bg-chart-3/10 p-3 rounded-lg border border-chart-3/20">
                      <CheckCircle2 className="h-4 w-4" />
                      {t.onboarding.steps.telegram.connected}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    {t.onboarding.steps.telegram.hint}
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    <span>{t.successToast.clientCreated}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    <span>{t.successToast.aiReady}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    <span>{t.successToast.telegramSent}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            {t.onboarding.skip}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> {t.onboarding.back}
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLast ? t.onboarding.finish : t.onboarding.next}
              {!isLast && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
