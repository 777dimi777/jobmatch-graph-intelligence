'use client';

import { Route, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { browserApiBase } from '../lib/api';

type PathResult = { nodes: { name: string; title: string }[]; distance: number };
export function NetworkTools() {
  const [from, setFrom] = useState('Marko Petrovic'); const [to, setTo] = useState('Ana Petrovic'); const [result, setResult] = useState<PathResult[] | null>(null); const [error, setError] = useState('');
  const find = async () => { try { const response = await fetch(`${browserApiBase}/graph/shortest-path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? 'Putanja nije pronađena.'); setResult(payload); setError(''); } catch (cause) { setResult(null); setError(cause instanceof Error ? cause.message : 'Putanja nije pronađena.'); } };
  return <article className="card panel-body"><div className="network-title"><span><Route size={19}/> Najkraća putanja kroz KNOWS mrežu</span><small>Pretraga se radi po imenima kandidata</small></div><div className="filters network-controls"><label>Od<input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="Ime prvog kandidata"/></label><label>Do<input value={to} onChange={(event) => setTo(event.target.value)} placeholder="Ime drugog kandidata"/></label><button className="button primary" onClick={() => void find()}>Pronađi putanju</button></div>{error && <p className="error">{error}</p>}{result?.[0] && <div className="path-result"><UsersRound size={18}/><div><b>{result[0].distance} koraka u mreži</b><p>{result[0].nodes.map((node) => node.name).join(' → ')}</p></div></div>}{result && !result[0] && <p className="muted">Ne postoji putanja u ograničenju od šest koraka.</p>}</article>;
}
