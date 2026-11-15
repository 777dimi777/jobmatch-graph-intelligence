import { Body, Controller, Delete, forwardRef, Get, Injectable, Inject, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { Neo4jService, value } from '../database/neo4j.service';

class CandidateInput {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() title!: string;
  @IsInt() @Min(0) @Max(60) experienceYears!: number;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() locationId?: string;
}
interface CandidatesPort { list(search: string, limit: number): Promise<unknown>; detail(id: string): Promise<unknown>; create(input: CandidateInput): Promise<unknown>; update(id: string, input: CandidateInput): Promise<unknown>; remove(id: string): Promise<unknown>; }

@ApiTags('Candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(@Inject(forwardRef(() => CandidatesService)) private readonly service: CandidatesPort) {}
  @Get() @ApiOperation({ summary: 'Pretraga kandidata' }) list(@Query('search') search = '', @Query('limit') limit = '30') { return this.service.list(search, Math.min(Number(limit) || 30, 100)); }
  @Get(':id') detail(@Param('id') id: string) { return this.service.detail(id); }
  @Post() create(@Body() body: CandidateInput) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: CandidateInput) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Injectable()
export class CandidatesService {
  constructor(private readonly db: Neo4jService) {}
  async list(search: string, limit: number) {
    if (search.trim().length < 2) return [];
    return this.db.read(`MATCH (c:Candidate) WHERE toLower(c.name) CONTAINS toLower($search) OR toLower(c.title) CONTAINS toLower($search)
      OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
      WITH c, count(s) AS skillCount
      RETURN c { .id, .name, .email, .title, .experienceYears, skillCount: skillCount } AS candidate ORDER BY candidate.name LIMIT toInteger($limit)`, { search, limit }, (record) => record.get('candidate'));
  }
  async detail(id: string) {
    const rows = await this.db.read(`MATCH (c:Candidate {id: $id})
      OPTIONAL MATCH (c)-[hs:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (c)-[:HAS_CERTIFICATION]->(cert:Certification)
      OPTIONAL MATCH (c)-[:LOCATED_IN]->(location:Location)
      OPTIONAL MATCH (c)-[:WORKS_AT]->(company:Company)
      WITH c,
        collect(DISTINCT s { .id, .name, .category, level: hs.level, yearsOfExperience: hs.yearsOfExperience }) AS skills,
        collect(DISTINCT cert { .id, .name, .issuer }) AS certifications,
        head(collect(DISTINCT location { .id, .name, .country })) AS location,
        head(collect(DISTINCT company { .id, .name })) AS company
      RETURN c { .*, skills: skills, certifications: certifications, location: location, company: company } AS candidate`, { id }, (record) => record.get('candidate'));
    if (!rows[0]) throw new NotFoundException('Kandidat nije pronadjen'); return rows[0];
  }
  async create(input: CandidateInput): Promise<Record<string, unknown>> {
    const id = `candidate-${randomUUID()}`; const now = new Date().toISOString();
    const rows = await this.db.transaction<Record<string, unknown>[]>(async (tx) => {
      const result = await tx.run(`CREATE (c:Candidate {id:$id, name:$name, email:$email, title:$title, experienceYears:$experienceYears, bio:$bio, createdAt:$createdAt})
        WITH c OPTIONAL MATCH (l:Location {id:$locationId}) FOREACH (_ IN CASE WHEN l IS NULL THEN [] ELSE [1] END | MERGE (c)-[:LOCATED_IN]->(l)) RETURN c`, { id, ...input, bio: input.bio ?? '', createdAt: now, locationId: input.locationId ?? '' });
      return result.records.map((record) => value(record.get('c')) as Record<string, unknown>);
    });
    if (!rows[0]) throw new NotFoundException('Kandidat nije kreiran');
    return rows[0];
  }
  async update(id: string, input: CandidateInput): Promise<Record<string, unknown>> {
    const rows = await this.db.write<Record<string, unknown>>('MATCH (c:Candidate {id:$id}) SET c.name=$name, c.email=$email, c.title=$title, c.experienceYears=$experienceYears, c.bio=$bio RETURN c', { id, ...input, bio: input.bio ?? '' }, (record) => value(record.get('c')) as Record<string, unknown>);
    if (!rows[0]) throw new NotFoundException('Kandidat nije pronadjen'); return rows[0];
  }
  async remove(id: string) { const rows = await this.db.write('MATCH (c:Candidate {id:$id}) DETACH DELETE c RETURN $id AS id', { id }, () => true); if (!rows[0]) throw new NotFoundException('Kandidat nije pronadjen'); return { deleted: id }; }
}
