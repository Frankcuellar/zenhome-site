#!/usr/bin/env node
/**
 * fix-slugs.js — Corrige los slugs malformados (links de Facebook) en Sanity.
 * Sprint técnico SEO 10-jun-2026.
 *
 * Uso:
 *   SANITY_TOKEN=sk... node fix-slugs.js           # dry-run (muestra qué haría)
 *   SANITY_TOKEN=sk... node fix-slugs.js --apply   # aplica los cambios
 *   SANITY_TOKEN=sk... node fix-slugs.js --apply --delete-test  # además borra el doc de prueba
 *
 * El token se crea en: https://www.sanity.io/manage/project/qql4bn7x/api
 * (Tokens → Add API token → permisos "Editor"). No lo pegues en ningún chat.
 */

const PROJECT = 'qql4bn7x'
const DATASET = 'production'
const API = 'v2024-01-01'
const TOKEN = process.env.SANITY_TOKEN

const FIXES = {
  '0cb12133-ffe1-49b3-b958-98fe40309170': 'cocina-integral-pedregal-linda-vista',
  '0fc08ae7-98a8-4056-8bc4-81c584952752': 'cocina-integral-montealban-monterrey',
  '52a58d0d-8f12-4b79-8699-8e203f52194e': 'cocina-de-lujo-samara-monterrey',
  'bc3bf05e-3143-4759-b04e-0a15a719e156': 'cocina-integral-canteras-platino',
}
const TEST_DOC = 'test-proyecto-001'

const APPLY = process.argv.includes('--apply')
const DELETE_TEST = process.argv.includes('--delete-test')

async function main() {
  if (!TOKEN) {
    console.error('❌ Falta SANITY_TOKEN. Uso: SANITY_TOKEN=sk... node fix-slugs.js [--apply]')
    process.exit(1)
  }

  // 1. Estado actual: docs publicados Y sus drafts (si existen)
  const ids = Object.keys(FIXES)
  const allIds = [...ids, ...ids.map((i) => `drafts.${i}`), TEST_DOC, `drafts.${TEST_DOC}`]
  const query = `*[_id in ${JSON.stringify(allIds)}]{_id, title, "slug": slug.current}`
  const qres = await fetch(
    `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  ).then((r) => r.json())
  if (qres.error) {
    console.error('❌ Error de query (¿token válido?):', JSON.stringify(qres.error))
    process.exit(1)
  }
  const docs = qres.result || []

  // 2. Construir mutaciones solo para docs cuyo slug siga siendo inválido
  const mutations = []
  for (const doc of docs) {
    if (doc._id === TEST_DOC || doc._id === `drafts.${TEST_DOC}`) continue
    const baseId = doc._id.replace(/^drafts\./, '')
    const newSlug = FIXES[baseId]
    if (!newSlug) continue
    if (doc.slug === newSlug) {
      console.log(`✓ ${doc._id} ya tiene el slug correcto, sin cambios`)
      continue
    }
    if (!/^https?:/.test(doc.slug || '')) {
      console.log(`⚠️  ${doc._id} tiene slug "${doc.slug}" (no es link de Facebook) — lo omito por seguridad`)
      continue
    }
    mutations.push({ patch: { id: doc._id, set: { 'slug.current': newSlug } } })
    console.log(`→ ${doc._id}\n   "${doc.slug}"\n   ⇒ "${newSlug}"`)
  }
  const testDocs = docs.filter((d) => d._id === TEST_DOC || d._id === `drafts.${TEST_DOC}`)
  if (DELETE_TEST) {
    for (const d of testDocs) {
      mutations.push({ delete: { id: d._id } })
      console.log(`→ DELETE ${d._id} ("${d.title}")`)
    }
  } else if (testDocs.length) {
    console.log(`ℹ️  Doc de prueba "${testDocs[0].title}" existe — usa --delete-test para borrarlo`)
  }

  if (!mutations.length) {
    console.log('\nNada que hacer.')
    return
  }
  if (!APPLY) {
    console.log(`\n🔍 DRY RUN — ${mutations.length} mutación(es) pendientes. Corre con --apply para ejecutar.`)
    return
  }

  // 3. Aplicar
  const mres = await fetch(`https://${PROJECT}.api.sanity.io/${API}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ mutations }),
  }).then((r) => r.json())
  if (mres.error) {
    console.error('❌ Error al mutar:', JSON.stringify(mres.error))
    process.exit(1)
  }
  console.log(`\n✅ ${mres.results?.length ?? 0} mutación(es) aplicadas. Transaction: ${mres.transactionId}`)
  console.log('Siguiente paso: push al repo (o empty commit) para que CF Pages rebuilde con los slugs nuevos.')
}

main().catch((e) => { console.error('❌', e.message); process.exit(1) })
