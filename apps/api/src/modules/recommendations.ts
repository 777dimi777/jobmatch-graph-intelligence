import { Controller, forwardRef, Get, Injectable, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService } from '../database/neo4j.service';

interface RecommendationsPort { forCandidate(candidateId: string, includeUnqualified: boolean): Promise<unknown>; }
@ApiTags('Recommendations') @Controller('recommendations')
export class RecommendationsController { constructor(@Inject(forwardRef(() => RecommendationsService)) private readonly service: RecommendationsPort) {} @Get(':candidateId') list(@Param('candidateId') candidateId: string, @Query('includeUnqualified') includeUnqualified = 'false') { return this.service.forCandidate(candidateId, includeUnqualified === 'true'); } }
@Injectable()
export class RecommendationsService {
  constructor(private readonly db: Neo4jService) {}
  forCandidate(candidateId: string, includeUnqualified: boolean) {
    // Sve agregacije ostaju u grafu: kandidatove relacije HAS_SKILL se porede sa REQUIRES_SKILL relacijama oglasa.
    return this.db.read(`MATCH (candidate:Candidate {id:$candidateId}) MATCH (job:Job {active:true})-[:POSTED_BY]->(company:Company)
      OPTIONAL MATCH (job)-[:LOCATED_IN]->(location:Location)
      CALL { WITH candidate, job
        OPTIONAL MATCH (job)-[requirement:REQUIRES_SKILL]->(skill:Skill)
        OPTIONAL MATCH (candidate)-[owned:HAS_SKILL]->(skill) WHERE owned.level >= requirement.minLevel
        WITH requirement, skill, owned
        RETURN count(requirement) AS requiredCount,
          coalesce(sum(CASE WHEN requirement IS NULL THEN 0 ELSE requirement.weight END), 0) AS totalWeight,
          coalesce(sum(CASE WHEN owned IS NULL THEN 0 ELSE requirement.weight END), 0) AS matchedWeight,
          coalesce(sum(CASE WHEN requirement.mandatory AND owned IS NULL THEN 1 ELSE 0 END), 0) AS missingMandatory,
          collect(CASE WHEN requirement IS NOT NULL AND owned IS NULL THEN skill.name END) AS missingSkills,
          collect(CASE WHEN owned IS NOT NULL THEN skill.name END) AS matchedSkills
      }
      WITH job, company, location, requiredCount, totalWeight, matchedWeight, missingMandatory, missingSkills, matchedSkills,
        CASE WHEN totalWeight = 0 THEN 0 ELSE round(100.0 * matchedWeight / totalWeight, 1) END AS score
      WHERE $includeUnqualified OR missingMandatory = 0
      RETURN job { .id, .title, .level, .workMode, .salaryMin, .salaryMax }, company { .id, .name }, location { .name } AS location,
        score, requiredCount, matchedWeight, totalWeight, missingMandatory, [item IN missingSkills WHERE item IS NOT NULL] AS missingSkills,
        [item IN matchedSkills WHERE item IS NOT NULL] AS matchedSkills
      ORDER BY missingMandatory ASC, score DESC, job.title LIMIT 20`, { candidateId, includeUnqualified }, (record) => ({ job: record.get('job'), company: record.get('company'), location: record.get('location'), score: record.get('score'), requiredCount: record.get('requiredCount'), matchedWeight: record.get('matchedWeight'), totalWeight: record.get('totalWeight'), missingMandatory: record.get('missingMandatory'), missingSkills: record.get('missingSkills'), matchedSkills: record.get('matchedSkills') }));
  }
}
