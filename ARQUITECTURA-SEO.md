# ZenHome — Arquitectura del Sitio

> Documento de referencia para desarrollo rápido. Última actualización: Abril 2026.

---

## 1. Infraestructura General

| Componente | Servicio | Detalle |
|---|---|---|
| Hosting | Cloudflare Pages | Proyecto: `seozenhome`, Account ID: `6b6ab1e7185dbfaa9893f917ad6085a6` |
| CMS | Sanity.io | Project ID: `qql4bn7x`, Dataset: `production` |
| Repositorio | GitHub | `Frankcuellar/zenhome-site`, rama `main` |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` |
| Analytics | GA4 | `G-JSYYXX8Z2K` |
| WhatsApp | Directo | `+52 811 526 9496` |
| Dominio | zenhome.com.mx | DNS en Cloudflare |

**Flujo de deploy:**

```
Push a main  ──►  GitHub Actions  ──►  node build.js  ──►  wrangler pages deploy .
                     │
Sanity webhook  ─────┘  (repository_dispatch: sanity_publish)
```

El deploy toma ~28-30 segundos de punta a punta. Sanity tiene un webhook "Deploy to Cloudflare" que dispara `repository_dispatch` automáticamente cuando se publica contenido.


## 2. Estructura de Archivos

```
zenhome-site/
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline
├── proyectos/                  # Generado por build.js (no editar manual)
│   ├── index.html              # Índice del portafolio
│   └── {slug}/index.html       # Página individual por proyecto
├── portafolio/                 # Legacy (redirige a /proyectos/)
├── build.js                    # ★ Script principal — genera páginas de proyecto
├── index.html                  # Homepage — export estático de HighLevel/GHL (~281KB)
├── _headers                    # Headers de seguridad y cache (Cloudflare)
├── _redirects                  # Redirecciones 301 (www, GHL legacy, portafolio)
├── robots.txt
├── sitemap.xml
├── favicon.ico / icon-192.png
├── package.json                # Solo metadata, sin dependencias npm
├── GPT-CONTEXT.md              # Contexto para asistentes AI
├── HANDOFF.md                  # Notas de traspaso
├── QUICKWINS-PLAN.md           # Plan de mejoras rápidas
└── UPGRADE-PROYECTO-TEMPLATE.md
```

**Regla clave:** Todo dentro de `proyectos/` es generado. Nunca editar manualmente — los cambios se pierden en el próximo build.


## 3. Build Pipeline (`deploy.yml`)

```yaml
Trigger: push a main | repository_dispatch (sanity_publish) | workflow_dispatch
Runner: ubuntu-latest, Node 20
Secrets: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
Pasos: checkout → setup node → node build.js → wrangler pages deploy . --project-name=seozenhome
```

El comando `wrangler pages deploy .` sube TODO el directorio raíz (incluyendo `index.html` homepage). No hay paso de `npm install` porque `build.js` usa solo módulos nativos de Node (`https`, `fs`, `path`).


## 4. Sanity CMS — Schema `project`

**Query principal:**
```groq
*[_type == "project" && published == true] | order(featured desc, deliveryDate desc) {
  _id, title, slug, category, location, deliveryDate, duration,
  heroImage, description, challenge, solution, specs, gallery,
  videoUrl, testimonial, published, featured,
  materials, style, zone, result, seoTitle, seoDescription
}
```

**Campos clave:**

| Campo | Tipo | Uso |
|---|---|---|
| `title` | string | H1 de la página |
| `slug.current` | string | URL: `/proyectos/{slug}/` |
| `category` | string | `cocina`, `closet`, `interior`, `constructora` — normalizado a lowercase en build |
| `heroImage` | image ref | Imagen principal, se convierte via CDN: `cdn.sanity.io/images/{pid}/{dataset}/{id}-{w}x{h}.{ext}?w=900` |
| `solution` | Portable Text (blocks) | Convertido a HTML con `blocksToHtml()` |
| `specs` | array of objects | `{label, value}` — renderizado como grid de tarjetas |
| `gallery` | array of images | Cada una con `caption` opcional, ordenadas por narrativa visual |
| `materials` | array of strings | Slugs: `madera-encino`, `cuarzo-blanco`, etc. |
| `style` | string | Slug: `moderno-calido`, `minimalista`, etc. |
| `zone` | string | Slug: `cocina`, `vestidor`, etc. |
| `videoUrl` | string | URL de YouTube, embebido con `youtube-nocookie.com` |
| `testimonial` | object | `{author, text, rating}` — genera Review en JSON-LD |
| `seoTitle` / `seoDescription` | string | Override manual de meta tags |


## 5. build.js — Arquitectura Interna (829 líneas)

### 5.1 Config y API (líneas 1-70)

- Variables de entorno: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_TOKEN`
- `OUTPUT_DIR` → `./proyectos/`
- `sanityFetch(query)` — GET nativo con `https` module, devuelve `parsed.result`
- `WA_SVG` — SVG inline del icono de WhatsApp

### 5.2 Helpers de Contenido (líneas 70-120)

- `imageUrl(ref, width)` — Convierte referencia de imagen Sanity a URL de CDN. Pattern: `image-{id}-{w}x{h}-{ext}` → `https://cdn.sanity.io/images/{pid}/{dataset}/{id}-{w}x{h}.{ext}?w={width}`
- `blocksToHtml(blocks)` — Portable Text a HTML. Soporta: `h2`, `h3`, `h4`, `normal` (párrafos), marks (`strong`, `em`, `link`), `bullet` y `number` lists
- `escapeHtml(str)` — Con guard para `null`/no-string. Escapa `&`, `<`, `>`, `"`, `'`
- `projectCardHtml(p)` — Genera tarjeta de proyecto para el índice y related projects

### 5.3 Diccionario de Tags con Acentos (líneas 120-162)

```javascript
const SLUG_LABELS = {
  'moderno-calido': 'Moderno Cálido',
  'madera-encino': 'Madera de Encino',
  'cuarzo-blanco': 'Cuarzo Blanco',
  'acero-inoxidable': 'Acero Inoxidable',
  // ~30 entradas más...
}

function prettyTag(slug) {
  if (!slug) return ''
  if (SLUG_LABELS[slug]) return SLUG_LABELS[slug]
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) // fallback
}
```

**Se usa en:** Tags de materiales/estilo/zona, `generateSeoTitle()`, `generateSeoDescription()`, JSON-LD schema entities.

**Nota CSS:** `text-transform: capitalize` en `.seo-tag` puede sobrescribir el casing de "de" → "De". Aceptado como trade-off porque quitar el CSS rompería tags futuros no mapeados.

### 5.4 SEO (líneas 80-200)

```javascript
CATEGORY_LABELS = { cocina: 'Cocina Integral', closet: 'Closet', ... }
CATEGORY_TAGS = { cocina: ['cocinas integrales', 'diseño cocina', ...], ... }
CATEGORY_SEO = {
  cocina: {
    keyword: 'cocina integral',
    cta: 'Cotiza Tu Cocina Ideal',
    midCta: '¿Lista para transformar tu cocina?',
    closeCta: '¿Te gustaría un resultado similar?'
  }, ...
}
```

- `extractCity(location)` — Parsea "Colonia, Ciudad, Estado" → "Ciudad"
- `generateSeoTitle(project)` — Usa `seoTitle` si existe, o genera: `"{catLabel} en {city} | {prettyMaterials} | ZenHome"`
- `generateSeoDescription(project)` — Usa `seoDescription` si existe, o genera descripción con materiales, categoría y ciudad

### 5.5 Ordenamiento Narrativo de Galería (líneas 249-276)

```javascript
const GALLERY_ORDER = [
  { phase: 'resultado', keywords: /resultado|final|terminad|listo|acabado|entrega/i, weight: 0 },
  { phase: 'detalle',   keywords: /detalle|close.?up|acercamiento|material|textura/i, weight: 1 },
  { phase: 'antes',     keywords: /antes|recibimos|recibi|previo|original|comenzar|inicio/i, weight: 2 },
  { phase: 'proceso',   keywords: /proceso|instalaci|construcci|avance|progreso|durante/i, weight: 3 },
  { phase: 'experiencia', keywords: /familia|cliente|feliz|disfrutando|cocinar|vivir/i, weight: 4 },
]
```

**Lógica:** La primera imagen (weight 0 = "resultado") se usa como featured en la galería. Fotos sin caption reciben weight 1.5 (se intercalan entre detalle y antes). Funciona automáticamente para todos los proyectos futuros — solo hay que ponerle captions descriptivos a las imágenes en Sanity.

### 5.6 Template de Proyecto — 14 Secciones (líneas 277-730)

| # | Sección | Condición | Contenido |
|---|---|---|---|
| 0 | `<head>` | Siempre | Meta tags, OG, canonical, JSON-LD Article + BreadcrumbList, CSS completo inline |
| 1 | Header | Siempre | Logo + nav con link a portafolio y WA |
| 2 | Breadcrumb | Siempre | Inicio > Proyectos > Categoría > Título |
| 3 | Split Hero | Siempre | H1, meta (ubicación, fecha, duración), descripción, CTA WhatsApp, hero image |
| 4 | El Reto | `p.challenge` | Bloque de texto con el reto del cliente |
| 5 | Nuestra Solución | `solutionHtml` | Portable Text renderizado a HTML |
| 6 | Especificaciones | `specsCards` | Grid de tarjetas label/value |
| 7 | Materiales y Estilo | `hasTags` | Tags clicables con links a `/materiales/{slug}/`, `/estilos/{slug}/`, `/zonas/{slug}/` |
| 8 | Galería | `hasGallery` | Grid responsive con lightbox JS, ordenado narrativamente |
| 9 | Video | `videoSection` | YouTube iframe con `loading="lazy"`, privacy-enhanced mode |
| 10 | CTA Mid-page | galería o video | WhatsApp CTA con mensaje personalizado por categoría |
| 11 | El Resultado | `p.result` | Texto del resultado |
| 12 | Testimonial | `p.testimonial` | Blockquote con autor y estrellas, genera Review en JSON-LD |
| 13 | CTA de Cierre | Siempre | "¿Te gustaría un resultado similar?" + WA button + micro copy |
| 14 | Proyectos Relacionados | `relatedHtml` | 3 proyectos: misma categoría primero, luego featured |
| 15 | SEO Links Footer | Siempre | Money page link, todos los proyectos, servicios, showrooms, agendar cita |
| 16 | Footer | Siempre | Copyright dinámico |
| 17 | WA Float | Siempre | Botón flotante con pulso CSS |
| 18 | Lightbox | `hasGallery` | Modal JS con navegación teclado (Escape, flechas) |

### 5.7 WhatsApp — 3 Mensajes por Página

Cada proyecto genera 3 mensajes pre-escritos de WhatsApp (URL-encoded):

1. **Hero CTA:** "Hola ZenHome, vi su proyecto de {catLabel} en {city} y me gustaría cotizar algo similar para mi hogar."
2. **Mid CTA:** "Hola, estoy viendo el proyecto {title} y me interesa una cotización para mi {catKeyword}."
3. **Close CTA:** "Hola ZenHome, me encantó el proyecto {title}. ¿Podemos agendar una visita para platicar sobre mi proyecto?"

Todos incluyen `gtag('event', 'click_whatsapp', ...)` con labels diferenciados: `hero_cta_{slug}`, `mid_cta_{slug}`, `footer_cta_{slug}`.

### 5.8 CSS Design System

Todo el CSS está inline en el `<head>` de cada proyecto. Variables principales:

```css
--zh-dark: #1a1a1a
--zh-gold: #c8a45e
--zh-light: #f8f6f1
```

Breakpoints responsivos: `768px` (tablet) y `600px` (mobile).

Componentes CSS clave: `.split-hero` (grid 50/50), `.specs-grid` (auto-fill minmax 220px), `.gallery` (grid auto-fill minmax 280px), `.lightbox` (overlay fixed), `.zh-wa-float` (fixed bottom-right con pulse animation), `.seo-tag` (inline-block con capitalize), `.cta-wa-btn` / `.cta-mid` / `.cta-inline` (3 variantes de CTA).

### 5.9 Proyectos Relacionados (líneas 797-803)

```javascript
const sameCategory = projects.filter(p => p._id !== project._id && p.category === project.category && p.heroImage)
const others = projects.filter(p => p._id !== project._id && p.category !== project.category && p.featured && p.heroImage)
const related = [...sameCategory, ...others].slice(0, 3)
```

Solo incluye proyectos con `heroImage` para evitar tarjetas rotas.

### 5.10 Portfolio Index (líneas 732-753)

`portfolioIndexHtml()` busca un `proyectos/index.html` existente como template base. Si lo encuentra, reemplaza el contenido del `<div class="portfolio-grid">` con las tarjetas generadas. Si no existe, imprime warning.

### 5.11 Normalización de Categorías (línea 762)

```javascript
const map = { cocinas: 'cocina', cocina: 'cocina', closet: 'closet', closets: 'closet', ... }
```

Defiende contra typos en Sanity como "Cocinas" vs "cocina".


## 6. Homepage (`index.html`)

Archivo estático de ~281KB exportado desde HighLevel/GHL. No se genera con build.js.

**Secciones principales:**
- Hero carousel con CTA
- Servicios (cocinas, closets, interiores)
- Testimonios — 4 reseñas reales de Google (Xóchitl Mata, Francisco Reyes, Fernanda Garza, Héctor Martínez)
- Closets premium — copy actualizado
- Locaciones / Showrooms
- Footer con WhatsApp flotante
- GA4 tracking integrado

**Para editar:** Se modifica directamente en el repo. No depende de Sanity.


## 7. Configuración Cloudflare

### _redirects
```
www → apex (301)
/home → / (301)
/disenodecocinas → /#servicios (301)
/sobrenosotros → /#equipo (301)
/contacto → /#locaciones (301)
/portafolio/ → /proyectos/ (301)
/portafolio/:slug/ → /proyectos/:slug/ (301)
```

### _headers
- Security: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Cache: favicon 30 días, robots/sitemap 1 día


## 8. JSON-LD Schema

Cada página de proyecto genera:

1. **Article** — con `headline`, `image`, `datePublished`, `author` (ZenHome), `publisher`, `about` (entidades de materiales con prettyTag)
2. **BreadcrumbList** — Inicio > Proyectos > {Categoría} > {Título}
3. **Review** (condicional) — si existe `testimonial`, genera Review con `reviewRating`


## 9. Mejoras Implementadas en Esta Sesión

| Mejora | Archivos | Impacto |
|---|---|---|
| Testimonios reales de Google en homepage | `index.html` | Eliminó reseña fake "José N.", añadió 4 reseñas verificadas |
| Copy premium para closets | `index.html` | Mejor conversión en sección closets |
| `SLUG_LABELS` + `prettyTag()` | `build.js` | Tags con acentos correctos en español en toda la página |
| Ordenamiento narrativo de galería | `build.js` | Fotos de resultado primero, experiencia al final — automático por captions |
| Captions profesionales en Sanity | Sanity API | Reemplazó captions con emoji por alt-text descriptivo |
| SEO helpers con prettyTag | `build.js` | Meta titles y descriptions con nombres correctos de materiales |
| JSON-LD con prettyTag | `build.js` | Schema markup con entidades correctamente nombradas |


## 10. Cheat Sheet — Tareas Comunes

### Agregar un nuevo proyecto
1. Crear documento en Sanity con todos los campos
2. Poner captions descriptivos en las fotos de galería (el ordenamiento es automático)
3. Publicar en Sanity → webhook dispara deploy automático

### Agregar un material/estilo nuevo al diccionario
Editar `SLUG_LABELS` en `build.js` (~línea 120) y agregar el mapeo `'slug': 'Nombre Con Acentos'`.

### Modificar CTAs por categoría
Editar `CATEGORY_SEO` en `build.js` (~línea 95). Cada categoría tiene: `keyword`, `cta` (hero), `midCta`, `closeCta`.

### Cambiar el número de WhatsApp
Buscar y reemplazar `528115269496` en `build.js` (aparece en hero, mid, close CTAs + floating button).

### Editar la homepage
Modificar `index.html` directamente. Es HTML estático — no se regenera con build.

### Forzar un redeploy manual
Ir a GitHub → Actions → "Build & Deploy to Cloudflare Pages" → Run workflow.

### Acceso a la API de Sanity
```bash
# Leer proyectos
curl "https://qql4bn7x.api.sanity.io/v2024-01-01/data/query/production?query=*[_type==%22project%22]" \
  -H "Authorization: Bearer $SANITY_TOKEN"

# Mutar datos
curl -X POST "https://qql4bn7x.api.sanity.io/v2024-01-01/data/mutate/production" \
  -H "Authorization: Bearer $SANITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mutations": [{"patch": {"id": "DOC_ID", "set": {"field": "value"}}}]}'
```

### Tokens de Sanity para limpiar
Tokens creados durante sesiones de trabajo que deberían eliminarse: "Video Update Token", "Content Update Token 2", "Pulido Fino Fix", "Unpublish Test", "Gallery Fix". Mantener solo el token principal de lectura usado en GitHub Secrets.


## 11. Notas Técnicas

- **Sin npm install en CI:** `build.js` usa solo módulos nativos de Node. Esto hace el build ultra-rápido.
- **YouTube privacy mode:** Videos se embeben con `youtube-nocookie.com` + `loading="lazy"`. Parsers estáticos no ven el iframe, pero los usuarios sí.
- **Página legacy `prueba-frank`:** Puede existir un `/proyectos/prueba-frank/index.html` estático en Cloudflare sin documento Sanity correspondiente. Considerar limpieza.
- **Git push desde sandbox:** No funciona (HTTP 403). Siempre proporcionar el comando exacto para que el usuario ejecute localmente.
