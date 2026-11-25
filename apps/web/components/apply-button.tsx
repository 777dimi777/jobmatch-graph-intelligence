'use client';

import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import { browserApiBase } from '../lib/api';
import { CURRENT_CANDIDATE_ID } from '../lib/current-candidate';

const statusLabel: Record<string, string> = { submitted: 'Prijava poslata', reviewed: 'Prijava u pregledu', rejected: 'Prijava zatvorena', accepted: 'Prijava prihvaćena' };

export function ApplyButton({ jobId, applicationStatus, compact = false }: { jobId: string; applicationStatus?: string | null; compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(applicationStatus ? 'done' : 'idle');
  const apply = async () => {
    setState('sending');
    try {
      const response = await fetch(`${browserApiBase}/applications`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ candidateId: CURRENT_CANDIDATE_ID, jobId }) });
      if (!response.ok) throw new Error();
      setState('done');
    } catch { setState('error'); }
  };
  if (state === 'done') return <span className="application-done"><CheckCircle2 size={16}/> {statusLabel[applicationStatus ?? 'submitted'] ?? 'Prijava evidentirana'}</span>;
  return <button className={`button primary ${compact ? 'compact-button' : ''}`} disabled={state === 'sending'} onClick={() => void apply()}><Send size={15}/> {state === 'sending' ? 'Slanje…' : state === 'error' ? 'Pokušaj ponovo' : 'Prijavi se'}</button>;
}
