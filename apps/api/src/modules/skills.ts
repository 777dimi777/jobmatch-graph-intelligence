import { Controller, forwardRef, Get, Injectable, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService } from '../database/neo4j.service';

interface SkillsPort { list(search: string): Promise<unknown>; }
@ApiTags('Skills') @Controller('skills')
export class SkillsController { constructor(@Inject(forwardRef(() => SkillsService)) private readonly service: SkillsPort) {} @Get() list(@Query('search') search = '') { return this.service.list(search); } }
@Injectable()
export class SkillsService {
  constructor(private readonly db: Neo4jService) {}
  list(search: string) { return this.db.read(`MATCH (s:Skill) WHERE toLower(s.name) CONTAINS toLower($search)
    OPTIONAL MATCH (c:Candidate)-[:HAS_SKILL]->(s) OPTIONAL MATCH (j:Job)-[:REQUIRES_SKILL]->(s)
    WITH s, count(DISTINCT c) AS candidateCount, count(DISTINCT j) AS jobCount
    RETURN s { .id, .name, .category, candidateCount: candidateCount, jobCount: jobCount } AS skill ORDER BY skill.jobCount DESC, skill.name`, { search }, (record) => record.get('skill')); }
}
