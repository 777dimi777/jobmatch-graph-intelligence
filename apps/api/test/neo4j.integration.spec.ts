import { CandidatesService } from '../src/modules/candidates';
import { Neo4jService } from '../src/database/neo4j.service';
import { installSchema } from '../src/database/schema';

const enabled = process.env.RUN_NEO4J_INTEGRATION === 'true';
const integration = enabled ? describe : describe.skip;

integration('Neo4j integration', () => {
  const db = new Neo4jService();
  const candidates = new CandidatesService(db);
  let createdId = '';

  beforeAll(async () => { await installSchema(db); await db.write("MATCH (c:Candidate) WHERE c.email STARTS WITH 'integration.' DETACH DELETE c", {}, () => null); });
  afterAll(async () => { await db.write("MATCH (c:Candidate) WHERE c.email STARTS WITH 'integration.' DETACH DELETE c", {}, () => null); await db.onModuleDestroy(); });

  it('creates, reads, updates and deletes a candidate', async () => {
    const created = await candidates.create({ name: 'Integration Candidate', email: `integration.${Date.now()}@example.test`, title: 'Tester', experienceYears: 2, bio: 'Test' });
    createdId = String(created.id);
    expect((await candidates.detail(createdId)).name).toBe('Integration Candidate');
    expect((await candidates.update(createdId, { name: 'Updated Candidate', email: String(created.email), title: 'Senior Tester', experienceYears: 3, bio: 'Updated' })).name).toBe('Updated Candidate');
    await expect(candidates.remove(createdId)).resolves.toEqual({ deleted: createdId });
  });

  it('rolls back a failed multi-step transaction', async () => {
    const id = `candidate-rollback-${Date.now()}`;
    await expect(db.transaction(async (tx) => { await tx.run('CREATE (:Candidate {id:$id, email:$email, name:"Rollback", title:"Test", experienceYears:0, bio:"", createdAt:""})', { id, email: `integration.rollback.${Date.now()}@example.test` }); throw new Error('force rollback'); })).rejects.toThrow('force rollback');
    expect(await db.read('MATCH (c:Candidate {id:$id}) RETURN c', { id }, () => true)).toHaveLength(0);
  });
});
