import { Body, Controller, forwardRef, Get, Injectable, Inject, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { Neo4jService, value } from '../database/neo4j.service';

class JobInput { @IsString() title!: string; @IsString() description!: string; @IsString() level!: string; @IsInt() @Min(0) salaryMin!: number; @IsInt() @Min(0) salaryMax!: number; @IsString() workMode!: string; @IsBoolean() active!: boolean; @IsString() companyId!: string; @IsString() locationId!: string; @IsOptional() requiredSkills?: { skillId: string; mandatory: boolean; weight: number; minLevel: number }[]; }
interface JobsPort { list(search: string, active: boolean): Promise<unknown>; detail(id: string): Promise<unknown>; create(input: JobInput): Promise<unknown>; }
@ApiTags('Jobs') @Controller('jobs')
export class JobsController { constructor(@Inject(forwardRef(() => JobsService)) private readonly service: JobsPort) {} @Get() list(@Query('search') search = '', @Query('active') active = 'true') { return this.service.list(search, active !== 'false'); } @Get(':id') detail(@Param('id') id: string) { return this.service.detail(id); } @Post() create(@Body() body: JobInput) { return this.service.create(body); } }
@Injectable()
export class JobsService {
  constructor(private readonly db: Neo4jService) {}
  list(search: string, active: boolean) { if (search.trim().length < 2) return Promise.resolve([]); return this.db.read(`MATCH (j:Job {active:$active})-[:POSTED_BY]->(c:Company) OPTIONAL MATCH (j)-[:LOCATED_IN]->(l:Location) OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
    WHERE toLower(j.title) CONTAINS toLower($search)
    WITH j, c, head(collect(DISTINCT l { .id, .name })) AS location, count(DISTINCT s) AS skillCount
    RETURN j { .*, company: c { .id, .name }, location: location, skillCount: skillCount } AS job ORDER BY j.createdAt DESC`, { search, active }, (record) => record.get('job')); }
  async detail(id: string) { const rows = await this.db.read(`MATCH (j:Job {id:$id}) OPTIONAL MATCH (j)-[:POSTED_BY]->(c:Company) OPTIONAL MATCH (j)-[:LOCATED_IN]->(l:Location) OPTIONAL MATCH (j)-[r:REQUIRES_SKILL]->(s:Skill)
    WITH j, head(collect(DISTINCT c { .id, .name })) AS company, head(collect(DISTINCT l { .id, .name })) AS location, collect(DISTINCT s { .id, .name, .category, mandatory:r.mandatory, weight:r.weight, minLevel:r.minLevel }) AS requiredSkills
    RETURN j { .*, company: company, location: location, requiredSkills: requiredSkills } AS job`, { id }, (record) => record.get('job')); if (!rows[0]) throw new NotFoundException('Posao nije pronadjen'); return rows[0]; }
  async create(input: JobInput): Promise<Record<string, unknown>> { const id = `job-${randomUUID()}`; const rows = await this.db.transaction<Record<string, unknown>[]>(async (tx) => { const job = await tx.run(`MATCH (c:Company {id:$companyId}), (l:Location {id:$locationId}) CREATE (j:Job {id:$id,title:$title,description:$description,level:$level,salaryMin:$salaryMin,salaryMax:$salaryMax,workMode:$workMode,active:$active,createdAt:$createdAt})-[:POSTED_BY]->(c) CREATE (j)-[:LOCATED_IN]->(l) RETURN j`, { ...input, id, createdAt: new Date().toISOString() }); for (const skill of input.requiredSkills ?? []) await tx.run('MATCH (j:Job {id:$jobId}), (s:Skill {id:$skillId}) MERGE (j)-[r:REQUIRES_SKILL]->(s) SET r += $properties', { jobId: id, skillId: skill.skillId, properties: { mandatory: skill.mandatory, weight: skill.weight, minLevel: skill.minLevel } }); return job.records.map((record) => value(record.get('j')) as Record<string, unknown>); }); if (!rows[0]) throw new NotFoundException('Posao nije kreiran'); return rows[0]; }
}
