import { Controller, forwardRef, Get, Injectable, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService } from '../database/neo4j.service';
interface CompaniesPort { list(search: string): Promise<unknown>; detail(id: string): Promise<unknown>; }
@ApiTags('Companies') @Controller('companies')
export class CompaniesController { constructor(@Inject(forwardRef(() => CompaniesService)) private readonly service: CompaniesPort) {} @Get() list(@Query('search') search = '') { return this.service.list(search); } @Get(':id') detail(@Param('id') id: string) { return this.service.detail(id); } }
@Injectable()
export class CompaniesService {
  constructor(private readonly db: Neo4jService) {}

  list(search: string) {
    if (search.trim().length < 2) return Promise.resolve([]);
    return this.db.read(`MATCH (c:Company) WHERE toLower(c.name) CONTAINS toLower($search)
      OPTIONAL MATCH (j:Job {active:true})-[:POSTED_BY]->(c)
      OPTIONAL MATCH (c)-[:BELONGS_TO]->(i:Industry)
      WITH c, head(collect(DISTINCT i.name)) AS industry, count(DISTINCT j) AS activeJobs
      RETURN c { .*, industry: industry, activeJobs: activeJobs } AS company ORDER BY company.activeJobs DESC`, { search }, (record) => record.get('company'));
  }

  detail(id: string) {
    return this.db.read(`MATCH (c:Company {id:$id})
      OPTIONAL MATCH (j:Job)-[:POSTED_BY]->(c)
      OPTIONAL MATCH (c)-[:LOCATED_IN]->(l:Location)
      OPTIONAL MATCH (c)-[:BELONGS_TO]->(i:Industry)
      WITH c, collect(DISTINCT j { .id, .title, .active }) AS jobs, head(collect(DISTINCT l { .name })) AS location, head(collect(DISTINCT i { .name })) AS industry
      RETURN c { .*, jobs: jobs, location: location, industry: industry } AS company`, { id }, (record) => record.get('company'));
  }
}
