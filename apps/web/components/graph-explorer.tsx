'use client';

import CytoscapeComponent from 'react-cytoscapejs';
import { Box, Network, RefreshCw, Route, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { browserApiBase } from '../lib/api';
import { EntityPreviewModal } from './entity-preview-modal';

type Element = { data: Record<string, string | number | boolean> };
type Graph = { nodes: Element[]; edges: Element[] };

export function GraphExplorer({ initialId = 'candidate-1' }: { initialId?: string }) {
  const [id, setId] = useState(initialId);
  const [depth, setDepth] = useState('2');
  const [graph, setGraph] = useState<Graph | null>(null);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError(''); setSelected(null);
    try {
      const response = await fetch(`${browserApiBase}/graph/subgraph/${encodeURIComponent(id)}?depth=${depth}`);
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) throw new Error(typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : 'Graf nije dostupan.');
      setGraph(payload as Graph);
    } catch (cause) { setGraph(null); setError(cause instanceof Error ? cause.message : 'Graf nije dostupan.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const style = useMemo(() => [
    { selector: 'node', style: { label: 'data(label)', color: '#172033', 'text-valign': 'bottom', 'text-wrap': 'wrap', 'text-max-width': '82px', 'text-margin-y': 7, 'font-size': '10px', 'background-color': '#3b82f6', width: 42, height: 42 } },
    { selector: 'node[id ^= "skill-"]', style: { 'background-color': '#8b5cf6' } },
    { selector: 'node[id ^= "job-"]', style: { 'background-color': '#f59e0b', shape: 'round-rectangle', width: 62 } },
    { selector: 'node[id ^= "company-"]', style: { 'background-color': '#10b981', shape: 'round-rectangle', width: 58 } },
    { selector: 'node[id ^= "location-"]', style: { 'background-color': '#14b8a6' } },
    { selector: 'edge', style: { width: 1.3, 'line-color': '#9aa8be', 'target-arrow-color': '#9aa8be', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', label: 'data(label)', 'font-size': '7px', color: '#64748b' } },
  ], []);

  return <div>
    <div className="filters graph-controls"><input value={id} onChange={(event) => setId(event.target.value)} aria-label="ID početnog čvora" placeholder="npr. candidate-1"/><select value={depth} onChange={(event) => setDepth(event.target.value)} aria-label="Dubina grafa"><option value="1">Dubina 1 · neposredne veze</option><option value="2">Dubina 2 · preporučeno</option><option value="3">Dubina 3 · širi kontekst</option></select><button className="button primary" disabled={loading} onClick={() => void load()}>{loading ? 'Učitavanje…' : 'Učitaj graf'}</button></div>
    <div className="graph-insight"><span><Network size={16}/> Podgraf iz Neo4j baze</span>{graph && <><span><Box size={16}/> {graph.nodes.length} čvorova</span><span><Share2 size={16}/> {graph.edges.length} veza</span></>}</div>
    {error && <div className="error graph-error"><span>{error}</span><button className="button" onClick={() => void load()}><RefreshCw size={15}/> Pokušaj ponovo</button></div>}
    {loading && <div className="graph-loading">Učitavanje strukture grafa…</div>}
    {graph && !loading && <CytoscapeComponent elements={[...graph.nodes, ...graph.edges]} stylesheet={style} className="cy" layout={{ name: 'cose', animate: false, padding: 35 }} cy={(cy) => cy.on('tap', 'node,edge', (event) => { const data = event.target.data() as Record<string, unknown>; setSelected(data); if (event.target.isNode()) setPreviewId(String(data.id)); })}/>} 
    {!graph && !error && !loading && <div className="empty">Unesi početni čvor i učitaj podgraf.</div>}
    <div className="legend mt-3"><span className="candidate">Kandidat</span><span className="skill">Veština</span><span className="job">Posao</span><span className="company">Kompanija</span></div>
    {selected && <section className="selected-element"><div><Route size={17}/><b>{'id' in selected ? 'Klikni čvor za brzi pregled' : 'Izabrana veza'}</b></div><pre className="detail">{JSON.stringify(selected, null, 2)}</pre></section>}<EntityPreviewModal id={previewId} onClose={() => setPreviewId(null)}/>
  </div>;
}
