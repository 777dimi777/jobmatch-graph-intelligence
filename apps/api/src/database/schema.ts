import { Neo4jService } from './neo4j.service';

const constraints = ['Candidate', 'Skill', 'Job', 'Company', 'Location', 'Industry', 'Certification'].map((label) => `CREATE CONSTRAINT ${label.toLowerCase()}_id_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`);
const indexes = [
  'CREATE INDEX candidate_name IF NOT EXISTS FOR (n:Candidate) ON (n.name)',
  'CREATE INDEX candidate_email IF NOT EXISTS FOR (n:Candidate) ON (n.email)',
  'CREATE INDEX skill_name IF NOT EXISTS FOR (n:Skill) ON (n.name)',
  'CREATE INDEX job_active_created IF NOT EXISTS FOR (n:Job) ON (n.active, n.createdAt)',
  'CREATE INDEX company_name IF NOT EXISTS FOR (n:Company) ON (n.name)',
  'CREATE INDEX location_name IF NOT EXISTS FOR (n:Location) ON (n.name)',
];

export async function installSchema(db: Neo4jService): Promise<void> {
  for (const query of [...constraints, ...indexes]) await db.write(query, {}, () => null);
}
