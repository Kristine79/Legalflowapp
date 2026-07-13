import { useEffect } from 'react';
import { SignUp } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function patchClerkAutocomplete() {
  document.querySelectorAll('input[name="emailAddress"], input[type="email"]').forEach((el) => {
    if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'email');
  });
  document.querySelectorAll('input[type="password"]').forEach((el, i) => {
    if (!el.getAttribute('autocomplete'))
      el.setAttribute('autocomplete', i === 0 ? 'new-password' : 'new-password');
  });
}

export function Register() {
  useEffect(() => {
    patchClerkAutocomplete();
    const observer = new MutationObserver(patchClerkAutocomplete);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}
