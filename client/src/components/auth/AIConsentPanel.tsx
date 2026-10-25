import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
export function AIConsentPanel({ settings = false }: { settings?: boolean }) {
  const { user, setAIConsent } = useAuth();
  const { data, isError, refetch } = usePublicConfig();
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const [consentRequired, setConsentRequired] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const showConsent = () => {
      setConsentRequired(true);
      void refetch();
    };
    window.addEventListener('ai:consent-required', showConsent);
    return () => window.removeEventListener('ai:consent-required', showConsent);
  }, [refetch]);
  useEffect(() => {
    if (consentRequired) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [consentRequired]);
  if (data?.aiEnabled === false) return <section className="workspace-panel mb-6 p-5" aria-label="AI availability"><h2 className="text-sm font-semibold">Test preview</h2><p className="mt-2 text-xs leading-6 text-[var(--muted)]">AI feedback is temporarily disabled. You can still manage resumes and applications; please use synthetic test information.</p></section>;
  const accepted = !consentRequired && !!data && user?.aiConsentVersion === data.consentVersion;
  if (accepted && !settings) return null;
  async function update(accept: boolean) {
    setBusy(true);
    try { await setAIConsent(accept); setConsentRequired(false); setAgree(false); toast.success(accept ? 'AI data use accepted. You can run the check again.' : 'New AI processing is disabled.'); }
    catch { toast.error('Could not update your agreement. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section ref={panelRef} className="workspace-panel mb-6 p-5" aria-label="AI data use"><h2 className="text-sm font-semibold">{consentRequired ? 'Review AI data use to continue' : 'Your data, your choice'}</h2><p className="mt-2 text-xs leading-6 text-[var(--muted)]">AI feedback may send resume text, job descriptions and practice answers to the configured AI services, including another service during automatic fallback. Review the <Link to="/privacy" className="text-[var(--accent)] underline">privacy and processor details</Link> before enabling it.</p>{accepted ? <Button className="mt-3" size="sm" variant="secondary" isLoading={busy} onClick={() => update(false)}>Withdraw AI processing agreement</Button> : <><label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-0.5" />I have reviewed the data-use notice and agree to AI processing.</label><Button className="mt-3" size="sm" disabled={!agree || !data || isError} isLoading={busy} onClick={() => update(true)}>Enable AI feedback</Button></>}</section>;
}
