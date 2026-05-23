#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const command = process.argv[2] || 'status';
const args = process.argv.slice(3);

if (!existsSync(MIGRATIONS_DIR)) {
  console.error(`Missing migrations directory: ${MIGRATIONS_DIR}`);
  process.exit(1);
}

if (!DB_URL) {
  console.error(
    'Missing SUPABASE_DB_URL or DATABASE_URL. ' +
    'Use the working Postgres connection string for your Supabase project.'
  );
  process.exit(1);
}

const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((file) => /^\d+_.*\.sql$/i.test(file))
  .sort((a, b) => a.localeCompare(b));

function getVersion(fileName) {
  return fileName.split('_')[0];
}

function runPsql(args, { quiet = false } = {}) {
  return execFileSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-d', DB_URL, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function ensureMigrationTable() {
  runPsql(
    [
      '-c',
      [
        'create schema if not exists supabase_migrations;',
        'create table if not exists supabase_migrations.schema_migrations (',
        '  version text primary key,',
        '  statements text[],',
        '  name text',
        ');',
      ].join(' '),
    ],
    { quiet: true }
  );
}

function getRemoteMigrations() {
  ensureMigrationTable();

  const output = runPsql(
    [
      '-A',
      '-t',
      '-F',
      '\t',
      '-c',
      'select version, coalesce(name, \'\') from supabase_migrations.schema_migrations order by version;',
    ],
    { quiet: true }
  );

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [version, name] = line.split('\t');
      return { version, name };
    });
}

function printStatus() {
  const remote = getRemoteMigrations();
  const remoteVersions = new Set(remote.map((row) => row.version));

  console.log('Local migrations:');
  for (const file of migrationFiles) {
    const version = getVersion(file);
    const marker = remoteVersions.has(version) ? 'applied' : 'pending';
    console.log(`- ${version} ${file} [${marker}]`);
  }

  console.log('');
  console.log('Remote migration history:');
  if (remote.length === 0) {
    console.log('- none');
    return;
  }

  for (const row of remote) {
    console.log(`- ${row.version} ${row.name || '(no name recorded)'}`);
  }
}

function markApplied(versions) {
  const versionSet = new Set(versions);
  const rows = migrationFiles
    .filter((file) => versionSet.has(getVersion(file)))
    .map((file) => `(${sqlLiteral(getVersion(file))}, ${sqlLiteral(file)})`);

  const missing = versions.filter((version) => !rows.some((row) => row.startsWith(`('${version}',`)));
  if (missing.length > 0) {
    console.error(`Unknown migration version(s): ${missing.join(', ')}`);
    process.exit(1);
  }

  runPsql([
    '-c',
    `insert into supabase_migrations.schema_migrations (version, name) values ${rows.join(', ')} on conflict (version) do update set name = excluded.name;`,
  ]);
}

function syncMigrations() {
  const remote = getRemoteMigrations();
  const remoteVersions = new Set(remote.map((row) => row.version));
  const pending = migrationFiles.filter((file) => !remoteVersions.has(getVersion(file)));

  if (pending.length === 0) {
    console.log('Remote database is already in sync.');
    return;
  }

  for (const file of pending) {
    const version = getVersion(file);
    const fullPath = path.join(MIGRATIONS_DIR, file);

    console.log(`Applying ${file}...`);
    runPsql(['-f', fullPath]);
    runPsql([
      '-c',
      `insert into supabase_migrations.schema_migrations (version, name) values (${sqlLiteral(version)}, ${sqlLiteral(file)}) on conflict (version) do update set name = excluded.name;`,
    ]);
  }

  console.log('Remote database migrations are in sync.');
}

switch (command) {
  case 'status':
    printStatus();
    break;
  case 'sync':
    syncMigrations();
    break;
  case 'repair':
    if (args.length === 0) {
      console.error('Provide one or more migration versions to mark as applied, for example: repair 001 002');
      process.exit(1);
    }
    ensureMigrationTable();
    markApplied(args);
    console.log(`Marked as applied: ${args.join(', ')}`);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Use one of: status, sync, repair');
    process.exit(1);
}
