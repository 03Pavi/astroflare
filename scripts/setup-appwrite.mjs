/**
 * Appwrite Database + Collections Setup Script
 * Run: node scripts/setup-appwrite.mjs
 *
 * Creates:
 *  - Database: astroai_db
 *  - Collection: user_details
 *  - Collection: birth_charts
 */

import { Client, Databases, Permission, Role, IndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_URL;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? 'astroai_db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌  Missing env vars. Check .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

// ─── helpers ────────────────────────────────────────────────────────────────

async function ensureDatabase() {
  try {
    const existing = await db.get(DB_ID);
    console.log(`✅  Database "${existing.name}" already exists.`);
    return existing;
  } catch {
    const created = await db.create(DB_ID, 'AstroAI Database');
    console.log(`✅  Created database: ${created.name} (${created.$id})`);
    return created;
  }
}

async function ensureCollection(collId, collName, permissions) {
  try {
    const existing = await db.getCollection(DB_ID, collId);
    console.log(`  ↳ Collection "${existing.name}" already exists — updating permissions.`);
    await db.updateCollection(DB_ID, collId, collName, permissions);
    return existing;
  } catch {
    const created = await db.createCollection(DB_ID, collId, collName, permissions);
    console.log(`  ↳ Created collection: ${created.name} (${created.$id})`);
    return created;
  }
}

async function addAttr(collId, fn) {
  try {
    await fn();
  } catch (e) {
    if (e?.code === 409) {
      // Attribute already exists — fine
    } else {
      console.warn(`  ⚠  Attribute error: ${e?.message}`);
    }
  }
}

// ─── user_details collection ─────────────────────────────────────────────────

async function createUserDetailsCollection() {
  console.log('\n📁  Setting up "user_details" collection…');

  const perms = [
    Permission.create(Role.any()),
    Permission.read(Role.any()),
    Permission.update(Role.any()),
  ];

  await ensureCollection('user_details', 'User Details', perms);

  const str = (key, size = 255, req = false) => addAttr('user_details', () =>
    db.createStringAttribute(DB_ID, 'user_details', key, size, req));
  const bool = (key, req = false, def = false) => addAttr('user_details', () =>
    db.createBooleanAttribute(DB_ID, 'user_details', key, req, def));

  await str('firebaseUid', 128, true);
  await str('name', 255, true);
  await str('email', 255, true);
  await str('photoURL', 512, false);
  await str('provider', 64, false);       // 'google.com' | 'password'
  await str('birthDate', 32, false);      // ISO date string
  await str('birthTime', 16, false);      // HH:MM
  await str('birthPlace', 255, false);
  await str('sunSign', 64, false);
  await str('moonSign', 64, false);
  await str('risingSign', 64, false);
  await str('createdAt', 64, false);
  await str('updatedAt', 64, false);
  await bool('onboardingComplete', false, false);

  // Index on firebaseUid for fast lookups
  try {
    await db.createIndex(DB_ID, 'user_details', 'idx_firebase_uid', IndexType.Key, ['firebaseUid'], ['ASC']);
    console.log('  ↳ Index on firebaseUid created.');
  } catch { /* already exists */ }

  console.log('  ✅  user_details ready.');
}

// ─── birth_charts collection ─────────────────────────────────────────────────

async function createBirthChartsCollection() {
  console.log('\n📁  Setting up "birth_charts" collection…');

  const perms = [
    Permission.create(Role.any()),
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  await ensureCollection('birth_charts', 'Birth Charts', perms);

  const str = (key, size = 255, req = false) => addAttr('birth_charts', () =>
    db.createStringAttribute(DB_ID, 'birth_charts', key, size, req));
  const num = (key, req = false) => addAttr('birth_charts', () =>
    db.createFloatAttribute(DB_ID, 'birth_charts', key, req));

  await str('userId', 128, true);         // firebaseUid
  await str('label', 128, false);         // e.g. "My Chart", "Partner's Chart"
  await str('birthDate', 32, true);
  await str('birthTime', 16, false);
  await str('birthPlace', 255, true);
  await num('latitude', false);
  await num('longitude', false);
  await str('sunSign', 64, false);
  await str('moonSign', 64, false);
  await str('risingSign', 64, false);
  await str('chartData', 65536, false);   // JSON blob from ephemeris
  await str('createdAt', 64, false);
  await str('updatedAt', 64, false);

  // Index on userId
  try {
    await db.createIndex(DB_ID, 'birth_charts', 'idx_user_id', IndexType.Key, ['userId'], ['ASC']);
    console.log('  ↳ Index on userId created.');
  } catch { /* already exists */ }

  console.log('  ✅  birth_charts ready.');
}

// ─── main ────────────────────────────────────────────────────────────────────

(async () => {
  console.log('🪐  AstroAI — Appwrite Setup');
  console.log(`   Endpoint : ${ENDPOINT}`);
  console.log(`   Project  : ${PROJECT_ID}`);
  console.log(`   Database : ${DB_ID}\n`);

  await ensureDatabase();
  await createUserDetailsCollection();
  await createBirthChartsCollection();

  console.log('\n🎉  Setup complete!');
  console.log('   Update .env.local with the IDs below if you used different names:');
  console.log(`   NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}`);
  console.log(`   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=user_details`);
  console.log(`   NEXT_PUBLIC_APPWRITE_CHARTS_COLLECTION_ID=birth_charts`);
})();
