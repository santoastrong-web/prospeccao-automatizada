/**
 * Sync Leads to leads.json for Vercel Deploy
 *
 * Uso: node scripts/sync-leads.js
 *
 * Lê do SQLite local (~/.operacao-ia/data/prospects.db)
 * Escreve em ./leads.json (commitado no git)
 * Deploy no Vercel pega o leads.json atualizado
 */

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.operacao-ia', 'data', 'prospects.db');
// Escreve no repositório principal para o Vercel fazer deploy
const REPO_ROOT = 'C:\\Users\\Lucas\\teste-claude\\automacao';
const OUT_PATH = path.join(REPO_ROOT, 'dashboards', 'leads.json');

async function main() {
  console.log('🔄 Sincronizando leads para Vercel...');
  console.log(`📂 DB: ${DB_PATH}`);
  console.log(`📄 Out: ${OUT_PATH}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Banco de dados não encontrado:', DB_PATH);
    process.exit(1);
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  try {
    // Detectar schema da tabela
    const tableInfo = await db.all("PRAGMA table_info(prospects)");
    const columns = tableInfo.map(c => c.name);
    const hasStatus = columns.includes('status');
    const hasLastSentAt = columns.includes('last_sent_at');
    const hasStepCols = columns.includes('step1_sent_at');

    console.log(`📋 Schema detectado: status=${hasStatus}, last_sent_at=${hasLastSentAt}, step_cols=${hasStepCols}`);

    const selectCols = [
      'id', 'business_name', 'phone', 'email', 'website', 'segment', 'location',
      'rating', 'reviews_count', 'score', 'temperature', 'potential',
      'price', 'contact_name', 'source', 'current_step', 'channel',
      'responded', 'responded_at',
      hasStatus ? 'status' : 'NULL as status',
      hasStepCols ? 'step1_sent_at, step2_sent_at, step3_sent_at, step4_sent_at, step5_sent_at, step6_sent_at, step7_sent_at' : 'NULL as step1_sent_at, NULL as step2_sent_at, NULL as step3_sent_at, NULL as step4_sent_at, NULL as step5_sent_at, NULL as step6_sent_at, NULL as step7_sent_at',
      hasLastSentAt ? 'last_sent_at' : 'NULL as last_sent_at',
      'created_at', 'updated_at', 'notes', 'raw_data'
    ].join(', ');

    const rows = await db.all(`
      SELECT ${selectCols}
      FROM prospects
      ORDER BY score DESC, current_step ASC
    `);

    console.log(`✅ ${rows.length} leads encontrados`);

    // Normaliza para o formato do dashboard
    const leads = rows.map(row => ({
      id: row.id,
      business_name: row.business_name,
      phone: row.phone,
      email: row.email,
      website: row.website,
      segment: row.segment,
      location: row.location,
      rating: row.rating,
      reviews_count: row.reviews_count,
      score: row.score,
      temperature: row.temperature,
      potential: row.potential,
      price: row.price,
      contact_name: row.contact_name,
      source: row.source,
      current_step: row.current_step,
      channel: row.channel,
      responded: row.responded === 1,
      responded_at: row.responded_at,
      status: row.status,
      step1_sent_at: row.step1_sent_at,
      step2_sent_at: row.step2_sent_at,
      step3_sent_at: row.step3_sent_at,
      step4_sent_at: row.step4_sent_at,
      step5_sent_at: row.step5_sent_at,
      step6_sent_at: row.step6_sent_at,
      step7_sent_at: row.step7_sent_at,
      last_sent_at: row.last_sent_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      notes: row.notes,
      raw_data: row.raw_data,
    }));

    fs.writeFileSync(OUT_PATH, JSON.stringify(leads, null, 2), 'utf-8');
    console.log('✅ leads.json atualizado');

    // Stats rápidas
    const stats = {
      total: leads.length,
      quente: leads.filter(l => l.temperature === 'quente').length,
      morno: leads.filter(l => l.temperature === 'morno').length,
      frio: leads.filter(l => l.temperature === 'frio').length,
      responded: leads.filter(l => l.responded).length,
      avgScore: leads.length > 0
        ? Math.round((leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length) * 10) / 10
        : 0,
    };
    console.log('📊 Stats:', stats);

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();