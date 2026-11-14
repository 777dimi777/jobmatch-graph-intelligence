import { Body, Controller, forwardRef, Get, Injectable, Inject, NotFoundException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import { Neo4jService } from '../database/neo4j.service';

type QueryDefinition = { id: string; title: string; purpose: string; cypher: string; defaults: Record<string, unknown> };
const catalogue: QueryDefinition[] = [
  { id: 'skills-demand', title: 'Najtrazenije vestine', purpose: 'Agregira aktivne oglase po trazenoj vestini.', cypher: 'MATCH (:Job {active:true})-[:REQUIRES_SKILL]->(skill:Skill) RETURN skill.name AS skill, count(*) AS demand ORDER BY demand DESC LIMIT toInteger($limit)', defaults: { limit: 10 } },
  { id: 'mutual-contacts', title: 'Zajednicki poznanici', purpose: 'Nalazi zajednicke kontakte dve osobe kroz dva KNOWS odnosa.', cypher: 'MATCH (a:Candidate {id:$first})-[:KNOWS]-(mutual:Candidate)-[:KNOWS]-(b:Candidate {id:$second}) RETURN DISTINCT mutual.name AS mutualContact LIMIT 30', defaults: { first: 'candidate-1', second: 'candidate-2' } },
  { id: 'candidate-skills', title: 'Vestine kandidata', purpose: 'Prikazuje relacijska svojstva HAS_SKILL.', cypher: 'MATCH (candidate:Candidate {id:$candidateId})-[relationship:HAS_SKILL]->(skill:Skill) RETURN candidate.name AS candidate, skill.name AS skill, relationship.level AS level, relationship.yearsOfExperience AS years ORDER BY level DESC', defaults: { candidateId: 'candidate-1' } },
  { id: 'shortest-path', title: 'Najkraca profesionalna putanja', purpose: 'Ogranicena shortestPath pretraga kroz KNOWS mrezu.', cypher: 'MATCH (a:Candidate {id:$from}), (b:Candidate {id:$to}) MATCH path=shortestPath((a)-[:KNOWS*..6]-(b)) RETURN [node IN nodes(path) | node.name] AS path, length(path) AS hops', defaults: { from: 'candidate-1', to: 'candidate-20' } },
];
class ExecuteQueryDto { @IsString() id!: string; @IsObject() params!: Record<string, unknown>; }
interface QueriesPort { execute(id: string, params: Record<string, unknown>): Promise<unknown>; }
@ApiTags('Query catalogue') @Controller('queries')
export class QueriesController { constructor(@Inject(forwardRef(() => QueriesService)) private readonly service: QueriesPort) {} @Get() list() { return catalogue; } @Post('execute') execute(@Body() body: ExecuteQueryDto) { return this.service.execute(body.id, body.params); } }
@Injectable()
export class QueriesService { constructor(private readonly db: Neo4jService) {} async execute(id: string, params: Record<string, unknown>) { const selected = catalogue.find((query) => query.id === id); if (!selected) throw new NotFoundException('Nepoznat pripremljeni upit'); const result = await this.db.profile(selected.cypher, { ...selected.defaults, ...params }); return { ...selected, ...result, resultCount: result.rows.length }; } }
