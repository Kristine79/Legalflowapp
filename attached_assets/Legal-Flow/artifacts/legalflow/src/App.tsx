import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider, SignIn, SignUp, Show } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { LanguageProvider } from '@/lib/i18n';
import { shadcn } from '@clerk/themes';
import { clerkRuLocalization } from '@/lib/clerk-localization';

import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Settings } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { Documents } from '@/pages/Documents';
import { Tasks } from '@/pages/Tasks';
import { Calendar } from '@/pages/Calendar';
import { AiTools } from '@/pages/AiTools';
import { Demo } from '@/pages/Demo';
import { Faq } from '@/pages/Faq';
import { About } from '@/pages/About';
import { Pricing } from '@/pages/Pricing';
import NotFound from '@/pages/not-found';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { getOnboardingComplete } from '@/lib/storage';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: 'hsl(222 47% 25%)',
    colorForeground: 'hsl(222 47% 11%)',
    colorMutedForeground: 'hsl(215.4 16.3% 46.9%)',
    colorBackground: 'hsl(210 20% 98%)',
    colorInput: 'hsl(214 32% 88%)',
    colorInputForeground: 'hsl(222 47% 11%)',
    colorDanger: 'hsl(0 84.2% 60.2%)',
    colorNeutral: 'hsl(214 20% 76%)',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-foreground font-serif text-2xl font-bold',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButtonText: 'text-foreground',
    formFieldLabel: 'text-foreground',
    footerActionLink: 'text-primary hover:text-primary/90',
    footerActionText: 'text-muted-foreground',
    dividerText: 'text-muted-foreground',
    identityPreviewEditButton: 'text-primary',
    formFieldSuccessText: 'text-chart-3',
    alertText: 'text-destructive',
    logoBox: 'flex justify-center',
    logoImage: 'h-10 w-auto',
    socialButtonsBlockButton: 'border-border hover:bg-accent',
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    formFieldInput: 'bg-input text-foreground border border-input focus:ring-2 focus:ring-ring/50',
    footerAction: 'text-muted-foreground',
    dividerLine: 'bg-border',
    alert: 'bg-destructive/10 text-destructive border-destructive',
    otpCodeFieldInput: 'bg-input text-foreground border border-input shadow-sm focus:ring-2 focus:ring-ring/50',
    formFieldRow: 'gap-4',
    main: 'gap-6',
  },
};

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function OnboardingGate() {
  const [complete, setComplete] = useState(() => getOnboardingComplete());

  return (
    <Show when="signed-in">
      {!complete && <Onboarding onComplete={() => setComplete(true)} />}
    </Show>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={Login} />
      <Route path="/sign-up/*?" component={Register} />
      <Route path="/demo" component={Demo} />
      <Route path="/faq" component={Faq} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        <AuthGate>
          <Dashboard />
        </AuthGate>
      </Route>
      <Route path="/settings">
        <AuthGate>
          <Settings />
        </AuthGate>
      </Route>
      <Route path="/profile">
        <AuthGate>
          <Profile />
        </AuthGate>
      </Route>
      <Route path="/documents">
        <AuthGate>
          <Documents />
        </AuthGate>
      </Route>
      <Route path="/tasks">
        <AuthGate>
          <Tasks />
        </AuthGate>
      </Route>
      <Route path="/calendar">
        <AuthGate>
          <Calendar />
        </AuthGate>
      </Route>
      <Route path="/ai-tools">
        <AuthGate>
          <AiTools />
        </AuthGate>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={clerkRuLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <OnboardingGate />
      <AppRouter />
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={basePath}>
              <ClerkProviderWithRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
