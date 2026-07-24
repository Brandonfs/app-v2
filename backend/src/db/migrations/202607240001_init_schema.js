exports.up = async (knex) => {
  await knex.schema.createTable('branches', (table) => {
    table.increments('id').primary();
    table.string('name', 120).notNullable().unique();
    table.string('location', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('full_name', 150).notNullable();
    table.string('username', 120).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('role', 20).notNullable().defaultTo('empleado');
    table.integer('branch_id').unsigned().references('id').inTable('branches').onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('attendance', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('branch_id').unsigned().nullable().references('id').inTable('branches').onDelete('SET NULL');
    table.timestamp('checked_in_at').notNullable().defaultTo(knex.fn.now());
    table.string('status', 20).notNullable();
    table.string('qr_nonce', 120).notNullable();
    table.timestamp('qr_generated_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('reports', (table) => {
    table.increments('id').primary();
    table.integer('generated_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.string('status_filter', 20).nullable();
    table.string('file_type', 10).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('reports');
  await knex.schema.dropTableIfExists('attendance');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('branches');
};
