import { Controller, forwardRef, Get, Injectable, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService, value } from '../database/neo4j.service';

interface GraphPort { subgraph(id: string, depth: number): Promise<unknown>; shortestPath(from: string, to: string): Promise<unknown>; mutual(first: string, second: string): Promise<unknown>; suggestions(id: string): Promise<unknown>; }
@ApiTags('Graph') @Controller('graph')
export class GraphController { constructor(@Inject(forwardRef(() => GraphService)) private readonly service: GraphPort) {} @Get('subgraph/:id') subgraph(@Param('id') id: string, @Query('depth') depth = '2') { return this.service.subgraph(id, Number(depth)); } @Get('shortest-path') shortest(@Query('from') from: string, @Query('to') to: string) { return this.service.shortestPath(from, to); } @Get('mutual/:first/:second') mutual(@Param('first') first: string, @Param('second') second: string) { return this.service.mutual(first, second); } @Get('contact-suggestions/:id') suggestions(@Param('id') id: string) { return this.service.suggestions(id); } }
@Injectable()
export class GraphService {
  constructor(private readonly db: Neo4jService) {}
  async subgraph(id: string, requestedDepth: number) {
    const depth = Math.max(1, Math.min(3, Number.isFinite(requestedDepth) ? Math.floor(requestedDepth) : 2));
    // Dubina i broj vracenih cvorova su ograniceni da vizuelizacija ostane citljiva.
    const query = `MATCH (root {id:$id})
      CALL { WITH root MATCH path=(root)-[*1..${depth}]-(node)
        WITH node, min(length(path)) AS distance
        ORDER BY distance, coalesce(node.name, node.title, node.id) LIMIT 45
        RETURN collect(DISTINCT node) AS discovered }
      WITH root, CASE WHEN root IN discovered THEN discovered ELSE discovered + root END AS nodes
      UNWIND nodes AS sourceNode MATCH (sourceNode)-[rel]-(targetNode) WHERE targetNode IN nodes
      RETURN nodes, collect(DISTINCT { source:startNode(rel).id, target:endNode(rel).id, type:type(rel), properties:properties(rel) }) AS relationships`;
    const rows = await this.db.read(query, { id }, (record) => ({ nodes: value(record.get('nodes')) as { id: string; name?: string; title?: string }[], relationships: value(record.get('relationships')) as { source: string; target: string; type: string; properties: Record<string, unknown> }[] }));
    if (!rows[0]) throw new NotFoundException('Polazni cvor nije pronadjen');
    const label = (node: { id: string; name?: string; title?: string }) => {
      const value = node.name ?? node.title ?? node.id;
      return value.length > 24 ? `${value.slice(0, 21)}…` : value;
    };
    return { nodes: rows[0].nodes.map((node) => ({ data: { ...node, label: label(node) } })), edges: rows[0].relationships.map((relationship) => ({ data: { id: `${relationship.source}-${relationship.type}-${relationship.target}`, source: relationship.source, target: relationship.target, label: relationship.type, ...relationship.properties } })) };
  }
  shortestPath(from: string, to: string) { return this.db.read(`CALL { MATCH (a:Candidate) WHERE toLower(a.name) = toLower($from) OR a.id = $from RETURN a ORDER BY a.name LIMIT 1 }
    CALL { MATCH (b:Candidate) WHERE toLower(b.name) = toLower($to) OR b.id = $to RETURN b ORDER BY b.name LIMIT 1 }
    MATCH path = shortestPath((a)-[:KNOWS*..6]-(b))
    RETURN [node IN nodes(path) | node { .id, .name, .title }] AS nodes, length(path) AS distance`, { from, to }, (record) => ({ nodes: record.get('nodes'), distance: record.get('distance') })); }
  mutual(first: string, second: string) { return this.db.read('MATCH (a:Candidate {id:$first})-[:KNOWS]-(common:Candidate)-[:KNOWS]-(b:Candidate {id:$second}) WHERE common <> a AND common <> b RETURN DISTINCT common { .id, .name, .title } AS candidate ORDER BY candidate.name LIMIT 30', { first, second }, (record) => record.get('candidate')); }
  suggestions(id: string) { return this.db.read(`MATCH (candidate:Candidate {id:$id})-[:KNOWS]-(mutual:Candidate)-[:KNOWS]-(suggestion:Candidate)
    WHERE suggestion <> candidate AND NOT (candidate)-[:KNOWS]-(suggestion)
    WITH suggestion, count(DISTINCT mutual) AS mutualContacts
    RETURN suggestion { .id, .name, .title } AS candidate, mutualContacts ORDER BY mutualContacts DESC LIMIT 10`, { id }, (record) => ({ candidate: record.get('candidate'), mutualContacts: record.get('mutualContacts') })); }
}
