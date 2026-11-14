import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import neo4j, { Driver, ManagedTransaction, QueryResult, Record as Neo4jRecord, Session } from 'neo4j-driver';

export type CypherParams = Record<string, unknown>;

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private readonly driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI ?? 'bolt://localhost:7687',
      neo4j.auth.basic(process.env.NEO4J_USERNAME ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'jobmatch-local-password'),
    );
  }

  async read<T>(query: string, params: CypherParams = {}, map: (record: Neo4jRecord) => T): Promise<T[]> {
    return this.execute('READ', query, params, (result) => result.records.map((record) => value(map(record)) as T));
  }

  async write<T>(query: string, params: CypherParams = {}, map: (record: Neo4jRecord) => T): Promise<T[]> {
    return this.execute('WRITE', query, params, (result) => result.records.map((record) => value(map(record)) as T));
  }

  async transaction<T>(work: (tx: ManagedTransaction) => Promise<T>): Promise<T> {
    try {
      const session = this.driver.session();
      try { return await session.executeWrite(work); } finally { await session.close(); }
    } catch (error) { throw this.databaseError(error); }
  }

  async profile(query: string, params: CypherParams): Promise<{ rows: Record<string, unknown>[]; elapsedMs: number; plan: unknown }> {
    const started = performance.now();
    try {
      const session = this.driver.session();
      try {
        const result = await session.run(`PROFILE ${query}`, params);
        return { rows: result.records.map(toObject), elapsedMs: Math.round((performance.now() - started) * 100) / 100, plan: result.summary.profile ?? null };
      } finally { await session.close(); }
    } catch (error) { throw this.databaseError(error); }
  }

  async onModuleDestroy(): Promise<void> { await this.driver.close(); }

  private async execute<T>(accessMode: 'READ' | 'WRITE', query: string, params: CypherParams, map: (result: QueryResult) => T): Promise<T> {
    try {
      const session: Session = this.driver.session({ defaultAccessMode: accessMode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE });
      try { return map(await session.run(query, params)); } finally { await session.close(); }
    } catch (error) { throw this.databaseError(error); }
  }

  private databaseError(error: unknown): Error {
    const diagnostic = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    if (/ECONNREFUSED|ServiceUnavailable|Failed to connect|Connection acquisition|Could not perform discovery|Connection refused/i.test(diagnostic)) return new ServiceUnavailableException('Neo4j server nije dostupan. Pokrenite docker compose up -d.');
    return error instanceof Error ? error : new Error('Neo4j query failed');
  }
}

export function value(input: unknown): unknown {
  if (neo4j.isInt(input)) return input.toNumber();
  if (Array.isArray(input)) return input.map((entry) => value(entry));
  if (input && typeof input === 'object' && 'properties' in input) return value((input as { properties: unknown }).properties);
  if (input && typeof input === 'object') return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([key, nested]) => [key, value(nested)]));
  return input;
}

export function toObject(record: Neo4jRecord): Record<string, unknown> { return Object.fromEntries(record.keys.map((key) => [key, value(record.get(key))])); }
