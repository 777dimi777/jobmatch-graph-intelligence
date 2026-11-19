import { Body, Controller, forwardRef, Get, Injectable, Inject, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Neo4jService } from '../database/neo4j.service';
import { hasSearchTerm } from './search-policy';

class ApplyInput {
  @IsString() candidateId!: string;
  @IsString() jobId!: string;
  @IsOptional() @IsString() coverNote?: string;
}
interface EngagementPort {
  apply(input: ApplyInput): Promise<unknown>;
  applications(candidateId: string): Promise<unknown>;
  notifications(candidateId: string): Promise<unknown>;
  markRead(id: string): Promise<unknown>;
  search(query: string): Promise<unknown>;
}

@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(@Inject(forwardRef(() => EngagementService)) private readonly service: EngagementPort) {}
  @Post() apply(@Body() input: ApplyInput) { return this.service.apply(input); }
  @Get() list(@Query('candidateId') candidateId: string) { return this.service.applications(candidateId); }
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(forwardRef(() => EngagementService)) private readonly service: EngagementPort) {}
  @Get(':candidateId') list(@Param('candidateId') candidateId: string) { return this.service.notifications(candidateId); }
  @Patch(':id/read') read(@Param('id') id: string) { return this.service.markRead(id); }
}

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(@Inject(forwardRef(() => EngagementService)) private readonly service: EngagementPort) {}
  @Get() search(@Query('q') query = '') { return this.service.search(query); }
}

@Injectable()
export class EngagementService {
  constructor(private readonly db: Neo4jService) {}

  async apply(input: ApplyInput) {
    const rows = await this.db.write(`MATCH (c:Candidate {id:$candidateId}), (j:Job {id:$jobId, active:true})
      MERGE (c)-[application:APPLIED_TO]->(j)
      ON CREATE SET application.id = 'application-' + $candidateId + '-' + $jobId, application.status = 'submitted', application.appliedAt = datetime(), application.coverNote = coalesce($coverNote, '')
      ON MATCH SET application.updatedAt = datetime(), application.coverNote = coalesce($coverNote, application.coverNote)
      RETURN application { .id, .status, appliedAt: toString(application.appliedAt), coverNote: application.coverNote } AS application`, { ...input, coverNote: input.coverNote ?? '' }, (record) => record.get('application'));
    if (!rows[0]) throw new NotFoundException('Kandidat ili aktivan posao nije pronadjen');
    return rows[0];
  }

  applications(candidateId: string) {
    return this.db.read(`MATCH (c:Candidate {id:$candidateId})-[application:APPLIED_TO]->(j:Job)-[:POSTED_BY]->(company:Company)
      RETURN application { .id, .status, appliedAt: toString(application.appliedAt) } AS application, j { .id, .title } AS job, company { .id, .name } AS company
      ORDER BY application.appliedAt DESC`, { candidateId }, (record) => ({ application: record.get('application'), job: record.get('job'), company: record.get('company') }));
  }

  async notifications(candidateId: string) {
    await this.db.write(`MATCH (candidate:Candidate {id:$candidateId})-[:HAS_SKILL]->(skill:Skill)<-[:REQUIRES_SKILL]-(job:Job {active:true})-[:POSTED_BY]->(company:Company)
      WITH candidate, job, company, count(DISTINCT skill) AS sharedSkills
      ORDER BY sharedSkills DESC, job.createdAt DESC LIMIT 3
      WITH candidate, job, company, sharedSkills, 'job-match-' + candidate.id + '-' + job.id AS notificationId
      MERGE (notification:Notification {id:notificationId})
      ON CREATE SET notification.type='job_recommendation', notification.title='Novi relevantan posao', notification.message=job.title + ' u kompaniji ' + company.name + ' deli ' + toString(sharedSkills) + ' vestina sa tvojim profilom.', notification.createdAt=datetime(), notification.read=false, notification.jobId=job.id
      MERGE (candidate)-[:RECEIVES]->(notification)`, { candidateId }, () => null);
    return this.db.read(`MATCH (:Candidate {id:$candidateId})-[:RECEIVES]->(notification:Notification)
      RETURN notification { .id, .type, .title, .message, .read, .jobId, createdAt:toString(notification.createdAt) } AS notification
      ORDER BY notification.createdAt DESC LIMIT 12`, { candidateId }, (record) => record.get('notification'));
  }

  async markRead(id: string) {
    const rows = await this.db.write('MATCH (notification:Notification {id:$id}) SET notification.read=true RETURN notification { .id, .read } AS notification', { id }, (record) => record.get('notification'));
    if (!rows[0]) throw new NotFoundException('Obavestenje nije pronadjeno');
    return rows[0];
  }

  search(query: string) {
    if (!hasSearchTerm(query)) return Promise.resolve([]);
    return this.db.read(`CALL {
      MATCH (candidate:Candidate) WHERE toLower(candidate.name) CONTAINS toLower($query) OR toLower(candidate.title) CONTAINS toLower($query)
      RETURN 'candidate' AS type, candidate.id AS id, candidate.name AS title, candidate.title AS subtitle LIMIT 5
      UNION ALL
      MATCH (job:Job {active:true})-[:POSTED_BY]->(company:Company) WHERE toLower(job.title) CONTAINS toLower($query) OR toLower(company.name) CONTAINS toLower($query)
      RETURN 'job' AS type, job.id AS id, job.title AS title, company.name AS subtitle LIMIT 5
      UNION ALL
      MATCH (company:Company) WHERE toLower(company.name) CONTAINS toLower($query)
      RETURN 'company' AS type, company.id AS id, company.name AS title, 'Kompanija' AS subtitle LIMIT 5
      UNION ALL
      MATCH (skill:Skill) WHERE toLower(skill.name) CONTAINS toLower($query)
      RETURN 'skill' AS type, skill.id AS id, skill.name AS title, skill.category AS subtitle LIMIT 5
    } RETURN type, id, title, subtitle LIMIT 12`, { query }, (record) => ({ type: record.get('type'), id: record.get('id'), title: record.get('title'), subtitle: record.get('subtitle') }));
  }
}
