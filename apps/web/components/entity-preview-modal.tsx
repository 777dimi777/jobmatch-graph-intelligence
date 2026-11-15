'use client';

import { Building2, BriefcaseBusiness, Mail, MapPin, UserRound, Wrench, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { browserApiBase } from '../lib/api';
import { ApplyButton } from './apply-button';

type Entity = Record<string, unknown>;
function endpoint(id: string) { if (id.startsWith('candidate-')) return 'candidates'; if (id.startsWith('job-')) return 'jobs'; if (id.startsWith('company-')) return 'companies'; return 'skills'; }
function Icon({ id }: { id: string }) { if (id.startsWith('candidate-')) return <UserRound/>; if (id.startsWith('job-')) return <BriefcaseBusiness/>; if (id.startsWith('company-')) return <Building2/>; return <Wrench/>; }

export function EntityPreviewModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController(); setEntity(null); setError('');
    void fetch(`${browserApiBase}/${endpoint(id)}/${id}`, { signal: controller.signal }).then(async (response) => {
      const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? 'Detalji nisu dostupni.'); return payload as Entity;
    }).then(setEntity).catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message ?? 'Detalji nisu dostupni.'); });
    return () => controller.abort();
  }, [id]);
  if (!id) return null;
  const title = String(entity?.name ?? entity?.title ?? 'Učitavanje…');
  const place = entity?.location as { name?: string } | null;
  const skills = (entity?.skills ?? entity?.requiredSkills) as { name: string }[] | undefined;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="entity-modal" role="dialog" aria-modal="true" aria-label="Brzi pregled" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Zatvori"><X size={20}/></button>{error ? <div className="error">{error}</div> : !entity ? <div className="modal-loading">Učitavanje osnovnih podataka…</div> : <><header className="entity-modal-head"><span className="entity-icon"><Icon id={id}/></span><div><p>Brzi pregled</p><h2>{title}</h2></div></header><div className="entity-facts">{Boolean(entity.title && entity.name) && <span><BriefcaseBusiness size={15}/>{String(entity.title)}</span>}{Boolean(entity.email) && <span><Mail size={15}/>{String(entity.email)}</span>}{Boolean(place?.name) && <span><MapPin size={15}/>{String(place?.name)}</span>}{Boolean(entity.category) && <span><Wrench size={15}/>{String(entity.category)}</span>}{Boolean(entity.company) && <span><Building2 size={15}/>{String((entity.company as { name?: string }).name ?? '')}</span>}</div>{Boolean(entity.bio) && <p className="entity-bio">{String(entity.bio)}</p>}{skills && skills.length > 0 && <div className="tag-list">{skills.slice(0, 8).map((skill) => <span className="tag" key={skill.name}>{skill.name}</span>)}</div>}{id.startsWith('job-') && <div className="modal-actions"><ApplyButton jobId={id}/></div>}</>}</section></div>;
}
