import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { api } from '../lib/api';
import { HeaderActions } from '../components/header-actions';
export const metadata: Metadata = { title: 'JobMatch Graph Intelligence', description: 'Neo4j graf baza za preporuku poslova i profesionalne mreze.' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { let relationships: number | undefined; try { relationships = (await api<{ relationships:number }>('/analytics/overview')).relationships; } catch { relationships = undefined; } return <html lang="sr"><body><div className="app-shell"><Sidebar relationships={relationships}/><main className="main"><header className="topbar"><div><h1>Pregled sistema</h1><p>Analiza trzista rada, preporuke i profesionalna mreza zasnovana na Neo4j graf bazi</p></div><HeaderActions/></header>{children}</main></div></body></html>; }
