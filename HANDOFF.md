# ZenHome Website Migration — Handoff Context

## Proyecto
Migración del sitio web de ZenHome (cocinas integrales en Monterrey) desde GoHighLevel (GHL) a Netlify, manteniendo diseño idéntico con optimización SEO avanzada y conversión vía WhatsApp.

**URL producción:** https://zenhome.com.mx
**Hosting:** Netlify (deploy manual de carpeta `zenhome-site`)
**DNS:** GoDaddy → A record `75.2.60.5` + CNAME `apex-loadbalancer.netlify.com`

---

## Estado Actual del Proyecto

### Fases Completadas

| Fase | Estado |
|------|--------|
| 1. Exportar HTML de GHL y deploy estático en Netlify | ✅ Completado |
| 2. DNS, HTTPS, `_redirects`, `_headers`, `robots.txt`, `sitemap.xml` | ✅ Completado |
| 3. Rendimiento / Core Web Vitals (preconnect, preload, lazy loading) | ✅ Completado |
| 4. SEO On-Page Avanzado (heading hierarchy, Schema.org, meta tags) | ✅ Completado |
| 5. Conversión / WhatsApp (botón flotante WA, GA4, microcopy) | ✅ Completado |
| QA Testing (40 test cases, 17 defectos encontrados y corregidos) | ✅ Completado |

### Tarea Pendiente Inmediata

**🔴 Verificar que el scroll de navegación funciona después del último deploy.**

El último cambio fue actualizar el script de scroll para usar `window.scrollTo({top: y, behavior: 'smooth'})` en vez de `window.scrollTo(0, y)`. La sintaxis de dos argumentos NO FUNCIONA en el contexto de GHL/Nuxt — es un bug/quirk del framework exportado. El usuario confirmó el deploy ("hecho") pero aún no se verificó en el browser.

### Fase Pendiente Futura

**Fase 6 — Contenido a largo plazo:** Crear página de portafolio independiente, página de servicios, más testimonios, blog/guías, Google Business Profile. No está activa.

---

## Archivos del Proyecto

Ubicación: `/Downloads/zenhome-site/` (carpeta local del usuario)

| Archivo | Descripción |
|---------|-------------|
| `index.html` (~282KB) | Página principal, todo el HTML/CSS/JS inline de GHL |
| `_redirects` | Redirects de Netlify (www→apex, URLs antiguas GHL→anchors) |
| `_headers` | Headers de seguridad y cache |
| `robots.txt` | Permite todo, apunta al sitemap |
| `sitemap.xml` | Una sola URL: https://zenhome.com.mx/ |
| `favicon.ico` | Favicon exportado de GHL |
| `icon-192.png` | Ícono PWA |

---

## Detalles Técnicos Críticos

### 1. Bug de scrollTo en GHL/Nuxt

**El descubrimiento más importante de este proyecto:**

El HTML exportado de GHL incluye un framework Nuxt.js que **bloquea completamente `window.scrollTo(x, y)` con argumentos posicionales**, pero **permite `window.scrollTo({top: y, behavior: 'smooth'})` con objeto de opciones**.

Esto aplica a TODOS los métodos de scroll con argumentos posicionales:
- ❌ `window.scrollTo(0, 1100)` — NO funciona
- ❌ `window.scroll(0, 1100)` — NO funciona
- ❌ `window.scrollBy(0, -500)` — NO funciona
- ❌ `document.documentElement.scrollTop = 1100` — NO funciona
- ✅ `window.scrollTo({top: 1100, behavior: 'instant'})` — SÍ funciona
- ✅ `window.scrollTo({top: 1100, behavior: 'smooth'})` — SÍ funciona
- ✅ `element.scrollIntoView({behavior: 'instant', block: 'start'})` — SÍ funciona
- ✅ Scroll con mouse wheel — SÍ funciona

### 2. Estructura DOM de GHL

```
html
  body
    div#__nuxt
      span.nuxt-route-announcer (accesibilidad)
      div.bgCover.bg-fixed (position: fixed, background decorativo, SIN hijos)
      div (sin clase, 4313px alto, CONTENIDO REAL)
      div#teleports (vacío)
    a.zh-wa-float (botón WhatsApp flotante, agregado por nosotros)
    script (navigation scroll handler, agregado por nosotros)
```

### 3. GHL Intercepta Clicks en Nav

GHL registra event listeners en los divs wrapper del menú de navegación que llaman `preventDefault()` en fase bubble. Nuestra solución: un script en **fase capture** con `stopImmediatePropagation()` que intercepta antes que GHL.

### 4. Script de Navegación (última versión)

```html
<!-- Navigation scroll handler (capture phase, options syntax required by GHL/Nuxt) -->
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
  }, true); // ← capture: true es ESENCIAL
})();
</script>
```

Ubicado justo antes de `</body></html>` en el index.html.

---

## Section IDs para Navegación

| Nav Link | href | Section ID |
|----------|------|------------|
| Inicio | `#` | (scroll to top) |
| Diseño de Cocinas | `#servicios` | `id="servicios"` |
| Portafolio | `#proyectos` | `id="proyectos"` |
| Sobre Nosotros | `#equipo` | `id="equipo"` |
| Contacto | `#locaciones` | `id="locaciones"` |

Otros IDs en la página: `ventajas`, `testimonios`, `closets`, `constructoras`

---

## SEO Implementado

### Meta Tags
- Title: "Cocinas Integrales y Diseño de Interiores en Monterrey | ZenHome"
- Description optimizada con keywords locales
- Open Graph completo (og:title, og:description, og:image, og:type, og:url, og:locale)
- Twitter Cards (summary_large_image)
- Canonical URL
- hreflang (es-MX + x-default)

### Schema.org (JSON-LD)
1. **InteriorDesigner + LocalBusiness** — nombre, teléfono, direcciones (2 sucursales), horarios, área de servicio (7 ciudades), servicios, redes sociales, aggregateRating, review
2. **FAQPage** — 5 preguntas frecuentes sobre cocinas en Monterrey

### Heading Hierarchy
- 1 × H1: "Creamos cocinas que equilibran estética, funcionalidad y minimalismo"
- 8 × H2: secciones principales
- H3s: subsecciones

### Redirects 301 (archivo `_redirects`)
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
**URL WhatsApp:** `https://wa.me/528115269496?text=Hola%20ZenHome%2C%20me%20interesa%20una%20cotización%20para%20mi%20proyecto%20de%20cocina%20integral.`

### Botón flotante WhatsApp
- Clase: `.zh-wa-float` (position: fixed, bottom-right)
- Pulso animado verde (`.zh-wa-float__pulse`)
- Label "Cotiza gratis"
- Reemplazó el widget original de GHL

### Google Analytics 4
- Measurement ID: `G-JSYYXX8Z2K`
- Stream: "PixelZenhome" (ID: 10677763727)
- Cuenta: "FrankAnalytics"
- Tracking de clicks en botón WA con `gtag('event', ...)`

---

## QA — Defectos Encontrados y Resueltos

Se ejecutaron 40 test cases. 17 defectos encontrados, todos corregidos:
- Links de nav apuntaban a URLs externas de GHL → convertidos a anchors (`#servicios`, etc.)
- Section IDs faltantes → agregados
- Galería abría target="_blank" → eliminado
- URL de TikTok rota → corregida
- Links de WhatsApp viejos → actualizados al formato wa.me
- Widget GHL de WhatsApp → removido, reemplazado con botón nativo
- Scroll de navegación no funcionaba → corregido con script capture-phase + options syntax

**Archivo de matriz QA:** `qa-matrix.xlsx` (en la carpeta del proyecto)

---

## Cómo Hacer Deploy

1. El usuario tiene la carpeta `zenhome-site` en su computadora (en Downloads)
2. Va a Netlify → Sites → ZenHome → Deploys
3. Arrastra la carpeta completa `zenhome-site` al área de deploy manual
4. Netlify procesa y publica automáticamente

---

## Próximos Pasos Sugeridos

1. **INMEDIATO:** Verificar que el scroll de navegación funciona con el último deploy (el script con `scrollTo({top: y, behavior: 'smooth'})`)
2. **Corto plazo:** PageSpeed Insights post-QA para medir Core Web Vitals finales
3. **Fase 6 — Contenido:**
   - Crear subpáginas individuales para cada servicio
   - Agregar más testimonios con fotos
   - Crear blog con guías ("Cómo elegir tu cocina integral", etc.)
   - Optimizar Google Business Profile
   - Implementar Google Search Console
4. **Monitoreo:** Configurar alertas de uptime y revisar GA4 periódicamente
