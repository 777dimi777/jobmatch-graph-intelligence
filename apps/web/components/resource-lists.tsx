'use client';

import { BriefcaseBusiness, Building2, RefreshCw, Search, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { browserApiBase } from '../lib/api';
import { EntityPreviewModal } from './entity-preview-modal';
import { isSearchReady, MINIMUM_SEARCH_LENGTH } from '../lib/search-policy';

const base = browserApiBase;

type Candidate = { id: string; name: string; email: string; title: string; experienceYears: number; skillCount: number };
type Job = { id: string; title: string; level: string; workMode: string; salaryMin: number; salaryMax: number; company: { name: string }; location?: { name: string }; skillCount: number };
type Company = { id: string; name: string; industry: string; size: number; activeJobs: number };
type Skill = { id: string; name: string; category: string; candidateCount: number; jobCount: number };

function useData<T>(path: string, enabled: boolean) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!enabled) { setData([]); setError(''); setLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`${base}${path}`, { signal: controller.signal });
        const payload = await response.json().catch(() => null) as unknown;
        if (!response.ok) throw new Error(typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : 'Server nije vratio podatke.');
        if (active) { setData(payload as T[]); setError(''); }
      } catch (cause) {
        if (active && !(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'Greska pri ucitavanju.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [path, refresh, enabled]);

  return { data, error, loading, reload: () => setRefresh((value) => value + 1) };
}

function Toolbar({ value, onChange, placeholder, count }: { value: string; onChange: (value: string) => void; placeholder: string; count: number }) {
  return <div className="catalog-head"><div className="filters"><Search size={18} className="muted"/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/></div><span className="catalog-caption">Prikazano: <b>{count}</b></span></div>;
}

function LoadingTable() { return <div aria-label="Podaci se ucitavaju">{Array.from({ length: 6 }, (_, index) => <div className="loading-row" key={index}/>)}</div>; }

function Failure({ message, reload }: { message: string; reload: () => void }) {
  return <div className="empty"><div className="empty-icon"><RefreshCw size={22}/></div><b>Podaci trenutno nisu dostupni</b><p className="muted">{message}</p><button className="button" onClick={reload}><RefreshCw size={15} className="inline mr-1"/>Pokušaj ponovo</button></div>;
}

function Empty({ label }: { label: string }) { return <div className="empty"><div className="empty-icon"><Search size={22}/></div><b>Pretraga je spremna</b><p>{label}</p></div>; }

export function CandidatesList() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); const ready = isSearchReady(search);
  const { data, error, loading, reload } = useData<Candidate>(`/candidates?search=${encodeURIComponent(search)}`, ready);
  return <section className="catalog-card"><Toolbar value={search} onChange={setSearch} placeholder={`Unesi najmanje ${MINIMUM_SEARCH_LENGTH} slova imena ili pozicije`} count={data.length}/>{loading ? <LoadingTable/> : error ? <Failure message={error} reload={reload}/> : data.length ? <table className="table"><thead><tr><th>Kandidat</th><th>Trenutna pozicija</th><th>Iskustvo</th><th>Portfolio veština</th></tr></thead><tbody>{data.map((item) => <tr key={item.id}><td><div className="identity"><span className="identity-icon"><Users size={17}/></span><span><button className="entity-trigger identity-name" onClick={() => setSelected(item.id)}>{item.name}</button><span className="identity-subtitle">{item.email}</span></span></div></td><td><b>{item.title}</b></td><td><span className="mode-badge">{item.experienceYears} god. iskustva</span></td><td><span className="metric">{item.skillCount}</span> povezane veštine</td></tr>)}</tbody></table> : <Empty label={ready ? 'Nema rezultata za ovaj upit.' : `Upiši najmanje ${MINIMUM_SEARCH_LENGTH} karaktera — podaci se tada preuzimaju sa servera.`}/>}<EntityPreviewModal id={selected} onClose={() => setSelected(null)}/></section>;
}

export function JobsList() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); const ready = isSearchReady(search);
  const { data, error, loading, reload } = useData<Job>(`/jobs?search=${encodeURIComponent(search)}`, ready);
  return <section className="catalog-card"><Toolbar value={search} onChange={setSearch} placeholder="Unesi najmanje 2 slova naziva posla" count={data.length}/>{loading ? <LoadingTable/> : error ? <Failure message={error} reload={reload}/> : data.length ? <table className="table"><thead><tr><th>Otvorena pozicija</th><th>Kompanija i lokacija</th><th>Tražene veštine</th><th>Način rada</th></tr></thead><tbody>{data.map((item) => <tr key={item.id}><td><div className="identity"><span className="identity-icon amber"><BriefcaseBusiness size={17}/></span><span><button className="entity-trigger identity-name" onClick={() => setSelected(item.id)}>{item.title}</button><span className="identity-subtitle">{item.level} · {item.salaryMin.toLocaleString('sr-RS')}–{item.salaryMax.toLocaleString('sr-RS')} €</span></span></div></td><td><b>{item.company.name}</b><span className="identity-subtitle">{item.location?.name ?? 'Lokacija nije navedena'}</span></td><td><span className="metric">{item.skillCount}</span> zahteva</td><td><span className="mode-badge">{item.workMode}</span></td></tr>)}</tbody></table> : <Empty label={ready ? 'Nema aktivnih oglasa za ovaj upit.' : 'Upiši najmanje dva karaktera za server pretragu.'}/>}<EntityPreviewModal id={selected} onClose={() => setSelected(null)}/></section>;
}

export function CompaniesList() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); const ready = isSearchReady(search);
  const { data, error, loading, reload } = useData<Company>(`/companies?search=${encodeURIComponent(search)}`, ready);
  return <section className="catalog-card"><Toolbar value={search} onChange={setSearch} placeholder="Unesi najmanje 2 slova kompanije" count={data.length}/>{loading ? <LoadingTable/> : error ? <Failure message={error} reload={reload}/> : data.length ? <table className="table"><thead><tr><th>Kompanija</th><th>Industrija</th><th>Veličina tima</th><th>Aktivni oglasi</th></tr></thead><tbody>{data.map((item) => <tr key={item.id}><td><div className="identity"><span className="identity-icon green"><Building2 size={17}/></span><button className="entity-trigger identity-name" onClick={() => setSelected(item.id)}>{item.name}</button></div></td><td><span className="mode-badge">{item.industry ?? 'Nije navedena'}</span></td><td><span className="metric">{item.size.toLocaleString('sr-RS')}</span> zaposlenih</td><td><span className="pill">{item.activeJobs} otvoreno</span></td></tr>)}</tbody></table> : <Empty label={ready ? 'Nema kompanija za ovaj upit.' : 'Upiši najmanje dva karaktera za server pretragu.'}/>}<EntityPreviewModal id={selected} onClose={() => setSelected(null)}/></section>;
}

export function SkillsList() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); const ready = isSearchReady(search);
  const { data, error, loading, reload } = useData<Skill>(`/skills?search=${encodeURIComponent(search)}`, ready);
  return <section className="catalog-card"><Toolbar value={search} onChange={setSearch} placeholder="Unesi najmanje 2 slova veštine" count={data.length}/>{loading ? <LoadingTable/> : error ? <Failure message={error} reload={reload}/> : data.length ? <table className="table"><thead><tr><th>Veština</th><th>Kategorija</th><th>Kandidati</th><th>Potražnja poslova</th></tr></thead><tbody>{data.map((item) => <tr key={item.id}><td><div className="identity"><span className="identity-icon violet"><Wrench size={17}/></span><button className="entity-trigger identity-name" onClick={() => setSelected(item.id)}>{item.name}</button></div></td><td><span className="mode-badge">{item.category}</span></td><td><span className="metric">{item.candidateCount}</span> profila</td><td><span className={`pill ${item.jobCount ? '' : 'yellow'}`}>{item.jobCount} oglasa</span></td></tr>)}</tbody></table> : <Empty label={ready ? 'Nema veština za ovaj upit.' : 'Upiši najmanje dva karaktera za server pretragu.'}/>}<EntityPreviewModal id={selected} onClose={() => setSelected(null)}/></section>;
}
