exports.up = async (knex) => {
  const hasTable = await knex.schema.hasTable('branches');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('branches', 'is_active');
  if (!hasColumn) {
    await knex.schema.alterTable('branches', (table) => {
      table.boolean('is_active').notNullable().defaultTo(true);
    });
  }

  await knex('branches').whereNull('is_active').update({ is_active: true });
};

exports.down = async (knex) => {
  const hasTable = await knex.schema.hasTable('branches');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('branches', 'is_active');
  if (hasColumn) {
    await knex.schema.alterTable('branches', (table) => {
      table.dropColumn('is_active');
    });
  }
};
