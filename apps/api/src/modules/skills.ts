import { Controller, forwardRef, Get, Injectable, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService } from '../database/neo4j.service';
import { hasSearchTerm } from './search-policy';

interface SkillsPort { list(search: string): Promise<unknown>; detail(id: string): Promise<unknown>; }
@ApiTags('Skills') @Controller('skills')
export class SkillsController { constructor(@Inject(forwardRef(() => SkillsService)) private readonly service: SkillsPort) {} @Get() list(@Query('search') search = '') { return this.service.list(search); } @Get(':id') detail(@Param('id') id: string) { return this.service.detail(id); } }
@Injectable()
export class SkillsService {
  constructor(private readonly db: Neo4jService) {}
  list(search: string) { if (!hasSearchTerm(search)) return Promise.resolve([]); return this.db.read(`MATCH (s:Skill) WHERE toLower(s.name) CONTAINS toLower($search)
    OPTIONAL MATCH (c:Candidate)-[:HAS_SKILL]->(s) OPTIONAL MATCH (j:Job)-[:REQUIRES_SKILL]->(s)
    WITH s, count(DISTINCT c) AS candidateCount, count(DISTINCT j) AS jobCount
    RETURN s { .id, .name, .category, candidateCount: candidateCount, jobCount: jobCount } AS skill ORDER BY skill.jobCount DESC, skill.name`, { search }, (record) => record.get('skill')); }
  async detail(id: string) { const rows = await this.db.read(`MATCH (s:Skill {id:$id}) OPTIONAL MATCH (c:Candidate)-[:HAS_SKILL]->(s) OPTIONAL MATCH (j:Job {active:true})-[:REQUIRES_SKILL]->(s)
    WITH s, count(DISTINCT c) AS candidateCount, count(DISTINCT j) AS jobCount
    RETURN s { .id, .name, .category, candidateCount:candidateCount, jobCount:jobCount } AS skill`, { id }, (record) => record.get('skill')); if (!rows[0]) throw new NotFoundException('Vestina nije pronadjena'); return rows[0]; }
}
