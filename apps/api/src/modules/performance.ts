import { Controller, forwardRef, Get, Injectable, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService } from '../database/neo4j.service';

const benchmarkQueries = {
  candidateById: { title: 'Kandidat po ID-u', query: 'MATCH (candidate:Candidate {id:$candidateId}) RETURN candidate', params: { candidateId: 'candidate-1' }, index: 'candidate_id_unique' },
  candidateBySkill: { title: 'Kandidati sa vestinom', query: 'MATCH (skill:Skill {name:$skillName})<-[:HAS_SKILL]-(candidate:Candidate) RETURN candidate LIMIT 100', params: { skillName: 'React' }, index: 'skill_name' },
  shortestPath: { title: 'Najkraca putanja', query: 'MATCH (a:Candidate {id:$from}), (b:Candidate {id:$to}) MATCH path=shortestPath((a)-[:KNOWS*..6]-(b)) RETURN path', params: { from: 'candidate-1', to: 'candidate-20' }, index: 'candidate_id_unique' },
  topSkills: { title: 'Analitika trazenih vestina', query: 'MATCH (:Job {active:true})-[:REQUIRES_SKILL]->(skill:Skill) RETURN skill.name, count(*) AS demand ORDER BY demand DESC LIMIT 10', params: {}, index: 'job_active_created' },
};
interface PerformancePort { profile(id: string): Promise<unknown>; }
@ApiTags('Performance') @Controller('performance')
export class PerformanceController { constructor(@Inject(forwardRef(() => PerformanceService)) private readonly service: PerformancePort) {} @Get() catalogue() { return Object.entries(benchmarkQueries).map(([id, data]) => ({ id, ...data })); } @Get('profile') profile(@Query('query') query = 'candidateById') { return this.service.profile(query); } }
@Injectable()
export class PerformanceService { constructor(private readonly db: Neo4jService) {} async profile(id: string) { const selected = benchmarkQueries[id as keyof typeof benchmarkQueries]; if (!selected) return { error: 'Nepoznat benchmark' }; const result = await this.db.profile(selected.query, selected.params); return { id, title: selected.title, expectedIndex: selected.index, elapsedMs: result.elapsedMs, resultCount: result.rows.length, plan: result.plan }; } }
