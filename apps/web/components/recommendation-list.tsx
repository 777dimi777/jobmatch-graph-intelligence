'use client';

import { AlertTriangle, Building2, CheckCircle2, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserApiBase } from '../lib/api';
import { ApplyButton } from './apply-button';

type Recommendation = { job: { id: string; title: string; level: string; workMode: string; salaryMin: number; salaryMax: number }; company: { name: string }; location: { name: string } | null; score: number; matchedWeight: number; totalWeight: number; missingMandatory: number; missingSkills: string[]; matchedSkills: string[] };

export function RecommendationList() {
  const [id, setId] = useState('candidate-1');
  const [include, setInclude] = useState(false);
  const [data, setData] = useState<Recommendation[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${browserApiBase}/recommendations/${encodeURIComponent(id)}?includeUnqualified=${include}`);
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) throw new Error(typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : 'Preporuke nisu dostupne.');
      setData(payload as Recommendation[]);
    } catch (cause) { setData([]); setError(cause instanceof Error ? cause.message : 'Preporuke nisu dostupne.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [include]);

  return <div>
    <div className="recommendation-intro"><Sparkles size={21}/><div><b>Objašnjive preporuke</b><span>Skor poredi kandidatove veštine sa ponderisanim zahtevima posla; ne predstavlja verovatnoću zaposlenja.</span></div></div>
    <div className="filters recommendation-controls"><label><small>ID kandidata</small><input value={id} onChange={(event) => setId(event.target.value)} aria-label="ID kandidata"/></label><label className="check-control"><input type="checkbox" checked={include} onChange={(event) => setInclude(event.target.checked)}/>Prikaži i oglase sa obaveznim nedostacima</label><button className="button primary" disabled={loading} onClick={() => void load()}>{loading ? 'Računanje…' : 'Izračunaj preporuke'}</button></div>
    {error && <div className="error graph-error"><span>{error}</span><button className="button" onClick={() => void load()}><RefreshCw size={15}/> Pokušaj ponovo</button></div>}
    {loading && <div className="recommendation-loading">Računam poklapanje veština sa aktivnim oglasima…</div>}
    {!loading && data.map((item, index) => <article className="recommendation-card" key={item.job.id}><div className="recommendation-rank">#{index + 1}</div><div className="recommendation-main"><div className="recommendation-heading"><div><Link className="recommendation-link" href={`/jobs/${item.job.id}`}><h3>{item.job.title}</h3></Link><p><Building2 size={14}/>{item.company.name}<span>•</span><MapPin size={14}/>{item.location?.name ?? 'Lokacija nije navedena'}<span>•</span>{item.job.workMode}</p></div><div className={`recommendation-score ${item.missingMandatory ? 'warning' : ''}`}><b>{item.score}%</b><small>poklapanje</small></div></div><div className="recommendation-meta"><span>{item.job.level}</span><span>{item.job.salaryMin.toLocaleString('sr-RS')}–{item.job.salaryMax.toLocaleString('sr-RS')} €</span><span>{item.matchedWeight}/{item.totalWeight} ponderisanih poena</span></div><div className="skill-columns"><div><b><CheckCircle2 size={15}/> Poklopljeno</b><p>{item.matchedSkills.length ? item.matchedSkills.join(' · ') : 'Nema registrovanih poklapanja'}</p></div><div className={item.missingSkills.length ? 'missing' : ''}><b>{item.missingSkills.length ? <AlertTriangle size={15}/> : <CheckCircle2 size={15}/>} {item.missingSkills.length ? 'Nedostaje' : 'Svi zahtevi pokriveni'}</b><p>{item.missingSkills.length ? item.missingSkills.join(' · ') : 'Kandidat poseduje sve potrebne veštine.'}</p></div></div><div className="recommendation-actions"><Link className="button" href={`/jobs/${item.job.id}`}>Pogledaj oglas</Link><ApplyButton jobId={item.job.id}/></div></div></article>)}
    {!loading && !error && !data.length && <div className="empty"><div className="empty-icon"><Sparkles size={22}/></div><b>Nema preporuka za ovaj profil</b><p>Proveri ID kandidata ili uključi oglase sa nedostajućim obaveznim veštinama.</p></div>}
  </div>;
}
