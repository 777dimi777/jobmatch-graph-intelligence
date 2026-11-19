'use client';

import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import { browserApiBase } from '../lib/api';
import { CURRENT_CANDIDATE_ID } from '../lib/current-candidate';

export function ApplyButton({ jobId, compact = false }: { jobId: string; compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const apply = async () => {
    setState('sending');
    try {
      const response = await fetch(`${browserApiBase}/applications`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ candidateId: CURRENT_CANDIDATE_ID, jobId }) });
      if (!response.ok) throw new Error();
      setState('done');
    } catch { setState('error'); }
  };
  if (state === 'done') return <span className="application-done"><CheckCircle2 size={16}/> Prijava poslata</span>;
  return <button className={`button primary ${compact ? 'compact-button' : ''}`} disabled={state === 'sending'} onClick={() => void apply()}><Send size={15}/> {state === 'sending' ? 'Slanje…' : state === 'error' ? 'Pokušaj ponovo' : 'Prijavi se'}</button>;
}
