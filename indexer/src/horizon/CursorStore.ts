import { Knex } from 'knex';

export class CursorStore {
  constructor(private readonly db: Knex) {
    this.init();
  }

  private async init(): Promise<void> {
    const exists = await this.db.schema.hasTable('indexer_cursor');
    if (!exists) {
      await this.db.schema.createTable('indexer_cursor', (t) => {
        t.string('key').primary();
        t.string('value').notNullable();
        t.bigInteger('updated_at').notNullable();
      });
    }
  }

  async load(): Promise<string> {
    const row = await this.db('indexer_cursor').where({ key: 'horizon' }).first();
    return row?.value ?? 'now';
  }

  async save(cursor: string): Promise<void> {
    await this.db('indexer_cursor')
      .insert({ key: 'horizon', value: cursor, updated_at: Math.floor(Date.now() / 1000) })
      .onConflict('key')
      .merge({ value: cursor, updated_at: Math.floor(Date.now() / 1000) });
  }
}