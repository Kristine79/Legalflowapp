import { useEffect } from 'react';
import { SignIn } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function patchClerkAutocomplete() {
  document.querySelectorAll('input[name="identifier"], input[type="email"]').forEach((el) => {
    if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'email');
  });
  document.querySelectorAll('input[type="password"]').forEach((el) => {
    if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'current-password');
  });
}

export function Login() {
  useEffect(() => {
    patchClerkAutocomplete();
    const observer = new MutationObserver(patchClerkAutocomplete);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}
