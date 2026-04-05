#!/usr/bin/env node
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
const OUTPUT_DIR = path.resolve(__dirname, 'portafolio')

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
          resolve(parsed.result)
        } catch (e) {
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
    <a href="/portafolio/${slug}/" class="project-card" data-category="${p.category || ''}">
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

  // Specs table rows
  const specsRows = (p.specs || [])
    .map((s) => `    <tr><th>${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`)
    .join('\n')

  // Gallery
  const galleryImgs = (p.gallery || [])
    .map(
      (img) =>
        `    <img src="${imageUrl(img, 600)}" alt="${escapeHtml(img.caption || p.title)}" loading="lazy"/>`
    )
    .join('\n')

  // Video
  let videoSection = ''
  if (p.videoUrl) {
    const videoId = p.videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]
    if (videoId) {
      videoSection = `
  <h2>Video del Proyecto</h2>
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:24px 0 36px;">
    <iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe>
  </div>`
    }
  }

  // Testimonial
  let testimonialSection = ''
  if (p.testimonial?.quote) {
    const stars = '★'.repeat(p.testimonial.rating || 5) + '☆'.repeat(5 - (p.testimonial.rating || 5))
    testimonialSection = `
  <div class="testimonial">
    <div class="stars">${stars}</div>
    <blockquote>"${escapeHtml(p.testimonial.quote)}"</blockquote>
    <cite>— ${escapeHtml(p.testimonial.author || 'Cliente ZenHome')}</cite>
  </div>`
  }

  // Solution
  const solutionHtml = blocksToHtml(p.solution)

  // Related projects
  const relatedHtml = relatedProjects
    .map(
      (r) => `
      <a href="/portafolio/${r.slug?.current || ''}/" class="related-card">
        <img src="${imageUrl(r.heroImage, 400)}" alt="${escapeHtml(r.title)}" loading="lazy"/>
        <div class="related-card-body">
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.location || '')}</p>
        </div>
      </a>`
    )
    .join('\n')

  // WA message
  const waMsg = encodeURIComponent(
    `Hola ZenHome, vi el proyecto "${p.title}" y me interesa algo similar para mi espacio.`
  )

  return `<!DOCTYPE html>
<html lang="es-mx">
<head>
<meta charset="utf-8"/>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JSYYXX8Z2K"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JSYYXX8Z2K');</script>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(p.title)} | ZenHome Monterrey</title>
<link rel="canonical" href="https://zenhome.com.mx/portafolio/${slug}/"/>
<meta name="description" content="${escapeHtml(p.description || '')}"/>
<meta property="og:title" content="${escapeHtml(p.title)} | ZenHome"/>
<meta property="og:description" content="${escapeHtml(p.description || '')}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="https://zenhome.com.mx/portafolio/${slug}/"/>
<meta property="og:locale" content="es_MX"/>
<meta property="og:site_name" content="ZenHome"/>
<meta property="og:image" content="${heroImg}"/>
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
  "description": "${escapeHtml(p.description || '')}",
  "image": "${heroImg}",
  "author": {"@type": "Organization", "name": "ZenHome", "url": "https://zenhome.com.mx"},
  "publisher": {"@type": "Organization", "name": "ZenHome", "url": "https://zenhome.com.mx"},
  "datePublished": "${p.deliveryDate || ''}",
  "mainEntityOfPage": "https://zenhome.com.mx/portafolio/${slug}/",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://zenhome.com.mx/"},
      {"@type": "ListItem", "position": 2, "name": "Portafolio", "item": "https://zenhome.com.mx/portafolio/"},
      {"@type": "ListItem", "position": 3, "name": "${escapeHtml(p.title)}"}
    ]
  }
}
</script>

<style>
  :root {
    --blue-dark: #000321; --blue: #0038FF; --blue-mid: #1542b0; --blue-light: #3668e5;
    --bg-light: #e7edf9; --bg-soft: #F6F6FF; --gold: #eddb7e; --text: #0E182C;
    --text-muted: #8893A8; --white: #ffffff; --green-wa: #25D366;
    --radius: 12px; --shadow: 0 2px 8px rgba(0,3,33,0.10);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Roboto', sans-serif; color: var(--text); background: var(--white); line-height: 1.7; -webkit-font-smoothing: antialiased; }
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
  .breadcrumb { padding: 16px 40px; font-size: 14px; color: var(--text-muted); background: var(--bg-soft); border-bottom: 1px solid #e0e4ef; }
  .breadcrumb a { color: var(--blue); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .article { max-width: 900px; margin: 0 auto; padding: 40px; }
  @media (max-width: 768px) { .article { padding: 24px 20px; } .breadcrumb { padding: 12px 20px; } }
  .article-tag { display: inline-block; background: var(--bg-light); color: var(--blue); font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .article h1 { font-size: clamp(24px, 4vw, 36px); font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
  .article-meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; color: var(--text-muted); margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #eee; }
  .article-meta span { display: flex; align-items: center; gap: 5px; }
  .article-hero { width: 100%; border-radius: var(--radius); overflow: hidden; margin-bottom: 32px; box-shadow: var(--shadow); }
  .article-hero img { width: 100%; display: block; }
  .article h2 { font-size: 22px; font-weight: 700; margin: 36px 0 14px; color: var(--blue-dark); }
  .article p { margin-bottom: 16px; font-size: 16px; }
  .specs-table { width: 100%; border-collapse: collapse; margin: 20px 0 32px; font-size: 15px; }
  .specs-table th, .specs-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
  .specs-table th { background: var(--bg-light); font-weight: 600; width: 40%; color: var(--blue-dark); }
  .specs-table tr:last-child th, .specs-table tr:last-child td { border-bottom: none; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin: 24px 0 36px; }
  .gallery img { width: 100%; border-radius: 8px; cursor: pointer; transition: transform 0.2s; box-shadow: var(--shadow); }
  .gallery img:hover { transform: scale(1.02); }
  .testimonial { background: var(--bg-light); border-radius: var(--radius); padding: 28px; margin: 32px 0; border-left: 4px solid var(--blue); }
  .testimonial blockquote { font-size: 16px; font-style: italic; margin-bottom: 10px; }
  .testimonial cite { font-size: 14px; color: var(--text-muted); font-style: normal; font-weight: 600; }
  .testimonial .stars { color: #f59e0b; font-size: 18px; margin-bottom: 8px; }
  .cta-inline { background: linear-gradient(135deg, var(--blue-dark) 0%, var(--blue-mid) 100%); color: var(--white); border-radius: var(--radius); padding: 36px; text-align: center; margin: 40px 0; }
  .cta-inline h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .cta-inline p { opacity: 0.85; margin-bottom: 20px; font-size: 15px; }
  .cta-wa-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--green-wa); color: var(--white); text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 30px; box-shadow: 0 4px 16px rgba(37,211,102,0.3); transition: transform 0.2s; }
  .cta-wa-btn:hover { transform: scale(1.03); }
  .cta-wa-btn svg { width: 20px; height: 20px; }
  .cta-micro { font-size: 13px; opacity: 0.6; margin-top: 8px; }
  .related { margin: 48px 0 0; }
  .related h2 { font-size: 22px; margin-bottom: 20px; }
  .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
  .related-card { text-decoration: none; color: inherit; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: transform 0.2s; }
  .related-card:hover { transform: translateY(-3px); }
  .related-card img { width: 100%; height: 180px; object-fit: cover; }
  .related-card-body { padding: 14px 16px; }
  .related-card h3 { font-size: 15px; font-weight: 600; }
  .related-card p { font-size: 13px; color: var(--text-muted); }
  .zh-footer { background: var(--blue-dark); color: var(--white); text-align: center; padding: 32px 40px; font-size: 14px; opacity: 0.7; }
  .zh-footer a { color: var(--gold); text-decoration: none; }
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

<header class="zh-header">
  <a href="/" class="zh-logo">
    <img src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_400/u_https://assets.cdn.filesafe.space/tGT0NBw0s46QQDWPfp3W/media/67531ed7d1a1319bcbad3551.png" alt="ZenHome logo"/>
  </a>
  <button class="zh-hamburger" onclick="document.querySelector('.zh-nav').classList.toggle('open')" aria-label="Menú"><span></span><span></span><span></span></button>
  <nav class="zh-nav">
    <a href="/">Inicio</a>
    <a href="/#servicios">Diseño de Cocinas</a>
    <a href="/portafolio/" class="active">Portafolio</a>
    <a href="/#equipo">Sobre Nosotros</a>
    <a href="/#locaciones">Contacto</a>
    <a href="https://wa.me/528115269496?text=Hola%20ZenHome%2C%20me%20interesa%20una%20cotización." class="zh-nav-cta" target="_blank" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.003-1.956l-.42-.317-2.65.889.889-2.65-.317-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
      Agenda una cita
    </a>
  </nav>
</header>

<div class="breadcrumb">
  <a href="/">Inicio</a> &rsaquo; <a href="/portafolio/">Portafolio</a> &rsaquo; <strong>${escapeHtml(p.title)}</strong>
</div>

<article class="article">
  <span class="article-tag">${tag}</span>
  <h1>${escapeHtml(p.title)}</h1>

  <div class="article-meta">
    <span>📍 ${escapeHtml(p.location || '')}</span>
    ${dateStr ? `<span>📅 Entregado: ${dateStr}</span>` : ''}
    ${p.duration ? `<span>⏱ Duración: ${escapeHtml(p.duration)}</span>` : ''}
  </div>

  <div class="article-hero">
    <img src="${heroImg}" alt="${escapeHtml(p.title)}" width="900" height="600"/>
  </div>

  ${p.challenge ? `<h2>El Reto</h2>\n  <p>${escapeHtml(p.challenge)}</p>` : ''}

  ${solutionHtml ? `<h2>Nuestra Solución</h2>\n  ${solutionHtml}` : ''}

  ${specsRows ? `<h2>Ficha Técnica</h2>
  <table class="specs-table">
${specsRows}
  </table>` : ''}

  ${galleryImgs ? `<h2>Galería del Proyecto</h2>
  <div class="gallery">
${galleryImgs}
  </div>` : ''}

  ${videoSection}

  ${testimonialSection}

  <div class="cta-inline">
    <h3>¿Te gustaría un resultado similar?</h3>
    <p>Platícanos sobre tu proyecto y recibe una cotización sin compromiso.</p>
    <a href="https://wa.me/528115269496?text=${waMsg}" class="cta-wa-btn" target="_blank" rel="noopener"
       onclick="gtag('event','click_whatsapp',{event_category:'conversion',event_label:'proyecto_${slug}'});">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.003-1.956l-.42-.317-2.65.889.889-2.65-.317-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
      Quiero una cotización
    </a>
    <div class="cta-micro">Respuesta rápida · Sin compromiso</div>
  </div>

  ${relatedHtml ? `<div class="related">
    <h2>Proyectos Relacionados</h2>
    <div class="related-grid">
${relatedHtml}
    </div>
  </div>` : ''}

</article>

<footer class="zh-footer">
  <p>&copy; ${new Date().getFullYear()} <a href="/">ZenHome</a> · Cocinas Integrales y Diseño de Interiores en Monterrey</p>
</footer>

<a class="zh-wa-float" href="https://wa.me/528115269496?text=Hola%20ZenHome%2C%20vi%20su%20portafolio%20y%20me%20interesa%20una%20cotización." target="_blank" rel="noopener">
  <div class="zh-wa-float__btn"><div class="zh-wa-float__pulse"></div><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.003-1.956l-.42-.317-2.65.889.889-2.65-.317-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg></div>
  <span class="zh-wa-float__label">Cotiza gratis</span>
</a>

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

  // Fetch all published projects
  const query = `*[_type == "project" && published == true] | order(featured desc, deliveryDate desc) {
    _id, title, slug, category, location, deliveryDate, duration,
    heroImage, description, challenge, solution, specs, gallery,
    videoUrl, testimonial, published, featured
  }`

  console.log('📡 Fetching projects from Sanity...')
  const projects = await sanityFetch(query)
  console.log(`   Found ${projects.length} published projects\n`)

  if (projects.length === 0) {
    console.log('⚠️  No hay proyectos publicados. Nada que generar.')
    return
  }

  // Generate individual project pages
  let generated = 0
  for (const project of projects) {
    const slug = project.slug?.current
    if (!slug) {
      console.log(`⚠️  Skipping "${project.title}" - no slug`)
      continue
    }

    // Get 2 related projects (same category, excluding current)
    const related = projects
      .filter((p) => p._id !== project._id && p.category === project.category)
      .slice(0, 2)

    const html = projectPageHtml(project, related)
    const dir = path.join(OUTPUT_DIR, slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8')
    generated++
    console.log(`   ✅ /portafolio/${slug}/`)
  }

  // Update portfolio index
  console.log('\n📋 Updating portfolio index...')
  const indexHtml = portfolioIndexHtml(projects)
  if (indexHtml) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8')
    console.log('   ✅ /portafolio/')
  }

  console.log(`\n🎉 Done! Generated ${generated} project pages.`)
  console.log('   Next: deploy zenhome-site/ to Cloudflare Pages')
}

build().catch((err) => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})

