import { config } from 'dotenv';
import { Neo4jService } from './neo4j.service';
import { installSchema } from './schema';

config({ path: '../../.env' });
type Size = 'small' | 'medium' | 'large';
type Candidate = { id: string; name: string; email: string; title: string; experienceYears: number; bio: string; createdAt: string };
type Skill = { id: string; name: string; category: string };
type Company = { id: string; name: string; website: string; size: number; description: string };
type Job = { id: string; title: string; description: string; level: string; salaryMin: number; salaryMax: number; workMode: string; createdAt: string; active: boolean };

const configBySize: Record<Size, { candidates: number; jobs: number; companies: number }> = {
  small: { candidates: 600, jobs: 300, companies: 70 },
  medium: { candidates: 6000, jobs: 3000, companies: 700 },
  large: { candidates: 30000, jobs: 15000, companies: 3000 },
};
const skills: Skill[] = [
  ['React', 'Frontend'], ['TypeScript', 'Frontend'], ['JavaScript', 'Frontend'], ['Next.js', 'Frontend'], ['CSS', 'Frontend'], ['Node.js', 'Backend'], ['NestJS', 'Backend'], ['Java', 'Backend'], ['Spring Boot', 'Backend'], ['Python', 'Data'], ['SQL', 'Data'], ['Neo4j', 'Data'], ['Cypher', 'Data'], ['PostgreSQL', 'Data'], ['Redis', 'Data'], ['Docker', 'DevOps'], ['Kubernetes', 'DevOps'], ['AWS', 'Cloud'], ['Azure', 'Cloud'], ['Git', 'Tools'], ['Figma', 'Design'], ['C#', 'Backend'], ['.NET', 'Backend'], ['Go', 'Backend'], ['GraphQL', 'Backend'], ['Kafka', 'Data'], ['Cassandra', 'Data'], ['Machine Learning', 'Data'], ['TensorFlow', 'Data'], ['Linux', 'DevOps'], ['CI/CD', 'DevOps'], ['HTML', 'Frontend'], ['Tailwind CSS', 'Frontend'], ['Vue.js', 'Frontend'], ['Angular', 'Frontend'], ['MongoDB', 'Data'], ['Elasticsearch', 'Data'], ['Terraform', 'DevOps'], ['Security', 'Security'], ['Testing', 'Quality'], ['Playwright', 'Quality'], ['React Native', 'Mobile'], ['Flutter', 'Mobile'], ['Swift', 'Mobile'], ['Kotlin', 'Mobile'], ['Agile', 'Management'], ['Scrum', 'Management'], ['Power BI', 'Data'], ['Tableau', 'Data'], ['Figma', 'Design'], ['UX Research', 'Design'], ['RabbitMQ', 'Backend'], ['REST API', 'Backend'], ['Microservices', 'Backend'], ['Data Modeling', 'Data'], ['ETL', 'Data'], ['Spark', 'Data'], ['Prompt Engineering', 'AI'], ['LLM', 'AI'], ['Computer Vision', 'AI']
].map(([name, category], index) => ({ id: `skill-${index + 1}`, name, category }));
const locations = [['Belgrade', 'Serbia'], ['Nis', 'Serbia'], ['Novi Sad', 'Serbia'], ['Kragujevac', 'Serbia'], ['Zagreb', 'Croatia'], ['Sarajevo', 'Bosnia and Herzegovina'], ['Podgorica', 'Montenegro'], ['Ljubljana', 'Slovenia'], ['Skopje', 'North Macedonia'], ['Remote EU', 'Europe'], ['Berlin', 'Germany'], ['Vienna', 'Austria'], ['London', 'United Kingdom'], ['Amsterdam', 'Netherlands'], ['Prague', 'Czechia'], ['Budapest', 'Hungary'], ['Paris', 'France'], ['Madrid', 'Spain'], ['Stockholm', 'Sweden'], ['Dublin', 'Ireland']].map(([name, country], index) => ({ id: `location-${index + 1}`, name, country }));
const industries = ['Information Technology', 'FinTech', 'HealthTech', 'E-commerce', 'Telecommunications', 'Education', 'Gaming', 'Cybersecurity', 'Consulting', 'Media'].map((name, index) => ({ id: `industry-${index + 1}`, name }));
const jobFamilies = [
  { title: 'Frontend Developer', skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Testing'] },
  { title: 'Backend Developer', skills: ['Node.js', 'NestJS', 'TypeScript', 'SQL', 'Docker', 'REST API'] },
  { title: 'Full-Stack Developer', skills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'Git'] },
  { title: 'Data Engineer', skills: ['Python', 'SQL', 'ETL', 'Spark', 'Kafka', 'Docker'] },
  { title: 'Graph Data Engineer', skills: ['Neo4j', 'Cypher', 'Data Modeling', 'Python', 'Docker', 'GraphQL'] },
  { title: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Linux', 'CI/CD'] },
  { title: 'Mobile Developer', skills: ['React Native', 'TypeScript', 'Kotlin', 'Swift', 'Testing', 'Git'] },
  { title: 'Machine Learning Engineer', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'LLM', 'Docker'] },
];
const firstNames = ['Marko', 'Ana', 'Stefan', 'Jelena', 'Nikola', 'Milica', 'Luka', 'Teodora', 'Milos', 'Ivana', 'Aleksandar', 'Marija', 'Filip', 'Tamara', 'Petar', 'Sofija'];
const lastNames = ['Petrovic', 'Jovanovic', 'Nikolic', 'Markovic', 'Stojanovic', 'Ilic', 'Pavlovic', 'Milenkovic', 'Djordjevic', 'Matic'];
const certifications = ['AWS Certified Developer', 'Neo4j Certified Professional', 'Oracle Java SE', 'Microsoft Azure Fundamentals', 'Docker Certified Associate', 'Google Data Analytics', 'Scrum Master', 'React Professional Certificate', 'Kubernetes Administrator', 'MongoDB Associate'].map((name, index) => ({ id: `certification-${index + 1}`, name, issuer: name.includes('AWS') ? 'Amazon' : name.includes('Neo4j') ? 'Neo4j' : 'Professional Institute' }));

class Random {
  private state = 20261113;
  next(): number { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state / 4294967296; }
  int(max: number): number { return Math.floor(this.next() * max); }
  pick<T>(items: T[]): T { return items[this.int(items.length)]; }
  sample<T>(items: T[], count: number): T[] { return [...items].sort(() => this.next() - 0.5).slice(0, Math.min(count, items.length)); }
}

function chunks<T>(items: T[], size = 1000): T[][] { return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size)); }
async function batch(db: Neo4jService, query: string, values: unknown[]): Promise<void> { for (const rows of chunks(values)) await db.write(query, { rows }, () => null); }
function namedSkill(name: string): Skill { const skill = skills.find((item) => item.name === name); if (!skill) throw new Error(`Missing skill ${name}`); return skill; }

async function seed(size: Size): Promise<void> {
  const counts = configBySize[size]; const random = new Random(); const now = '2026-11-13T10:00:00.000Z';
  const candidates: Candidate[] = Array.from({ length: counts.candidates }, (_, index) => {
    const family = jobFamilies[index % jobFamilies.length]; const name = `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
    return { id: `candidate-${index + 1}`, name, email: `${name.toLowerCase().replace(' ', '.')}.${index + 1}@example.test`, title: family.title, experienceYears: 1 + random.int(12), bio: `${family.title} zainteresovan za kvalitetan rad i razvoj proizvoda.`, createdAt: now };
  });
  const companies: Company[] = Array.from({ length: counts.companies }, (_, index) => ({ id: `company-${index + 1}`, name: index === 0 ? 'TechNova' : `Company ${index + 1}`, website: `https://company-${index + 1}.example.test`, size: 15 + random.int(1500), description: `${industries[index % industries.length].name} kompanija.` }));
  const jobs: Job[] = Array.from({ length: counts.jobs }, (_, index) => { const family = jobFamilies[index % jobFamilies.length]; const seniority = ['Junior', 'Mid', 'Senior'][index % 3]; return { id: `job-${index + 1}`, title: `${seniority} ${family.title}`, description: `Otvorena pozicija za ${family.title}.`, level: seniority, salaryMin: 900 + (index % 5) * 500, salaryMax: 1700 + (index % 5) * 850, workMode: ['Hibridno', 'Remote', 'Kancelarija'][index % 3], createdAt: now, active: index % 9 !== 0 }; });
  await installSchema(db);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Skill {id: row.id}) SET n += row', skills);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Location {id: row.id}) SET n += row', locations);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Industry {id: row.id}) SET n += row', industries);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Certification {id: row.id}) SET n += row', certifications);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Company {id: row.id}) SET n += row', companies);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Candidate {id: row.id}) SET n += row', candidates);
  await batch(db, 'UNWIND $rows AS row MERGE (n:Job {id: row.id}) SET n += row', jobs);
  // Seed je deterministicki: pre ponovnog kreiranja veza brisemo samo veze, ne i cvorove.
  await db.write('MATCH ()-[relationship]->() DELETE relationship', {}, () => null);
  await batch(db, 'UNWIND $rows AS row MATCH (c:Company {id: row.companyId}), (l:Location {id: row.locationId}), (i:Industry {id: row.industryId}) MERGE (c)-[:LOCATED_IN]->(l) MERGE (c)-[:BELONGS_TO]->(i)', companies.map((company, index) => ({ companyId: company.id, locationId: locations[index % locations.length].id, industryId: industries[index % industries.length].id })));
  await batch(db, 'UNWIND $rows AS row MATCH (c:Candidate {id: row.candidateId}), (l:Location {id: row.locationId}), (co:Company {id: row.companyId}) MERGE (c)-[:LOCATED_IN]->(l) MERGE (c)-[r:WORKS_AT]->(co) SET r.role = row.role, r.since = row.since', candidates.map((candidate, index) => ({ candidateId: candidate.id, locationId: locations[index % locations.length].id, companyId: companies[index % companies.length].id, role: candidate.title, since: 2020 + index % 6 })));
  const hasSkills = candidates.flatMap((candidate, index) => {
    const selected = index === 0
      ? ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Testing', 'Figma'].map(namedSkill)
      : random.sample(jobFamilies[index % jobFamilies.length].skills.map(namedSkill), 3 + random.int(4));
    return selected.map((skill) => ({ candidateId: candidate.id, skillId: skill.id, level: index === 0 ? 5 : 1 + random.int(5), yearsOfExperience: index === 0 ? candidate.experienceYears : 1 + random.int(Math.max(1, candidate.experienceYears)) }));
  });
  await batch(db, 'UNWIND $rows AS row MATCH (c:Candidate {id: row.candidateId}), (s:Skill {id: row.skillId}) MERGE (c)-[r:HAS_SKILL]->(s) SET r.level = row.level, r.yearsOfExperience = row.yearsOfExperience', hasSkills);
  const requirements = jobs.flatMap((job, index) => {
    const selected = index === 8
      ? ['React', 'TypeScript', 'CSS', 'HTML'].map(namedSkill)
      : random.sample(jobFamilies[index % jobFamilies.length].skills.map(namedSkill), 4 + random.int(3));
    return selected.map((skill, position) => ({ jobId: job.id, skillId: skill.id, mandatory: position < 3, weight: position < 3 ? 3 : 1, minLevel: index === 8 ? 3 : 2 + random.int(3) }));
  });
  await batch(db, 'UNWIND $rows AS row MATCH (j:Job {id: row.jobId}), (s:Skill {id: row.skillId}) MERGE (j)-[r:REQUIRES_SKILL]->(s) SET r.mandatory = row.mandatory, r.weight = row.weight, r.minLevel = row.minLevel', requirements);
  await batch(db, 'UNWIND $rows AS row MATCH (j:Job {id: row.jobId}), (c:Company {id: row.companyId}), (l:Location {id: row.locationId}) MERGE (j)-[:POSTED_BY]->(c) MERGE (j)-[:LOCATED_IN]->(l)', jobs.map((job, index) => ({ jobId: job.id, companyId: companies[index % companies.length].id, locationId: locations[index % locations.length].id })));
  await batch(db, 'UNWIND $rows AS row MATCH (c:Certification {id: row.certificationId}), (s:Skill {id: row.skillId}) MERGE (c)-[:VALIDATES_SKILL]->(s)', certifications.map((certification, index) => ({ certificationId: certification.id, skillId: skills[index % skills.length].id })));
  await batch(db, 'UNWIND $rows AS row MATCH (c:Candidate {id: row.candidateId}), (cert:Certification {id: row.certificationId}) MERGE (c)-[:HAS_CERTIFICATION]->(cert)', candidates.filter((_, index) => index % 4 === 0).map((candidate, index) => ({ candidateId: candidate.id, certificationId: certifications[index % certifications.length].id })));
  await batch(db, 'UNWIND $rows AS row MATCH (a:Skill {id: row.fromId}), (b:Skill {id: row.toId}) WHERE a.id < b.id MERGE (a)-[r:RELATED_TO]->(b) SET r.similarity = row.similarity', skills.flatMap((skill, index) => skills.filter((other) => other.category === skill.category && other.id > skill.id).slice(0, 2).map((other) => ({ fromId: skill.id, toId: other.id, similarity: 0.5 + (index % 5) / 10 }))));
  const knows = candidates.flatMap((candidate, index) => Array.from({ length: 2 + index % 4 }, (_, offset) => candidates[(index + offset * 13 + 7) % candidates.length]).filter((other) => candidate.id < other.id).map((other) => ({ sourceId: candidate.id, targetId: other.id, since: 2018 + random.int(8), strength: 1 + random.int(5) })));
  await batch(db, 'UNWIND $rows AS row MATCH (a:Candidate {id: row.sourceId}), (b:Candidate {id: row.targetId}) MERGE (a)-[r:KNOWS]->(b) SET r.since = row.since, r.strength = row.strength', knows);
  await batch(db, 'UNWIND $rows AS row MATCH (c:Candidate {id: row.candidateId}), (co:Company {id: row.companyId}) MERGE (c)-[:FOLLOWS]->(co)', candidates.filter((_, index) => index % 3 === 0).map((candidate, index) => ({ candidateId: candidate.id, companyId: companies[(index * 3) % companies.length].id })));
  await batch(db, 'UNWIND $rows AS row MATCH (c:Candidate {id: row.candidateId}), (j:Job {id: row.jobId}) MERGE (c)-[r:APPLIED_TO]->(j) SET r.status = row.status, r.appliedAt = row.appliedAt', candidates.filter((_, index) => index % 5 === 0).flatMap((candidate, index) => [{ candidateId: candidate.id, jobId: jobs[index % jobs.length].id, status: 'submitted', appliedAt: now }, { candidateId: candidate.id, jobId: jobs[(index * 7 + 2) % jobs.length].id, status: 'reviewed', appliedAt: now }]));
  console.log(`Seed '${size}' zavrsen: ${candidates.length} kandidata, ${jobs.length} poslova, ${companies.length} kompanija.`);
}

const requested = process.argv[2] as Size | undefined;
if (!requested || !Object.hasOwn(configBySize, requested)) throw new Error('Koriscenje: npm run seed -- small|medium|large');
const db = new Neo4jService();
void seed(requested).finally(async () => db.onModuleDestroy());
