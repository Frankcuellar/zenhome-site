#!/usr/bin/env node
/**
 * verify-site.mjs — Verificación de indexación post-deploy para ZenHome.
 *
 * Crawlea el sitemap en vivo y valida, para CADA URL, que Google verá una
 * página indexable: HTTP 200 (sin redirección), canonical apuntando a sí misma,
 * sin meta robots noindex, y con JSON-LD presente. Detecta de raíz los problemas
 * recurrentes (URL redirigida dentro del sitemap, página caída, noindex accidental,
 * schema roto) en segundos en vez de descubrirlos semanas después en GSC.
 *
 * Dos pasadas:
 *   1) ORIGEN (con cache-buster) — verifica que lo DESPLEGADO es correcto.
 *      Si algo falla aquí, es un error real del build/deploy → exit 1.
 *   2) PÚBLICA (URL limpia) — verifica lo que Google ve de verdad.
 *      Si difiere (p.ej. 301 servido desde caché de Cloudflare) → AVISO + hint
 *      de purgar caché. No tumba el job salah, pero queda visible.
 *
 * Uso:  node verify-site.mjs            (usa https://zenhome.com.mx)
 *       BASE_URL=https://... node verify-site.mjs
 *       STRICT_PUBLIC=1 node verify-site.mjs   (avisos públicos también fallan)
 */

const BASE = (process.env.BASE_URL || 'https://zenhome.com.mx').replace(/\/$/, '')
const STRICT_PUBLIC = process.env.STRICT_PUBLIC === '1'
const UA = 'ZenHomeVerifyBot/1.0 (+post-deploy check)'

const norm = (u) => u.replace(/\/$/, '').split('#')[0]
const pick = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null }

// Extractores AGNÓSTICOS AL ORDEN de atributos (un canonical con href antes de
// rel no debe dar falso negativo — error histórico documentado en GSC).
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return m ? m[1].trim() : null
}
function findCanonical(html) {
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    if (/\brel\s*=\s*["']?canonical["']?/i.test(tag)) return attr(tag, 'href')
  }
  return null
}
function findRobots(html) {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0]
    if (/\bname\s*=\s*["']?robots["']?/i.test(tag)) return attr(tag, 'content') || ''
  }
  return ''
}

async function fetchSitemapUrls() {
  const res = await fetch(`${BASE}/sitemap.xml?_v=${Date.now()}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`No se pudo leer el sitemap (HTTP ${res.status})`)
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

// Extrae rutas internas de los <a href> de una página (para detectar el defecto
// "enlace interno que rebota en 3xx" — la causa raíz encontrada en otros sitios
// del portafolio: href sin diagonal final apuntando a una URL que canoniza con
// diagonal, generando un 308 en cada rastreo de Google).
function internalLinks(html, baseUrl) {
  const out = new Set()
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    let h = m[1].trim()
    if (/^(#|mailto:|tel:|javascript:)/i.test(h)) continue
    try {
      const u = new URL(h, baseUrl)
      if (u.host !== new URL(baseUrl).host) continue       // solo enlaces internos
      if (u.pathname.startsWith('/cdn-cgi/')) continue      // infra Cloudflare
      out.add(u.pathname)
    } catch { /* href inválido, ignorar */ }
  }
  return out
}

async function checkOrigin(url) {
  const probe = `${url}${url.includes('?') ? '&' : '?'}_v=${Date.now()}`
  const errs = [], warns = []
  let res
  try { res = await fetch(probe, { redirect: 'manual', headers: { 'User-Agent': UA } }) }
  catch (e) { return { url, errs: [`fetch falló: ${e.message}`], warns, links: new Set() } }

  if (res.status >= 300 && res.status < 400)
    errs.push(`origen redirige (${res.status} → ${res.headers.get('location') || '?'})`)
  else if (res.status !== 200)
    errs.push(`status ${res.status} (se esperaba 200)`)

  let links = new Set()
  if (res.status === 200) {
    const html = await res.text()
    const robots = findRobots(html)
    if (/noindex/i.test(robots)) errs.push(`tiene meta robots NOINDEX ("${robots}")`)
    const canonical = findCanonical(html)
    if (!canonical) errs.push('sin <link rel="canonical">')
    else if (norm(canonical) !== norm(url)) errs.push(`canonical apunta a otra URL (${canonical})`)
    if (!/application\/ld\+json/i.test(html)) warns.push('sin JSON-LD (schema)')
    const title = pick(html, /<title>([^<]*)<\/title>/i)
    if (!title || title.length < 10) warns.push('title vacío o muy corto')
    links = internalLinks(html, url)
  }
  return { url, errs, warns, links }
}

// Verifica que ningún enlace interno del sitio rebote en 3xx (defecto de
// href sin/con diagonal incorrecta). Devuelve la lista de targets que redirigen.
async function checkInternalLinks(results) {
  const targets = new Set()
  for (const r of results) for (const p of r.links) targets.add(p)
  const redirecting = []
  for (const t of targets) {
    try {
      const r = await fetch(`${BASE}${t}`, { redirect: 'manual', headers: { 'User-Agent': UA } })
      if (r.status >= 300 && r.status < 400) redirecting.push(`${t} (${r.status})`)
    } catch { /* ignorar errores de red puntuales */ }
  }
  return redirecting
}

async function checkPublic(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': UA } })
    if (res.status >= 300 && res.status < 400)
      return `${url} → Google ve un ${res.status} (redirección). Origen está OK ⇒ es CACHÉ stale de Cloudflare. Purga la caché de esa URL.`
    if (res.status !== 200) return `${url} → Google ve un ${res.status}.`
  } catch (e) { return `${url} → error público: ${e.message}` }
  return null
}

async function main() {
  console.log(`🔎 Verificando indexación de ${BASE}\n`)
  const urls = await fetchSitemapUrls()
  console.log(`   Sitemap: ${urls.length} URLs\n`)

  const results = []
  for (const u of urls) results.push(await checkOrigin(u))

  const failed = results.filter((r) => r.errs.length)
  const warned = results.filter((r) => r.warns.length)

  // Enlaces internos que rebotan en 3xx (defecto tipo Vivens)
  const redirectingLinks = await checkInternalLinks(results)

  // Pasada pública (lo que Google ve) sobre las URLs cuyo origen está OK
  const publicNotes = []
  for (const r of results) {
    if (r.errs.length) continue
    const note = await checkPublic(r.url)
    if (note) publicNotes.push(note)
  }

  if (warned.length) {
    console.log('⚠️  Avisos (no bloquean):')
    warned.forEach((r) => r.warns.forEach((w) => console.log(`   • ${r.url} — ${w}`)))
    console.log('')
  }
  if (publicNotes.length) {
    console.log('🟡 Diferencia entre origen y lo que ve Google (revisar caché/reglas Cloudflare):')
    publicNotes.forEach((n) => console.log(`   • ${n}`))
    console.log('')
  }

  let hardFail = false
  if (failed.length) {
    console.error('🚫 FALLOS DE INDEXACIÓN (origen):')
    failed.forEach((r) => r.errs.forEach((e) => console.error(`   • ${r.url} — ${e}`)))
    console.error(`\n   ${failed.length}/${urls.length} URLs del sitemap con problema.\n`)
    hardFail = true
  }
  if (redirectingLinks.length) {
    console.error('🚫 ENLACES INTERNOS QUE REBOTAN EN 3xx (cada rastreo de Google los penaliza):')
    redirectingLinks.forEach((l) => console.error(`   • ${l}`))
    console.error('   → corrige los href en el HTML para que apunten a la forma canónica.\n')
    hardFail = true
  }
  if (hardFail) process.exit(1)

  if (STRICT_PUBLIC && publicNotes.length) {
    console.error('🚫 STRICT_PUBLIC: hay URLs que Google ve mal (caché/redirección).')
    process.exit(1)
  }

  console.log(`✅ OK: ${urls.length} URLs del sitemap indexables (200, self-canonical, sin noindex) y 0 enlaces internos que rebotan.`)
  if (publicNotes.length) console.log(`   (con ${publicNotes.length} aviso(s) de caché — ver arriba)`)
}

main().catch((e) => { console.error('❌ verify-site falló:', e.message); process.exit(1) })
