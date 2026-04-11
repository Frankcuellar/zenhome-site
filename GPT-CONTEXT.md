# ZenHome — Contexto Completo del Proyecto (Abril 2026)

## Resumen Ejecutivo

Sitio web de **ZenHome**, empresa de cocinas integrales y diseño de interiores en Monterrey, NL. Migrado desde GoHighLevel (GHL) a hosting estático en **Cloudflare Pages** con CMS headless **Sanity.io** para gestión de portafolio. Pipeline de deploy 100% automatizado: publicar en Sanity → webhook → GitHub Actions → build → Cloudflare Pages.

---

## URLs y Accesos

| Recurso | URL / ID |
|---------|----------|
| **Sitio en producción** | https://zenhome.com.mx |
| **Cloudflare Pages project** | `seozenhome` |
| **Cloudflare Account ID** | `6b6ab1e7185dbfaa9893f917ad6085a6` |
| **Sanity Studio** | https://zenhome.sanity.studio/ |
| **Sanity Project ID** | `qql4bn7x` |
| **Sanity Dataset** | `production` |
| **Sanity Organization ID** | `oXrbqpHeE` |
| **Sanity App ID** | `v0dkl345o6lpiqoaido8g2mx` |
| **GitHub Repo** | https://github.com/Frankcuellar/zenhome-site |
| **GitHub Username** | `Frankcuellar` |
| **GA4 Measurement ID** | `G-JSYYXX8Z2K` |
| **GA4 Stream** | "PixelZenhome" (ID: 10677763727) |
| **GA4 Account** | "FrankAnalytics" |
| **WhatsApp** | +52 811 526 9496 |
| **DNS** | GoDaddy → Cloudflare Pages |

---

## Arquitectura del Proyecto

```
Sanity CMS (contenido)
    │
    ├── Publicar proyecto → Webhook POST a GitHub API
    │
    ▼
GitHub Actions (CI/CD)
    │
    ├── Checkout repo
    ├── node build.js  ← Fetch de Sanity API + genera HTML estático
    ├── wrangler pages deploy  ← Sube a Cloudflare Pages
    │
    ▼
Cloudflare Pages (hosting)
    │
    └── https://zenhome.com.mx
```

### Triggers del Pipeline

El workflow de GitHub Actions (`deploy.yml`) se activa con:
1. **Push a main** — cualquier commit directo
2. **repository_dispatch** (type: `sanity_publish`) — enviado por webhook de Sanity
3. **workflow_dispatch** — ejecución manual desde GitHub

---

## Estructura de Archivos

```
zenhome-site/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: build + deploy
├── portafolio/
│   ├── index.html              # Listado de portafolio (generado por build.js)
│   ├── cocina-moderna-san-pedro/
│   │   └── index.html          # Página individual de proyecto
│   ├── cocina-minimalista-guadalupe/
│   │   └── index.html
│   ├── closet-vestidor-cumbres/
│   │   └── index.html
│   └── cocina-moderna-de-prueba/
│       └── index.html          # ⚠️ Proyecto de prueba — pendiente eliminar
├── index.html                  # Landing principal (~282KB, export de GHL/Nuxt)
├── build.js                    # Script de build (~512 líneas, Node.js)
├── package.json                # {"scripts": {"build": "node build.js"}}
├── _redirects                  # Redirects de Cloudflare Pages
├── _headers                    # Headers de seguridad y cache
├── robots.txt                  # Permite todo, apunta al sitemap
├── sitemap.xml                 # URL principal
├── favicon.ico                 # Favicon exportado de GHL
├── icon-192.png                # Ícono PWA
├── HANDOFF.md                  # Documentación de handoff anterior
└── GPT-CONTEXT.md              # Este archivo
```

---

## Archivo Principal: index.html

- **Tamaño:** ~282KB de HTML/CSS/JS inline
- **Origen:** Exportado de GoHighLevel (GHL), basado en Nuxt.js
- **Contenido:** Landing page completa — hero, servicios, portafolio preview, testimonios, contacto
- **Modificaciones propias** (no del export original):
  - Script de navegación en capture phase (ver sección "Bug Crítico de scrollTo")
  - Botón flotante de WhatsApp (`.zh-wa-float`)
  - SEO: meta tags, Open Graph, Schema.org JSON-LD
  - Section IDs para navegación por anchor

### Estructura DOM de GHL

```
html
  body
    div#__nuxt
      span.nuxt-route-announcer (accesibilidad)
      div.bgCover.bg-fixed (position: fixed, background decorativo, SIN hijos)
      div (sin clase, 4313px alto, CONTENIDO REAL)
      div#teleports (vacío)
    a.zh-wa-float (botón WhatsApp flotante)
    script (navigation scroll handler)
```

---

## Bug Crítico: scrollTo en GHL/Nuxt

**El descubrimiento técnico más importante del proyecto.**

El HTML exportado de GHL incluye un framework Nuxt.js que bloquea `window.scrollTo(x, y)` con argumentos posicionales, pero permite la sintaxis de objeto.

- ❌ `window.scrollTo(0, 1100)` — NO funciona
- ❌ `window.scroll(0, 1100)` — NO funciona
- ❌ `window.scrollBy(0, -500)` — NO funciona
- ❌ `document.documentElement.scrollTop = 1100` — NO funciona
- ✅ `window.scrollTo({top: 1100, behavior: 'smooth'})` — SÍ funciona
- ✅ `element.scrollIntoView({behavior: 'instant', block: 'start'})` — SÍ funciona

### Script de Navegación (versión actual)

```html
<script>
(function(){
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var hash = link.getAttribute('href');
    if (hash === '#') {
      window.scrollTo({top: 0, behavior: 'instant'});
      history.replaceState(null, null, ' ');
      return;
    }
    var target = document.querySelector(hash);
    if (target) {
      var headerOffset = 80;
      var pos = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({top: pos, behavior: 'smooth'});
      history.pushState(null, null, hash);
    }
  }, true); // capture: true es ESENCIAL
})();
</script>
```

**Notas clave:**
- Usa `capture: true` porque GHL registra event listeners en los divs wrapper del menú que llaman `preventDefault()` en fase bubble
- `stopImmediatePropagation()` intercepta antes que GHL
- Ubicado justo antes de `</body></html>`

---

## Section IDs para Navegación

| Nav Link | href | Section ID |
|----------|------|------------|
| Inicio | `#` | scroll to top |
| Diseño de Cocinas | `#servicios` | `id="servicios"` |
| Portafolio | `#proyectos` | `id="proyectos"` |
| Sobre Nosotros | `#equipo` | `id="equipo"` |
| Contacto | `#locaciones` | `id="locaciones"` |

Otros IDs: `ventajas`, `testimonios`, `closets`, `constructoras`

---

## Build Script (build.js)

Script Node.js (~512 líneas) que genera páginas estáticas de portafolio desde Sanity.

### Flujo del Build

1. Fetch proyectos publicados de Sanity API via GROQ
2. Para cada proyecto: genera página individual en `portafolio/{slug}/index.html`
3. Genera index de portafolio en `portafolio/index.html`
4. Actualiza la sección de portafolio en `index.html` principal (entre marcadores)

### Query GROQ

```javascript
const query = `*[_type == "project" && published == true] | order(featured desc, deliveryDate desc) {
  _id, title, slug, category, location, deliveryDate, duration,
  heroImage, description, challenge, solution, specs, gallery,
  videoUrl, testimonial, published, featured
}`
```

### Funciones Principales

- `sanityFetch(query)` — HTTP GET a Sanity API CDN
- `imageUrl(ref, width)` — Convierte ref de imagen Sanity a URL CDN
- `blocksToHtml(blocks)` — Convierte Portable Text a HTML
- `escapeHtml(str)` — Sanitiza strings (con guard para undefined)
- `projectCardHtml(p)` — HTML de tarjeta para grid de portafolio
- `projectPageHtml(p, related)` — HTML completo de página individual
- `portfolioIndexHtml(projects)` — HTML del listado de portafolio
- `build()` — Función principal que orquesta todo

### Categorías

```javascript
cocina → "Cocina Integral"
closet → "Clóset / Vestidor"
interior → "Diseño de Interiores"
constructora → "Constructoras"
```

### Colores del Diseño

```
--blue-dark: #000321
--blue: #0038FF
--green-wa: #25D366
```

### Variables de Entorno Requeridas

```
SANITY_PROJECT_ID=qql4bn7x
SANITY_DATASET=production
SANITY_TOKEN=<token de lectura>
```

### Bug Corregido

La función `escapeHtml` crasheaba con `TypeError: str.replace is not a function` cuando recibía valores undefined de Sanity. Se agregó guard:

```javascript
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
```

---

## Sanity CMS — Schema "Proyecto"

### Campos del Schema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| title | string | Nombre del proyecto |
| slug | slug (de title) | URL-friendly identifier |
| category | string (opciones) | cocina, closet, interior, constructora |
| location | string | Ciudad/colonia |
| deliveryDate | date | Fecha de entrega |
| duration | string | Duración del proyecto |
| heroImage | image | Imagen principal (con hotspot) |
| description | blockContent | Descripción en Portable Text |
| challenge | blockContent | El reto del proyecto |
| solution | blockContent | La solución implementada |
| specs | array de objetos | Especificaciones {label, value} |
| gallery | array de imágenes | Galería del proyecto (con caption) |
| videoUrl | url | Video opcional |
| testimonial | objeto | {quote, author, role} |
| published | boolean | Controla visibilidad (default: false) |
| featured | boolean | Destacar en portafolio (default: false) |

### Proyectos Actuales en Sanity

1. **Cocina Moderna San Pedro** — Cocina integral en San Pedro Garza García
2. **Cocina Minimalista Guadalupe** — Cocina minimalista en Guadalupe
3. **Clóset Vestidor Cumbres** — Clóset/vestidor en Cumbres
4. **Cocina Moderna de Prueba** — ⚠️ PROYECTO DE PRUEBA, pendiente eliminar

---

## Webhook de Sanity

| Propiedad | Valor |
|-----------|-------|
| Nombre | "Deploy to Cloudflare" |
| URL | `https://api.github.com/repos/Frankcuellar/zenhome-site/dispatches` |
| Dataset | * (todos) |
| Trigger | Create, Update, Delete |
| Filter | `_type == 'project'` |
| Projection | `{"event_type": "sanity_publish"}` |
| HTTP Method | POST |
| Headers | Authorization: Bearer [GitHub PAT], Accept: application/vnd.github.v3+json |
| Drafts | deshabilitado |

---

## GitHub Actions (deploy.yml)

```yaml
name: Build & Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  repository_dispatch:
    types: [sanity_publish]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Build portfolio pages from Sanity
        env:
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
          SANITY_TOKEN: ${{ secrets.SANITY_TOKEN }}
        run: node build.js
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy . --project-name=seozenhome
```

### GitHub Secrets Necesarios

| Secret | Descripción |
|--------|-------------|
| `SANITY_PROJECT_ID` | qql4bn7x |
| `SANITY_DATASET` | production |
| `SANITY_TOKEN` | Token de lectura (Viewer) de Sanity |
| `CLOUDFLARE_API_TOKEN` | Token de API de Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | 6b6ab1e7185dbfaa9893f917ad6085a6 |

### GitHub PAT para Webhook

- **Nombre:** "Sanity Webhook - ZenHome Deploy"
- **Tipo:** Fine-grained, sin expiración
- **Scope:** Repo `zenhome-site` solamente
- **Permisos:** Contents (Read and write) + Metadata (Read-only)

---

## SEO Implementado

### Meta Tags
- Title: "Cocinas Integrales y Diseño de Interiores en Monterrey | ZenHome"
- Description optimizada con keywords locales
- Open Graph completo (og:title, og:description, og:image, og:type, og:url, og:locale)
- Twitter Cards (summary_large_image)
- Canonical URL: https://zenhome.com.mx/
- hreflang: es-MX + x-default

### Schema.org (JSON-LD)
1. **InteriorDesigner + LocalBusiness** — nombre, teléfono, 2 sucursales, horarios, 7 ciudades de servicio, aggregateRating, review
2. **FAQPage** — 5 preguntas frecuentes sobre cocinas en Monterrey

### Heading Hierarchy
- 1 × H1: "Creamos cocinas que equilibran estética, funcionalidad y minimalismo"
- 8 × H2: secciones principales
- H3s: subsecciones

### Redirects 301 (_redirects)
```
/home → /
/disenodecocinas → /#servicios
/portafolio → /#proyectos
/sobrenosotros → /#equipo
/contacto → /#locaciones
/* → / (catch-all)
```

---

## WhatsApp y Conversión

**Número:** +52 811 526 9496
**URL base:** `https://wa.me/528115269496?text=Hola%20ZenHome%2C%20me%20interesa%20una%20cotización%20para%20mi%20proyecto%20de%20cocina%20integral.`

### Botón Flotante
- Clase: `.zh-wa-float` (position: fixed, bottom-right)
- Pulso animado verde (`.zh-wa-float__pulse`)
- Label "Cotiza gratis"
- GA4 event tracking en cada click

### Páginas de Portafolio
- Cada página individual también tiene botón de WhatsApp
- Mensaje personalizado por proyecto
- GA4 tracking por proyecto individual

---

## Tokens y API de Sanity

| Token | Tipo | Uso |
|-------|------|-----|
| "Build Script - Read Only" | Viewer | Usado en GitHub Secrets para build.js |
| "Test Write Token" | Editor | ⚠️ Creado para testing, pendiente eliminar |

### Sanity API Endpoints
- **CDN (lectura):** `https://qql4bn7x.apicdn.sanity.io/v2024-01-01/data/query/production`
- **Mutations:** `https://qql4bn7x.api.sanity.io/v2024-01-01/data/mutate/production`

---

## QA Completado

40 test cases ejecutados, 17 defectos encontrados y corregidos:
- Links de nav apuntaban a URLs externas de GHL → convertidos a anchors
- Section IDs faltantes → agregados
- Galería abría target="_blank" → eliminado
- URL de TikTok rota → corregida
- Links de WhatsApp viejos → actualizados al formato wa.me
- Widget GHL de WhatsApp → removido, reemplazado con botón nativo
- Scroll de navegación no funcionaba → corregido con capture-phase + options syntax

---

## Tareas Pendientes

### Inmediato
- [ ] Eliminar proyecto de prueba "Cocina Moderna de Prueba" de Sanity (y su página generada)
- [ ] Eliminar "Test Write Token" (Editor) de Sanity API tokens
- [ ] Verificar scroll de navegación funciona en producción

### Corto Plazo
- [ ] PageSpeed Insights post-QA para medir Core Web Vitals finales
- [ ] Implementar Google Search Console

### Fase 6 — Contenido (Futuro)
- [ ] Crear subpáginas individuales para cada servicio
- [ ] Agregar más testimonios con fotos reales
- [ ] Crear blog con guías ("Cómo elegir tu cocina integral", etc.)
- [ ] Optimizar Google Business Profile
- [ ] Invitar equipo de marketing a proyecto Sanity

### Monitoreo
- [ ] Configurar alertas de uptime
- [ ] Revisar GA4 periódicamente

---

## Cómo Hacer Deploy Manual

1. Ir a Cloudflare Pages → seozenhome → Deployments
2. Arrastrar carpeta completa `zenhome-site` al área de deploy
3. Cloudflare procesa y publica automáticamente

**O automáticamente:** Publicar/editar un proyecto en Sanity Studio → webhook dispara GitHub Actions → build + deploy automático.

---

## Notas para Desarrollo Futuro

1. **NO usar argumentos posicionales en scrollTo** — siempre usar sintaxis de objeto `{top: y, behavior: 'smooth'}`
2. **Los event listeners de navegación deben usar capture phase** (`true` como tercer argumento) porque GHL intercepta clicks en bubble phase
3. **El index.html principal es un export monolítico de GHL** (~282KB) — editarlo requiere cuidado, buscar los marcadores/comments para saber dónde insertar cambios
4. **build.js genera páginas entre marcadores** en el index.html principal y en `portafolio/index.html` — no editar manualmente el HTML generado entre esos marcadores
5. **Sanity Growth Trial** tiene ~30 días restantes (desde mediados de marzo 2026) — evaluar plan al expirar
6. **El usuario prefiere no usar Terminal** — buscar soluciones con UI o automatización
