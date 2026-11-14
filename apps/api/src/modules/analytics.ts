import { Controller, forwardRef, Get, Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Neo4jService } from '../database/neo4j.service';

interface AnalyticsPort { overview(): Promise<unknown>; topSkills(): Promise<unknown>; market(): Promise<unknown>; similarCandidates(): Promise<unknown>; communities(): Promise<unknown>; }
@ApiTags('Analytics') @Controller('analytics')
export class AnalyticsController { constructor(@Inject(forwardRef(() => AnalyticsService)) private readonly service: AnalyticsPort) {} @Get('overview') overview() { return this.service.overview(); } @Get('skills') skills() { return this.service.topSkills(); } @Get('market') market() { return this.service.market(); } @Get('similar-candidates') similar() { return this.service.similarCandidates(); } @Get('communities') communities() { return this.service.communities(); } }
@Injectable()
export class AnalyticsService {
  constructor(private readonly db: Neo4jService) {}
  async overview() { const rows = await this.db.read(`CALL { MATCH (c:Candidate) RETURN count(c) AS candidates } CALL { MATCH (j:Job {active:true}) RETURN count(j) AS jobs } CALL { MATCH (c:Company) RETURN count(c) AS companies } CALL { MATCH ()-[r]->() RETURN count(r) AS relationships } RETURN candidates, jobs, companies, relationships`, {}, (record) => ({ candidates: record.get('candidates'), jobs: record.get('jobs'), companies: record.get('companies'), relationships: record.get('relationships') })); return rows[0] ?? { candidates: 0, jobs: 0, companies: 0, relationships: 0 }; }
  topSkills() { return this.db.read('MATCH (:Job {active:true})-[:REQUIRES_SKILL]->(s:Skill) RETURN s.name AS name, count(*) AS demand ORDER BY demand DESC LIMIT 10', {}, (record) => ({ name: record.get('name'), demand: record.get('demand') })); }
  market() { return this.db.read(`CALL { MATCH (j:Job {active:true})-[:POSTED_BY]->(c:Company) RETURN c.name AS label, count(j) AS value ORDER BY value DESC LIMIT 8 } RETURN collect({ label:label, value:value }) AS companies`, {}, (record) => record.get('companies')); }
  similarCandidates() { return this.db.read(`MATCH (a:Candidate)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(b:Candidate) WHERE a.id < b.id
    WITH a,b,collect(DISTINCT s.name) AS commonSkills, count(DISTINCT s) AS intersection
    MATCH (a)-[:HAS_SKILL]->(aSkill) WITH a,b,commonSkills,intersection,count(DISTINCT aSkill) AS aTotal
    MATCH (b)-[:HAS_SKILL]->(bSkill) WITH a,b,commonSkills,intersection,aTotal,count(DISTINCT bSkill) AS bTotal
    RETURN a { .id,.name,.title } AS candidate, b { .id,.name,.title } AS similarCandidate, round(toFloat(intersection) / (aTotal + bTotal - intersection), 3) AS similarity, commonSkills
    ORDER BY similarity DESC LIMIT 20`, {}, (record) => ({ candidate: record.get('candidate'), similarCandidate: record.get('similarCandidate'), similarity: record.get('similarity'), commonSkills: record.get('commonSkills') })); }
  async communities() { try { return await this.db.read(`CALL gds.graph.project.cypher($graphName, 'MATCH (c:Candidate) RETURN id(c) AS id', 'MATCH (a:Candidate)-[:KNOWS]-(b:Candidate) RETURN id(a) AS source, id(b) AS target', { validateRelationships: false }) YIELD graphName
      CALL gds.louvain.stream(graphName) YIELD nodeId, communityId
      WITH graphName, communityId, count(*) AS members
      WITH graphName, collect({ communityId: communityId, members: members }) AS communities
      CALL gds.graph.drop(graphName) YIELD graphName AS dropped
      UNWIND communities AS community
      RETURN community.communityId AS communityId, community.members AS members ORDER BY members DESC LIMIT 20`, { graphName: `jobmatch-communities-${Date.now()}` }, (record) => ({ communityId: record.get('communityId'), members: record.get('members') }));
    } catch { throw new ServiceUnavailableException('GDS nije dostupan ili graf nije mogao da se projektuje. Pokrenite Neo4j preko docker-compose konfiguracije sa graph-data-science dodatkom.'); } }
}
