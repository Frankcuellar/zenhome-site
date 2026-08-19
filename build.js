#!/xusr/bin/env node
/**
 * ZenHome Portfolio Builder
 *
 * Fetches projects from Sanity CMS and generates static HTML pages
 * for Cloudflare Pages deployment.
 *
 * Usage: node scripts/build.js
 *
 * Required env vars:
 *   SANITY_PROJECT_ID  - Your Sanity project ID
 *   SANITY_DATASET     - Dataset name (default: "production")
 *   SANITY_TOKEN       - Read token (optional for public datasets)
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// ─── Config ───
const PROJECT_ID = process.env.SANITY_PROJECT_ID
const DATASET = process.env.SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_TOKEN || ''
const OUTPUT_DIR = path.resolve(__dirname, 'proyectos')

if (!PROJECT_ID) {
  console.error('❌ Falta SANITY_PROJECT_ID. Configura tu archivo .env')
  process.exit(1)
}

// ─── Sanity API fetch ───
function sanityFetch(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query)
    const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encoded}`
    const options = {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            console.error('Sanity API error:', parsed.error)
            reject(new Error(parsed.error.description || parsed.error.type || 'Unknown Sanity error'))
            return
          }
          resolve(parsed.result || [])
        } catch (e) {
          console.error('Failed to parse Sanity response:', data.substring(0, 500))
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// ─── Image URL builder ───
function imageUrl(ref, width = 600) {
  if (!ref || !ref.asset || !ref.asset._ref) return ''
  // Convert sanity image ref to URL
  // Format: image-{id}-{dimensions}-{format}
  const parts = ref.asset._ref.replace('image-', '').split('-')
  const id = parts.slice(0, -2).join('-')
  const dimensions = parts[parts.length - 2]
  const format = parts[parts.length - 1]
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dimensions}.${format}?w=${width}&auto=format`
}

// ─── Block content to HTML ───
function blocksToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      if (block._type === 'block') {
        const text = (block.children || [])
          .map((child) => {
            let t = escapeHtml(child.text || '')
            if (child.marks && child.marks.includes('strong')) t = `<strong>${t}</strong>`
            if (child.marks && child.marks.includes('em')) t = `<em>${t}</em>`
            return t
          })
          .join('')
        if (block.style === 'h2') return `<h2>${text}</h2>`
        if (block.style === 'h3') return `<h3>${text}</h3>`
        if (block.listItem === 'bullet') return `<li>${text}</li>`
        return `<p>${text}</p>`
      }
      return ''
    })
    .join('\n')
}

function escapeHtml(str) {
    if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Category labels ───
const CATEGORY_LABELS = {
  cocina: 'Cocina Integral',
  closet: 'Clóset / Vestidor',
  interior: 'Diseño de Interiores',
  constructora: 'Constructoras',
}

const CATEGORY_TAGS = {
  cocina: 'COCINA INTEGRAL',
  closet: 'CLÓSET / VESTIDOR',
  interior: 'DISEÑO DE INTERIORES',
  constructora: 'CONSTRUCTORAS',
}

// ─── Tag display names (slug → pretty label with accents) ───
const SLUG_LABELS = {
  // Materials
  'granito-natural': 'Granito Natural',
  'mdf-blanco-mate': 'MDF Blanco Mate',
  'madera-encino': 'Madera de Encino',
  'cuarzo': 'Cuarzo',
  'cuarzo-blanco': 'Cuarzo Blanco',
  'cuarzo-negro': 'Cuarzo Negro',
  'marmol': 'Mármol',
  'acero-inoxidable': 'Acero Inoxidable',
  'melamina': 'Melamina',
  'laminado': 'Laminado',
  'madera-nogal': 'Madera de Nogal',
  'madera-parota': 'Madera de Parota',
  'vidrio-templado': 'Vidrio Templado',
  // Styles
  'moderno': 'Moderno',
  'moderno-calido': 'Moderno Cálido',
  'minimalista': 'Minimalista',
  'clasico': 'Clásico',
  'rustico': 'Rústico',
  'industrial': 'Industrial',
  'contemporaneo': 'Contemporáneo',
  // Zones
  'cumbres': 'Cumbres',
  'carretera-nacional': 'Carretera Nacional',
  'san-pedro': 'San Pedro',
  'apodaca': 'Apodaca',
  'santa-catarina': 'Santa Catarina',
  'guadalupe': 'Guadalupe',
  'escobedo': 'Escobedo',
  'centro': 'Centro',
  'valle': 'Valle',
  'sur': 'Sur de Monterrey',
}

/** Convert a slug to a display label: uses dictionary first, falls back to title case */
function prettyTag(slug) {
  if (!slug) return ''
  if (SLUG_LABELS[slug]) return SLUG_LABELS[slug]
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── SEO helpers ───
const CATEGORY_SEO = {
  cocina: { keyword: 'cocina integral', cta: 'Cotiza tu cocina integral', midCta: '¿Te imaginas tu cocina así?', closeCta: '¿Te gustaría una cocina así en tu hogar?' },
  closet: { keyword: 'clóset a medida', cta: 'Cotiza tu clóset', midCta: '¿Te imaginas tu vestidor así?', closeCta: '¿Te gustaría un vestidor así?' },
  interior: { keyword: 'diseño de interiores', cta: 'Cotiza tu proyecto', midCta: '¿Te imaginas tu espacio así?', closeCta: '¿Imaginas tu espacio con este nivel de diseño?' },
  constructora: { keyword: 'mobiliario para constructoras', cta: 'Cotiza tu proyecto', midCta: '¿Te imaginas un resultado así?', closeCta: '¿Listo para un resultado así en tu desarrollo?' },
}

// Extract city name from location string (e.g. "Samara Residencial, Apodaca, Nuevo León" → "Apodaca")
function extractCity(location) {
  if (!location) return ''
  const parts = location.split(',').map(s => s.trim())
  // If 3+ parts, second is likely city; if 2 parts, first is city; if 1 part, use it
  if (parts.length >= 3) return parts[1]
  if (parts.length === 2) return parts[0]
  return parts[0]
}

function generateSeoTitle(p) {
  const cat = CATEGORY_LABELS[p.category] || 'Proyecto'
  const materials = (p.materials || []).slice(0, 2).map(m => prettyTag(m)).join(' con ')
  const matText = materials ? ` de ${materials}` : ''
  const style = !materials && p.style ? ` ${prettyTag(p.style)}` : ''
  const city = extractCity(p.location) || 'Monterrey'
  return `${cat}${style}${matText} en ${city} | ZenHome Monterrey`
}

// Inserta un calificativo antes del sufijo de marca: "X | ZenHome" → "X — Colonia | ZenHome"
function insertTitleQualifier(title, qualifier) {
  const i = title.lastIndexOf(' | ')
  return i === -1 ? `${title} — ${qualifier}` : `${title.slice(0, i)} — ${qualifier}${title.slice(i)}`
}

// Un título AUTOGENERADO que choca con otro no debe detener la línea (paro 03→17-ago, PM-005):
// se desambigua solo con la colonia/zona real y se avisa. El hard-fail se reserva para
// dos `seoTitle` EXPLÍCITOS iguales, que sí son un error editorial que nadie más puede resolver.
function disambiguateSeoTitle(base, p, taken) {
  const parts = String(p.location || '').split(',').map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    if (!base.toLowerCase().includes(part.toLowerCase())) {
      const candidate = insertTitleQualifier(base, part)
      if (!taken.has(candidate)) return candidate
    }
  }
  const slugWords = String(p.slug?.current || '')
    .split('-')
    .filter((w) => w.length > 3 && !base.toLowerCase().includes(w))
    .slice(0, 2)
    .join(' ')
  if (slugWords) {
    const candidate = insertTitleQualifier(base, slugWords)
    if (!taken.has(candidate)) return candidate
  }
  let n = 2
  while (taken.has(insertTitleQualifier(base, String(n)))) n++
  return insertTitleQualifier(base, String(n))
}

function generateSeoDescription(p) {
  const cat = CATEGORY_LABELS[p.category] || 'Proyecto'
  const materials = (p.materials || []).slice(0, 3).map(m => prettyTag(m)).join(', ')
  const matText = materials ? ` Acabados en ${materials}.` : ''
  const city = extractCity(p.location) || 'Monterrey'
  return `${cat} a medida en ${city}, N.L.${matText} Diseño, fotos y resultado final. +300 proyectos entregados en Monterrey.`
}

// WhatsApp SVG icon (reusable)
const WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.003-1.956l-.42-.317-2.65.889.889-2.65-.317-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>'

// ─── Format date ───
function formatDate(dateStr) {
  if (!dateStr) return ''
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  const d = new Date(dateStr + 'T00:00:00')
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Templates ───
function projectCardHtml(p) {
  const img = imageUrl(p.heroImage, 600)
  const slug = p.slug?.current || ''
  return `
    <a href="/proyectos/${slug}/" class="project-card" data-category="${p.category || ''}">
      <img src="${img}" alt="${escapeHtml(p.title)}" class="project-card-img" loading="lazy"/>
      <div class="project-card-body">
        <span class="project-card-tag">${CATEGORY_TAGS[p.category] || ''}</span>
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="project-card-meta">
          <span>📍 ${escapeHtml(p.location || '')}</span>
        </div>
        <div class="project-card-cta">Ver proyecto completo →</div>
      </div>
    </a>`
}

function projectPageHtml(p, relatedProjects) {
  const heroImg = imageUrl(p.heroImage, 1200)
  const slug = p.slug?.current || ''
  const dateStr = formatDate(p.deliveryDate)
  const tag = CATEGORY_TAGS[p.category] || ''
  const seo = CATEGORY_SEO[p.category] || CATEGORY_SEO.interior
  const catLabel = CATEGORY_LABELS[p.category] || 'Proyecto'

  // Dynamic SEO meta
  const seoTitle = escapeHtml(p.seoTitle || generateSeoTitle(p))
  const seoDesc = escapeHtml(p.seoDescription || generateSeoDescription(p))

  // Specs as grid cards
  const specsCards = (p.specs || [])
    .map((s) => `      <div class="spec-card"><span class="spec-label">${escapeHtml(s.label)}</span><span class="spec-value">${escapeHtml(s.value)}</span></div>`)
    .join('\n')

  // ── Galería v2: principal (hero) + "El resultado" (después) + "Antes y proceso" ──
  // La fase se infiere del caption. Si el Studio agrega el campo `phase` ('antes'|'proceso'|'despues'), se respeta.
  function classifyPhase(img) {
    const explicit = (img.phase || '').toString().toLowerCase()
    if (explicit === 'antes' || explicit === 'proceso' || explicit === 'despues') return explicit
    const c = img.caption || ''
    if (/proceso|instalaci|construcci|carpinter|estructura|montaje|demolici|obra negra|avance|durante|integramos/i.test(c)) return 'proceso'
    if (/antes|recibimos|recibi|encontramos|nos encontr|espacio libre|retirad|previo|original|as[ií] estaba|como estaba|rectificaci|primera visita|toma de medidas/i.test(c)) return 'antes'
    return 'despues'
  }
  const heroRef = p.heroImage && p.heroImage.asset && p.heroImage.asset._ref
  const galleryTagged = (p.gallery || []).map((img) => ({ ...img, _phase: classifyPhase(img) }))
  // Dedupe: si una foto de la galería ES el hero principal, no repetirla
  const galleryDedup = galleryTagged.filter((img) => !(heroRef && img.asset && img.asset._ref === heroRef))
  const despuesAll = galleryDedup.filter((img) => img._phase === 'despues')
  const antesImgs = galleryDedup
    .filter((img) => img._phase !== 'despues')
    .sort((a, b) => (a._phase === 'antes' ? 0 : 1) - (b._phase === 'antes' ? 0 : 1))

  // Imagen principal: hero del proyecto; si no hay, el primer "después"; si no, la primera disponible
  const principal = p.heroImage || despuesAll[0] || galleryDedup[0] || null
  const despuesGrid = despuesAll.filter((x) => x !== principal)
  const antesGrid = antesImgs.filter((x) => x !== principal)

  const hasGallery = !!principal
  // Orden del lightbox: principal → después → antes/proceso
  const lightboxImgs = [principal].concat(despuesGrid, antesGrid).filter(Boolean)
  const galleryFull = lightboxImgs.map((img) => imageUrl(img, 1400))

  const PHASE_BADGE = { antes: 'Antes', proceso: 'Proceso' }
  function gridFigure(img, lbIndex) {
    const alt = escapeHtml(img.caption || `${catLabel} - ${p.title}`)
    const badge = PHASE_BADGE[img._phase] ? `<span class="g-badge">${PHASE_BADGE[img._phase]}</span>` : ''
    return `        <figure class="g-cell">${badge}<img src="${imageUrl(img, 800)}" alt="${alt}" loading="lazy" onclick="openLightbox(${lbIndex})"/></figure>`
  }
  let _lbi = 1 // índice 0 = principal
  const despuesHtml = despuesGrid.map((img) => gridFigure(img, _lbi++)).join('\n')
  const antesHtml = antesGrid.map((img) => gridFigure(img, _lbi++)).join('\n')
  const nFotoTxt = (n) => `· ${n} ${n === 1 ? 'foto' : 'fotos'}`
  const principalAlt = escapeHtml((principal && principal.caption) || `${catLabel} terminada - ${p.title}`)
  const galleryHtml = hasGallery ? `
  <figure class="g-hero"><img src="${imageUrl(principal, 1200)}" alt="${principalAlt}" loading="lazy" onclick="openLightbox(0)"/></figure>
  ${despuesHtml ? `<div class="g-block-label">El resultado <span class="g-count">${nFotoTxt(despuesGrid.length)}</span></div>
  <div class="g-grid">
${despuesHtml}
  </div>` : ''}
  ${antesHtml ? `<div class="g-divider"></div>
  <div class="g-block-label">Antes y proceso <span class="g-count">${nFotoTxt(antesGrid.length)}</span></div>
  <p class="g-antes-note">Así recibimos el espacio y cómo lo fuimos transformando.</p>
  <div class="g-grid">
${antesHtml}
  </div>` : ''}` : ''

  // Video
  let videoSection = ''
  if (p.videoUrl) {
    const videoId = p.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
    if (videoId) {
      const videoIntro = `Recorre este proyecto en video y observa los detalles de acabados, materiales y funcionalidad.`
      videoSection = `
  <section class="section-video" id="video">
    <h2>Video del Proyecto</h2>
    <p class="video-intro">${videoIntro}</p>
    <div class="video-wrapper">
      <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="Video de ${escapeHtml(catLabel)} en ${escapeHtml(p.location || 'Monterrey')} - ZenHome" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
    </div>
  </section>`
    }
  }

  // Testimonial (visible en la página; NO va al JSON-LD: Google no acepta
  // "review" dentro de Article — causaba error de Review snippets en GSC)
  let testimonialSection = ''
  if (p.testimonial?.quote) {
    const rating = p.testimonial.rating || 5
    const stars = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating)
    testimonialSection = `
  <section class="section-testimonial">
    <div class="testimonial">
      <div class="stars">${stars}</div>
      <blockquote>\u201C${escapeHtml(p.testimonial.quote)}\u201D</blockquote>
      <cite>\u2014 ${escapeHtml(p.testimonial.author || 'Cliente ZenHome')}</cite>
    </div>
  </section>`
  }

  // Solution
  const solutionHtml = blocksToHtml(p.solution)

  // Tags (materials, style, zone) — use prettyTag() for proper accents & casing.
  // Non-clickable <span> chips: no existen páginas /materiales/, /estilos/, /zonas/
  // todavía, así que enlazarlas generaba 404s internos. Mantenemos el texto (keywords)
  // sin crear enlaces rotos. Si algún día se crean esas landings, volver a <a href>.
  const materialTags = (p.materials || []).map((m) =>
    `<span class="seo-tag">${escapeHtml(prettyTag(m))}</span>`).join('')
  const styleTags = p.style
    ? `<span class="seo-tag">${escapeHtml(prettyTag(p.style))}</span>` : ''
  const zoneTags = p.zone
    ? `<span class="seo-tag">${escapeHtml(prettyTag(p.zone))}</span>` : ''
  const hasTags = materialTags || styleTags || zoneTags

  // Schema about entities
  const aboutEntities = [
    `{"@type": "Thing", "name": "${escapeHtml(catLabel)}"}`,
    ...(p.materials || []).slice(0, 2).map((m) => `{"@type": "Thing", "name": "${escapeHtml(prettyTag(m))}"}`),
    p.location ? `{"@type": "Place", "name": "${escapeHtml(p.location)}, Nuevo León"}` : '',
  ].filter(Boolean)

  // Related projects
  const relatedHtml = relatedProjects
    .map((r) => `
      <a href="/proyectos/${r.slug?.current || ''}/" class="related-card">
        <img src="${imageUrl(r.heroImage, 400)}" alt="${escapeHtml(r.title)}" loading="lazy"/>
        <div class="related-card-body">
          <span class="related-tag">${CATEGORY_TAGS[r.category] || ''}</span>
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.location || '')}</p>
        </div>
      </a>`)
    .join('\n')

  // WA messages (different per CTA placement)
  const waHero = encodeURIComponent(`Hola ZenHome, vi el proyecto "${p.title}" y me interesa algo similar para mi espacio.`)
  const waMid = encodeURIComponent(`Hola ZenHome, me gustó la galería de "${p.title}". ¿Podrían cotizarme algo parecido?`)
  const waClose = encodeURIComponent(`Hola ZenHome, quiero una cotización para mi espacio. Vi su proyecto "${p.title}".`)

  // Money page link for this category
  const moneyPageLink = p.category === 'cocina'
    ? '<a href="/cocinas-integrales-monterrey/">Cocinas Integrales en Monterrey</a>'
    : p.category === 'closet'
    ? '<a href="/closets-monterrey/">Clósets y Vestidores</a>'
    : '<a href="/diseno-interiores-monterrey/">Diseño de Interiores</a>'

  return `<!DOCTYPE html>
<html lang="es-mx">
<head>
<meta charset="utf-8"/>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JSYYXX8Z2K"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JSYYXX8Z2K');</script>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${seoTitle}</title>
<link rel="canonical" href="https://zenhome.com.mx/proyectos/${slug}/"/>
<meta name="description" content="${seoDesc}"/>
<meta property="og:title" content="${seoTitle}"/>
<meta property="og:description" content="${seoDesc}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="https://zenhome.com.mx/proyectos/${slug}/"/>
<meta property="og:locale" content="es_MX"/>
<meta property="og:site_name" content="ZenHome"/>
<meta property="og:image" content="${heroImg}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="robots" content="index, follow"/>
<link rel="icon" href="/favicon.ico" sizes="any"/>
<link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png"/>
<link rel="apple-touch-icon" href="/icon-192.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet"/>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${escapeHtml(p.title)}",
  "description": "${seoDesc}",
  "image": ["${heroImg}"],
  "author": {"@type": "Organization", "name": "ZenHome", "url": "https://zenhome.com.mx"},
  "publisher": {"@type": "Organization", "name": "ZenHome", "url": "https://zenhome.com.mx"},
  "datePublished": "${p.deliveryDate || ''}",
  "mainEntityOfPage": "https://zenhome.com.mx/proyectos/${slug}/",
  "about": [${aboutEntities.join(', ')}],
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://zenhome.com.mx/"},
      {"@type": "ListItem", "position": 2, "name": "Proyectos", "item": "https://zenhome.com.mx/proyectos/"},
      {"@type": "ListItem", "position": 3, "name": "${escapeHtml(p.title)}"}
    ]
  }
}
</script>

<style>
  :root {
    --blue-dark: #000321; --blue: #0038FF; --blue-mid: #1542b0; --blue-light: #3668e5;
    --bg-light: #e7edf9; --bg-soft: #F6F6FF; --bg-warm: #FAFAF7; --gold: #eddb7e;
    --text: #0E182C; --text-muted: #8893A8; --white: #ffffff; --green-wa: #25D366;
    --border: #e8ecf4; --radius: 12px; --radius-sm: 8px;
    --shadow: 0 2px 8px rgba(0,3,33,0.08); --shadow-md: 0 4px 16px rgba(0,3,33,0.12);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Roboto', sans-serif; color: var(--text); background: var(--white); line-height: 1.7; -webkit-font-smoothing: antialiased; }

  /* ── Header ── */
  .zh-header { background: var(--blue-dark); padding: 0 40px; height: 70px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .zh-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--white); font-size: 22px; font-weight: 700; }
  .zh-logo img { height: 40px; width: auto; }
  .zh-nav { display: flex; align-items: center; gap: 8px; }
  .zh-nav a { color: var(--white); text-decoration: none; font-size: 14px; padding: 8px 16px; border-radius: 6px; transition: background 0.2s; }
  .zh-nav a:hover, .zh-nav a.active { background: var(--blue-light); }
  .zh-nav-cta { background: var(--gold) !important; color: var(--blue-dark) !important; font-weight: 500 !important; padding: 10px 20px !important; border-radius: 8px !important; display: flex; align-items: center; gap: 6px; }
  .zh-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
  .zh-hamburger span { display: block; width: 24px; height: 2px; background: white; margin: 5px 0; }
  @media (max-width: 768px) {
    .zh-header { padding: 0 20px; }
    .zh-hamburger { display: block; }
    .zh-nav { display: none; position: absolute; top: 70px; left: 0; right: 0; background: var(--blue-dark); flex-direction: column; padding: 20px; gap: 4px; }
    .zh-nav.open { display: flex; }
    .zh-nav a { width: 100%; padding: 12px 16px; }
  }

  /* ── Breadcrumb ── */
  .breadcrumb { padding: 16px 40px; font-size: 14px; color: var(--text-muted); background: var(--bg-soft); border-bottom: 1px solid var(--border); }
  .breadcrumb a { color: var(--blue); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  @media (max-width: 768px) { .breadcrumb { padding: 12px 20px; } }

  /* ── Split Hero ── */
  .split-hero { display: flex; gap: 40px; max-width: 1100px; margin: 0 auto; padding: 40px; align-items: center; }
  .split-hero__info { flex: 1; min-width: 0; }
  .split-hero__image { flex: 1.2; min-width: 0; }
  .split-hero__image img { width: 100%; border-radius: var(--radius); box-shadow: var(--shadow-md); display: block; }
  .split-hero__tag { display: inline-block; background: var(--bg-light); color: var(--blue); font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .split-hero h1 { font-size: clamp(24px, 3.5vw, 34px); font-weight: 900; line-height: 1.2; margin-bottom: 16px; color: var(--blue-dark); }
  .split-hero__meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: var(--text-muted); margin-bottom: 20px; }
  .split-hero__meta span { display: flex; align-items: center; gap: 5px; }
  .split-hero__desc { font-size: 16px; color: var(--text); margin-bottom: 24px; line-height: 1.7; }
  .hero-cta { display: inline-flex; align-items: center; gap: 10px; background: var(--green-wa); color: var(--white); text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 30px; box-shadow: 0 4px 16px rgba(37,211,102,0.3); transition: transform 0.2s; }
  .hero-cta:hover { transform: scale(1.03); }
  .hero-cta svg { width: 18px; height: 18px; }
  @media (max-width: 768px) {
    .split-hero { flex-direction: column-reverse; padding: 24px 20px; gap: 24px; }
  }

  /* ── Article body ── */
  .article { max-width: 860px; margin: 0 auto; padding: 0 40px 40px; }
  @media (max-width: 768px) { .article { padding: 0 20px 24px; } }
  .article h2 { font-size: 22px; font-weight: 700; margin: 36px 0 14px; color: var(--blue-dark); }
  .article p { margin-bottom: 16px; font-size: 16px; }

  /* ── Challenge block ── */
  .challenge-block { background: var(--bg-warm); border-left: 4px solid var(--gold); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 24px 28px; margin: 24px 0; }
  .challenge-block p { margin: 0; }

  /* ── Specs grid ── */
  .specs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin: 20px 0 32px; }
  .spec-card { background: var(--bg-soft); border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; gap: 4px; }
  .spec-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
  .spec-value { font-size: 16px; font-weight: 600; color: var(--blue-dark); }

  /* ── Gallery v2 (principal + resultado + antes/proceso) ── */
  .gallery-v2 { margin: 20px 0 36px; }
  .g-hero { margin: 0 0 8px; }
  .g-hero img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: var(--radius); box-shadow: var(--shadow-md); display: block; cursor: pointer; }
  .g-block-label { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text); margin: 30px 0 14px; }
  .g-block-label::before { content: ""; width: 26px; height: 3px; background: var(--gold); border-radius: 2px; }
  .g-block-label .g-count { color: var(--text-muted); font-weight: 500; letter-spacing: 0; }
  .g-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .g-cell { margin: 0; position: relative; }
  .g-cell img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius-sm); box-shadow: var(--shadow); cursor: pointer; transition: transform 0.2s; display: block; }
  .g-cell img:hover { transform: scale(1.02); }
  .g-badge { position: absolute; top: 8px; left: 8px; background: rgba(14,24,44,0.72); color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 9px; border-radius: 6px; }
  .g-divider { height: 1px; background: var(--border); margin: 38px 0 0; }
  .g-antes-note { font-size: 13px; color: var(--text-muted); margin: 0 0 14px; }
  @media (max-width: 600px) {
    .g-grid { grid-template-columns: repeat(2, 1fr); }
    .g-hero img { aspect-ratio: 4 / 3; }
  }

  /* ── Lightbox ── */
  .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; align-items: center; justify-content: center; }
  .lightbox.active { display: flex; }
  .lightbox img { max-width: 90vw; max-height: 85vh; border-radius: 8px; object-fit: contain; }
  .lightbox-close { position: absolute; top: 20px; right: 24px; color: white; font-size: 32px; cursor: pointer; background: none; border: none; z-index: 10; }
  .lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); color: white; font-size: 40px; cursor: pointer; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .lightbox-nav:hover { background: rgba(255,255,255,0.2); }
  .lightbox-prev { left: 16px; }
  .lightbox-next { right: 16px; }

  /* ── Video ── */
  .section-video { margin: 36px 0; }
  .video-intro { font-size: 15px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6; }
  .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); margin: 0 0 36px; box-shadow: var(--shadow-md); }
  .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }

  /* ── Tags ── */
  .tags-section { margin: 32px 0; }
  .tags-group { margin-bottom: 12px; }
  .tags-group-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
  .seo-tag { display: inline-block; background: var(--bg-light); color: var(--blue); font-size: 13px; font-weight: 500; padding: 4px 14px; border-radius: 14px; margin: 3px 4px 3px 0; text-transform: capitalize; cursor: default; }

  /* ── Testimonial ── */
  .testimonial { background: var(--bg-light); border-radius: var(--radius); padding: 28px; margin: 32px 0; border-left: 4px solid var(--blue); }
  .testimonial blockquote { font-size: 16px; font-style: italic; margin-bottom: 10px; }
  .testimonial cite { font-size: 14px; color: var(--text-muted); font-style: normal; font-weight: 600; }
  .testimonial .stars { color: #f59e0b; font-size: 18px; margin-bottom: 8px; }

  /* ── Result ── */
  .section-result { background: var(--bg-soft); border-radius: var(--radius); padding: 28px; margin: 32px 0; }
  .section-result h2 { margin-top: 0; }

  /* ── CTA inline ── */
  .cta-inline { background: linear-gradient(135deg, var(--blue-dark) 0%, var(--blue-mid) 100%); color: var(--white); border-radius: var(--radius); padding: 36px; text-align: center; margin: 40px 0; }
  .cta-inline h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .cta-inline p { opacity: 0.85; margin-bottom: 20px; font-size: 15px; }
  .cta-wa-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--green-wa); color: var(--white); text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 30px; box-shadow: 0 4px 16px rgba(37,211,102,0.3); transition: transform 0.2s; }
  .cta-wa-btn:hover { transform: scale(1.03); }
  .cta-wa-btn svg { width: 20px; height: 20px; }
  .cta-micro { font-size: 13px; opacity: 0.6; margin-top: 8px; }
  .cta-mid { background: var(--bg-warm); border-radius: var(--radius); padding: 28px; text-align: center; margin: 36px 0; border: 1px solid var(--border); }
  .cta-mid h3 { font-size: 20px; font-weight: 700; color: var(--blue-dark); margin-bottom: 12px; }

  /* ── Related ── */
  .related { margin: 48px 0 0; }
  .related h2 { font-size: 22px; margin-bottom: 20px; }
  .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .related-card { text-decoration: none; color: inherit; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: transform 0.2s; }
  .related-card:hover { transform: translateY(-3px); }
  .related-card img { width: 100%; height: 180px; object-fit: cover; }
  .related-card-body { padding: 14px 16px; }
  .related-tag { font-size: 11px; font-weight: 600; color: var(--blue); text-transform: uppercase; letter-spacing: 0.3px; }
  .related-card h3 { font-size: 15px; font-weight: 600; margin-top: 4px; }
  .related-card p { font-size: 13px; color: var(--text-muted); }
  @media (max-width: 768px) { .related-grid { grid-template-columns: 1fr; } }

  /* ── SEO links footer ── */
  .seo-links { background: var(--bg-soft); border-top: 1px solid var(--border); padding: 28px 0; margin-top: 48px; }
  .seo-links__inner { max-width: 860px; margin: 0 auto; padding: 0 40px; display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
  .seo-links a { color: var(--blue); text-decoration: none; font-size: 14px; font-weight: 500; }
  .seo-links a:hover { text-decoration: underline; }
  @media (max-width: 768px) { .seo-links__inner { padding: 0 20px; gap: 16px; } }

  /* ── Footer ── */
  .zh-footer { background: var(--blue-dark); color: var(--white); text-align: center; padding: 32px 40px; font-size: 14px; opacity: 0.7; }
  .zh-footer a { color: var(--gold); text-decoration: none; }

  /* ── WhatsApp float ── */
  .zh-wa-float { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .zh-wa-float__btn { width: 56px; height: 56px; border-radius: 50%; background: var(--green-wa); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,211,102,0.35); transition: transform 0.2s; position: relative; }
  .zh-wa-float:hover .zh-wa-float__btn { transform: scale(1.08); }
  .zh-wa-float__btn svg { width: 30px; height: 30px; fill: white; }
  .zh-wa-float__pulse { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--green-wa); animation: waPulse 2s infinite; }
  @keyframes waPulse { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(1.4); opacity: 0; } }
  .zh-wa-float__label { background: white; color: #333; font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 8px; box-shadow: var(--shadow); white-space: nowrap; }
</style>
</head>
<body>

<!-- ── 0. Header ── -->
<header class="zh-header">
  <a href="/" class="zh-logo">
    <img src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_400/u_https://assets.cdn.filesafe.space/tGT0NBw0s46QQDWPfp3W/media/67531ed7d1a1319bcbad3551.png" alt="ZenHome logo"/>
  </a>
  <button class="zh-hamburger" onclick="document.querySelector('.zh-nav').classList.toggle('open')" aria-label="Menú"><span></span><span></span><span></span></button>
  <nav class="zh-nav">
    <a href="/">Inicio</a>
    <a href="/#servicios">Diseño de Cocinas</a>
    <a href="/proyectos/" class="active">Proyectos</a>
    <a href="/#equipo">Sobre Nosotros</a>
    <a href="/#locaciones">Contacto</a>
    <a href="https://wa.me/528115269496?text=Hola%20ZenHome%2C%20me%20interesa%20una%20cotización." class="zh-nav-cta" target="_blank" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.003-1.956l-.42-.317-2.65.889.889-2.65-.317-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
      Agenda una cita
    </a>
  </nav>
</header>

<!-- ── 1. Breadcrumb ── -->
<div class="breadcrumb">
  <a href="/">Inicio</a> &rsaquo; <a href="/proyectos/">Proyectos</a> &rsaquo; <strong>${escapeHtml(p.title)}</strong>
</div>

<!-- ── 2. Split Hero ── -->
<section class="split-hero">
  <div class="split-hero__info">
    <span class="split-hero__tag">${tag}</span>
    <h1>${escapeHtml(p.title)}</h1>
    <div class="split-hero__meta">
      ${p.location ? `<span>📍 ${escapeHtml(p.location)}</span>` : ''}
      ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
      ${p.duration ? `<span>⏱ ${escapeHtml(p.duration)}</span>` : ''}
    </div>
    ${p.description ? `<p class="split-hero__desc">${escapeHtml(p.description)}</p>` : ''}
    <a href="https://wa.me/528115269496?text=${waHero}" class="hero-cta" target="_blank" rel="noopener"
       onclick="gtag('event','click_whatsapp',{event_category:'conversion',event_label:'hero_cta_${slug}'});">
      ${WA_SVG} ${escapeHtml(seo.cta)}
    </a>
  </div>
  <div class="split-hero__image">
    <img src="${heroImg}" alt="${escapeHtml(p.title)} - ${escapeHtml(catLabel)} en ${escapeHtml(p.location || 'Monterrey')}" width="900" height="600" fetchpriority="high"/>
  </div>
</section>

<article class="article">

  ${p.challenge ? `<!-- ── 3. El Reto ── -->
  <h2>El Reto</h2>
  <div class="challenge-block"><p>${escapeHtml(p.challenge)}</p></div>` : ''}

  ${solutionHtml ? `<!-- ── 4. Nuestra Solución ── -->
  <h2>Nuestra Solución</h2>
  ${solutionHtml}` : ''}

  ${specsCards ? `<!-- ── 5. Especificaciones Clave ── -->
  <h2>Especificaciones del Proyecto</h2>
  <div class="specs-grid">
${specsCards}
  </div>` : ''}

  ${hasTags ? `<!-- ── 6. Materiales y Estilo ── -->
  <div class="tags-section">
    ${materialTags ? `<div class="tags-group"><div class="tags-group-label">Materiales</div>${materialTags}</div>` : ''}
    ${styleTags ? `<div class="tags-group"><div class="tags-group-label">Estilo</div>${styleTags}</div>` : ''}
    ${zoneTags ? `<div class="tags-group"><div class="tags-group-label">Zona</div>${zoneTags}</div>` : ''}
  </div>` : ''}

  ${hasGallery ? `<!-- ── 7. Galería Visual ── -->
  <h2>Galería del Proyecto</h2>
  <div class="gallery-v2">${galleryHtml}
  </div>` : ''}

  ${videoSection}

  ${hasGallery || videoSection ? `<!-- ── 9. CTA Mid-page ── -->
  <div class="cta-mid">
    <h3>${escapeHtml(seo.midCta)}</h3>
    <a href="https://wa.me/528115269496?text=${waMid}" class="cta-wa-btn" target="_blank" rel="noopener"
       onclick="gtag('event','click_whatsapp',{event_category:'conversion',event_label:'mid_cta_${slug}'});">
      ${WA_SVG} Platícanos tu idea
    </a>
  </div>` : ''}

  ${p.result ? `<!-- ── 10. El Resultado ── -->
  <div class="section-result">
    <h2>El Resultado</h2>
    <p>${escapeHtml(p.result)}</p>
  </div>` : ''}

  ${testimonialSection}

  <!-- ── 12. CTA de Cierre ── -->
  <div class="cta-inline">
    <h3>${escapeHtml(seo.closeCta || '¿Te gustaría un resultado similar?')}</h3>
    <p>Cada proyecto ZenHome se diseña a la medida de tu espacio, tu estilo y tu presupuesto.</p>
    <a href="https://wa.me/528115269496?text=${waClose}" class="cta-wa-btn" target="_blank" rel="noopener"
       onclick="gtag('event','click_whatsapp',{event_category:'conversion',event_label:'footer_cta_${slug}'});">
      ${WA_SVG} Quiero una cotización
    </a>
    <div class="cta-micro">Respuesta en menos de 2 horas · Sin compromiso</div>
  </div>

  ${relatedHtml ? `<!-- ── 13. Proyectos Relacionados ── -->
  <div class="related">
    <h2>Proyectos Relacionados</h2>
    <div class="related-grid">
${relatedHtml}
    </div>
  </div>` : ''}

</article>

<!-- ── 14. Links Internos SEO ── -->
<div class="seo-links">
  <div class="seo-links__inner">
    ${moneyPageLink}
    <a href="/proyectos/">Ver todos los proyectos</a>
    <a href="/#servicios">Nuestros servicios</a>
    <a href="/#locaciones">Showrooms</a>
    <a href="https://wa.me/528115269496?text=Hola%20ZenHome%2C%20quiero%20agendar%20una%20cita." target="_blank" rel="noopener">Agendar cita</a>
  </div>
</div>

<footer class="zh-footer">
  <p>&copy; ${new Date().getFullYear()} <a href="/">ZenHome</a> · Cocinas Integrales y Diseño de Interiores en Monterrey</p>
</footer>

<a class="zh-wa-float" href="https://wa.me/528115269496?text=${waHero}" target="_blank" rel="noopener"
   onclick="gtag('event','click_whatsapp',{event_category:'conversion',event_label:'floating_wa_${slug}'});">
  <div class="zh-wa-float__btn"><div class="zh-wa-float__pulse"></div><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.003-1.956l-.42-.317-2.65.889.889-2.65-.317-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg></div>
  <span class="zh-wa-float__label">Cotiza gratis</span>
</a>

${hasGallery ? `<!-- Lightbox -->
<div class="lightbox" id="lightbox">
  <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
  <button class="lightbox-nav lightbox-prev" onclick="navLightbox(-1)">&#8249;</button>
  <img id="lightbox-img" src="" alt=""/>
  <button class="lightbox-nav lightbox-next" onclick="navLightbox(1)">&#8250;</button>
</div>
<script>
  var lbImgs = ${JSON.stringify(galleryFull)};
  var lbIdx = 0;
  function openLightbox(i) { lbIdx = i; document.getElementById('lightbox-img').src = lbImgs[i]; document.getElementById('lightbox').classList.add('active'); document.body.style.overflow='hidden'; }
  function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); document.body.style.overflow=''; }
  function navLightbox(d) { lbIdx = (lbIdx + d + lbImgs.length) % lbImgs.length; document.getElementById('lightbox-img').src = lbImgs[lbIdx]; }
  document.addEventListener('keydown', function(e) {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  });
</script>` : ''}

</body>
</html>`
}

// ─── Portfolio index page generator ───
function portfolioIndexHtml(projects) {
  const cards = projects.map(projectCardHtml).join('\n')

  // Read the current portfolio index as template base
  const templatePath = path.join(OUTPUT_DIR, 'index.html')
  if (fs.existsSync(templatePath)) {
    let template = fs.readFileSync(templatePath, 'utf-8')
    // Replace the grid contents between portfolio-grid markers
    const gridStart = template.indexOf('<div class="portfolio-grid" id="portfolio-grid">')
    const gridEnd = template.indexOf('</section>', gridStart)
    if (gridStart !== -1 && gridEnd !== -1) {
      const before = template.substring(0, gridStart)
      const after = template.substring(gridEnd)
      template = before + `<div class="portfolio-grid" id="portfolio-grid">\n${cards}\n  </div>\n` + after
      return template
    }
  }

  console.log('⚠️  No se encontró el template del portafolio. Usando los cards generados.')
  return null
}

// ─── Main build function ───
async function build() {
  console.log('🏗  ZenHome Portfolio Builder')
  console.log(`   Sanity: ${PROJECT_ID} / ${DATASET}`)
  console.log(`   Output: ${OUTPUT_DIR}\n`)

  // Normalize category to lowercase (defends against Sanity typos like "Cocinas" vs "cocina")
  function normalizeCategory(cat) {
    if (!cat) return ''
    const map = { cocinas: 'cocina', cocina: 'cocina', closet: 'closet', closets: 'closet', interior: 'interior', constructora: 'constructora' }
    return map[cat.toLowerCase()] || cat.toLowerCase()
  }

  // Fetch all published projects.
  // IMPORTANTE: !(_id in path("drafts.**")) excluye los borradores de Sanity.
  // Sin esto, un draft a medias (con published==true) se filtra al build y
  // genera un slug "duplicado" del documento publicado.
  const query = `*[_type == "project" && published == true && !(_id in path("drafts.**"))] | order(featured desc, deliveryDate desc) {
    _id, title, slug, category, location, deliveryDate, duration,
    heroImage, description, challenge, solution, specs, gallery,
    videoUrl, testimonial, published, featured,
    materials, style, zone, result, seoTitle, seoDescription
  }`

  console.log('📡 Fetching projects from Sanity...')
  const projects = (await sanityFetch(query)) || []
  console.log(`   Found ${projects.length} published projects\n`)

  // Normalize categories
  projects.forEach((p) => { p.category = normalizeCategory(p.category) })

  // ──────────────────────────────────────────────────────────────────────
  //  VALIDACIÓN DE CALIDAD — HARD-FAIL (bloqueo total)
  //  Si CUALQUIER proyecto publicado tiene un dato inválido, el build se
  //  DETIENE y NO se despliega nada (process.exit 1 vía throw). Así, datos
  //  malos (slug de Facebook, título duplicado, campo faltante, imagen
  //  faltante) NO contaminan el sitio ni el sitemap en silencio. Se reportan
  //  TODOS los errores juntos para corregirlos de una sola pasada en Sanity.
  // ──────────────────────────────────────────────────────────────────────
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const errors = []
  const warnings = []
  const slugSeen = new Map()    // slug -> _id
  const titleSeen = new Map()   // título SEO final -> slug
  for (const p of projects) {
    const id = p._id || '(sin _id)'
    const label = p.title || id
    const s = p.slug?.current

    if (!s) { errors.push(`"${label}": falta el campo SLUG (_id: ${id})`); continue }
    if (!SLUG_RE.test(s)) {
      errors.push(`"${label}": SLUG inválido "${s}" — solo minúsculas, números y guiones (¿se pegó un link?) (_id: ${id})`)
    }
    if (slugSeen.has(s)) {
      errors.push(`SLUG duplicado "${s}" en 2 proyectos publicados (_id: ${id} y ${slugSeen.get(s)})`)
    } else {
      slugSeen.set(s, id)
    }
    if (!p.title || !String(p.title).trim()) {
      errors.push(`Proyecto sin TÍTULO (_id: ${id})`)
    }
    if (!p.heroImage) {
      errors.push(`"${label}": falta HEROIMAGE — la página y las cards quedarían rotas (_id: ${id})`)
    }
    // Título SEO único — evita que Google colapse páginas como duplicadas
    const explicitTitle = !!(p.seoTitle && p.seoTitle.trim())
    let finalTitle = explicitTitle ? p.seoTitle.trim() : generateSeoTitle(p)
    if (titleSeen.has(finalTitle)) {
      const prev = titleSeen.get(finalTitle)
      if (explicitTitle && prev.explicit) {
        // Dos títulos escritos a mano e idénticos: error editorial real, se detiene el build.
        errors.push(`TÍTULO SEO duplicado "${finalTitle}" — lo comparten "${s}" y "${prev.slug}". Ponle un seoTitle único en Sanity.`)
      } else {
        // Al menos uno es autogenerado: se desambigua y sigue. Nunca paramos el sitio por esto.
        const fixed = disambiguateSeoTitle(finalTitle, p, titleSeen)
        warnings.push(`Título SEO autogenerado duplicado con "${prev.slug}" — se desambiguó a "${fixed}". Ponle un seoTitle propio en Sanity a "${s}".`)
        finalTitle = fixed
        titleSeen.set(finalTitle, { slug: s, explicit: false })
      }
    } else {
      titleSeen.set(finalTitle, { slug: s, explicit: explicitTitle })
    }
    // La página y el sitemap usan este título ya resuelto (evita divergencia con la validación)
    p.seoTitle = finalTitle
    if (finalTitle.length > 65) {
      warnings.push(`Título largo (${finalTitle.length} car., Google lo trunca): ${s}`)
    }
  }

  if (warnings.length) {
    console.warn('\n⚠️  AVISOS (no bloquean el deploy):')
    warnings.forEach((w) => console.warn('   • ' + w))
  }

  if (errors.length) {
    console.error('\n🚫 BUILD DETENIDO — datos inválidos en proyectos publicados.')
    console.error('   No se desplegó nada. Corrige en Sanity Studio y vuelve a publicar:\n')
    errors.forEach((e) => console.error('   • ' + e))
    console.error(`\n   Total: ${errors.length} error(es). Al corregirlos, el deploy corre solo.\n`)
    throw new Error(`Validación de contenido falló: ${errors.length} error(es) en proyectos.`)
  }

  if (projects.length === 0) {
    console.log('⚠️  No hay proyectos publicados. Nada que generar.')
    return
  }
  console.log(`   ✅ Validación OK: ${projects.length} proyectos con slugs y títulos únicos.\n`)

  // ── Build the related-projects graph ──
  // Goal: every project must receive at least one inbound internal link. A project
  // with no internal links is discovered by Google via the sitemap only, which
  // delays or skips indexing ("Descubierta: actualmente sin indexar").
  const buildable = projects.filter((p) => p.slug?.current)
  const relatedMap = new Map() // _id -> array of related project objects

  // Phase 1 — relevance-based picks. Rotate the same-category window by index so
  // inbound links spread evenly instead of always landing on the first 3 projects.
  for (let i = 0; i < buildable.length; i++) {
    const project = buildable[i]
    const sameCategory = buildable
      .filter((p) => p._id !== project._id && p.category === project.category && p.heroImage)
    const start = sameCategory.length ? i % sameCategory.length : 0
    const rotatedSameCategory = [...sameCategory.slice(start), ...sameCategory.slice(0, start)]
    const othersFeatured = buildable
      .filter((p) => p._id !== project._id && p.category !== project.category && p.featured && p.heroImage)
    const othersRest = buildable
      .filter((p) => p._id !== project._id && p.category !== project.category && !p.featured && p.heroImage)
    relatedMap.set(project._id, [...rotatedSameCategory, ...othersFeatured, ...othersRest].slice(0, 3))
  }

  // Phase 2 — coverage pass. Any project with zero inbound links gets injected into
  // the most relevant host's related list (same category > same city > neighbor),
  // replacing its 3rd slot. Guarantees no orphans regardless of category size.
  const inbound = new Map(buildable.map((p) => [p._id, 0]))
  for (const list of relatedMap.values()) for (const r of list) inbound.set(r._id, (inbound.get(r._id) || 0) + 1)
  for (let i = 0; i < buildable.length; i++) {
    const orphan = buildable[i]
    if (inbound.get(orphan._id) > 0 || !orphan.heroImage) continue // skip no-hero (broken card)
    const host =
      buildable.find((p) => p._id !== orphan._id && p.category === orphan.category && !relatedMap.get(p._id).some((r) => r._id === orphan._id)) ||
      buildable.find((p) => p._id !== orphan._id && extractCity(p.location) === extractCity(orphan.location) && !relatedMap.get(p._id).some((r) => r._id === orphan._id)) ||
      buildable[(i + 1) % buildable.length]
    if (!host || host._id === orphan._id) continue
    const hostList = relatedMap.get(host._id)
    if (hostList.length >= 3) hostList[2] = orphan
    else hostList.push(orphan)
    inbound.set(orphan._id, 1)
  }

  // ── Generate individual project pages ──
  let generated = 0
  for (const project of buildable) {
    const slug = project.slug.current
    const html = projectPageHtml(project, relatedMap.get(project._id) || [])
    const dir = path.join(OUTPUT_DIR, slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8')
    generated++
    console.log(`   ✅ /proyectos/${slug}/`)
  }
  for (const project of projects) {
    if (!project.slug?.current) console.log(`⚠️  Skipping "${project.title}" - no slug`)
  }

  // Update portfolio index
  console.log('\n📋 Updating portfolio index...')
  const indexHtml = portfolioIndexHtml(projects)
  if (indexHtml) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8')
    console.log('   ✅ /proyectos/')
  }

  // Generate sitemap.xml dynamically
  console.log('\n🗺  Generating sitemap.xml...')
  // Use Mexico City timezone to avoid UTC date being "tomorrow" when build runs at night CDT
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' })
  const sitemapUrls = [
    { loc: 'https://zenhome.com.mx/', changefreq: 'weekly', priority: '1.0' },
    { loc: 'https://zenhome.com.mx/cocinas-integrales-monterrey/', changefreq: 'monthly', priority: '0.9' },
    { loc: 'https://zenhome.com.mx/closets-monterrey/', changefreq: 'monthly', priority: '0.9' },
    { loc: 'https://zenhome.com.mx/diseno-interiores-monterrey/', changefreq: 'monthly', priority: '0.9' },
    { loc: 'https://zenhome.com.mx/cocinas-integrales-apodaca/', changefreq: 'monthly', priority: '0.9' },
    { loc: 'https://zenhome.com.mx/cocinas-integrales-guadalupe/', changefreq: 'monthly', priority: '0.9' },
    { loc: 'https://zenhome.com.mx/servicios/', changefreq: 'monthly', priority: '0.7' },
    { loc: 'https://zenhome.com.mx/contacto/', changefreq: 'monthly', priority: '0.7' },
    { loc: 'https://zenhome.com.mx/proyectos/', changefreq: 'weekly', priority: '0.8' },
    { loc: 'https://zenhome.com.mx/cuanto-cuesta-cocina-integral-monterrey/', changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://zenhome.com.mx/materiales-cocina-integral-monterrey/', changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://zenhome.com.mx/sobre-nosotros/', changefreq: 'monthly', priority: '0.6' },
    { loc: 'https://zenhome.com.mx/blog/', changefreq: 'weekly', priority: '0.7' },
    { loc: 'https://zenhome.com.mx/blog/5-errores-remodelar-cocina', changefreq: 'monthly', priority: '0.7' },
  ]
  const seenSlugs = new Set()
  for (const project of projects) {
    const s = project.slug?.current
    if (!s || seenSlugs.has(s)) continue  // skip duplicates
    seenSlugs.add(s)
    let lastmod = project.deliveryDate
      ? new Date(project.deliveryDate).toISOString().split('T')[0]
      : today
    // Cap lastmod to today — no future dates in sitemap
    if (lastmod > today) lastmod = today
    sitemapUrls.push({
      loc: `https://zenhome.com.mx/proyectos/${s}/`,
      lastmod,
      changefreq: 'monthly',
      priority: project.featured ? '0.8' : '0.7',
    })
  }
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  const sitemapPath = path.resolve(__dirname, 'sitemap.xml')
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8')
  console.log(`   ✅ sitemap.xml (${sitemapUrls.length} URLs)`)

  console.log(`\n🎉 Done! Generated ${generated} project pages.`)
  console.log('   Next: deploy zenhome-site/ to Cloudflare Pages')
}

build().catch((err) => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})

