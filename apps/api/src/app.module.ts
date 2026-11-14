import { Module } from '@nestjs/common';
import { AnalyticsController, AnalyticsService } from './modules/analytics';
import { CandidatesController, CandidatesService } from './modules/candidates';
import { CompaniesController, CompaniesService } from './modules/companies';
import { GraphController, GraphService } from './modules/graph';
import { JobsController, JobsService } from './modules/jobs';
import { PerformanceController, PerformanceService } from './modules/performance';
import { QueriesController, QueriesService } from './modules/queries';
import { RecommendationsController, RecommendationsService } from './modules/recommendations';
import { SkillsController, SkillsService } from './modules/skills';
import { Neo4jService } from './database/neo4j.service';

@Module({
  controllers: [CandidatesController, SkillsController, JobsController, CompaniesController, GraphController, RecommendationsController, AnalyticsController, QueriesController, PerformanceController],
  providers: [Neo4jService, CandidatesService, SkillsService, JobsService, CompaniesService, GraphService, RecommendationsService, AnalyticsService, QueriesService, PerformanceService]
})
export class AppModule {}
