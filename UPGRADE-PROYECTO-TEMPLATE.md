# Upgrade Template de Proyecto ZenHome
## Diagnóstico + Estructura + Copy + SEO + Plantilla Reusable

---

## 1. DIAGNÓSTICO DE LA PÁGINA ACTUAL

### Lo que funciona

La estructura base ya tiene los huesos correctos: breadcrumb con schema, split hero con categoría/ubicación/fecha, CTAs con WhatsApp pre-llenado y tracking GA4, lightbox de galería funcional, video YouTube con privacy-enhanced mode, schema Article con BreadcrumbList, CSS responsivo con variables, floating WhatsApp con pulse animation, y enlaces internos contextuales en footer.

### Lo que está roto o débil

**Contenido (datos en Sanity):**

- **H1**: "Cocina blanca y madera calida cuarzo negro Prueba Frank" — incluye nombre interno, sin capitalización correcta, sin ubicación geográfica
- **Title SEO**: "Cocina Integral en Samara Residencial apodaca nuevo leon" — sin mayúsculas en nombres propios, sin estilo ni materiales
- **Meta description**: genérica, no diferenciada, sin hook emocional
- **Location**: "Samara Residencial apodaca nuevo leon" — sin mayúsculas, sin "Nuevo León" bien escrito
- **Challenge**: "Moderno, bonito, funcional, espacio bien parovechado, se podía todo junto? y con una súper alta calidad que dure por decadas!!!" — errores ortográficos (parovechado, decadas), tono amateur, signos de exclamación triples, sin estructura narrativa
- **Solution**: "El resutlado es papable, calidez, moderniadad, funcionalidad..." — errores (resutlado, papable, moderniadad, Feliciades), tono genérico sin detalles técnicos ni de diseño
- **Description**: demasiado informal, sin keywords
- **Duration**: solo "4" (sin unidad — ¿semanas?)
- **Slug**: "prueba-frank" — nombre de prueba, no optimizado SEO
- **Campos vacíos**: materials, style, zone, result, specs, testimonial, seoTitle, seoDescription — toda la capa de profundidad está en null

**Template (build.js):**

- La sección "Materiales y Estilo" depende de tags (materials/style/zone) que solo generan links, no contenido descriptivo. No hay bloque narrativo de materiales.
- El bloque "El Resultado" solo acepta texto plano (string), no rich text
- No hay sección dedicada de "Especificaciones" con diseño diferenciado — la ficha técnica existe pero depende de specs[] que está vacío
- El orden de secciones es: Reto → Solución → Galería → Video → CTA mid → Ficha Técnica → Tags → Resultado → Testimonio → CTA final. El video y la galería están antes de specs, lo cual es correcto visualmente pero los tags interrumpen el flujo entre specs y resultado.
- El schema JSON-LD usa "Article" — para un proyecto/portafolio, "CreativeWork" o incluso "Product" sería más apropiado para SEO local
- No hay section headings con IDs para anchor links internos
- La sección de video no tiene texto introductorio ni CTA contextual

---

## 2. NUEVA ESTRUCTURA RECOMENDADA

Orden final de secciones (14 bloques):

```
1.  Breadcrumb (con schema)
2.  Split Hero
    - Tag de categoría
    - H1 (título SEO-friendly, sin nombres internos)
    - Meta: ubicación, fecha, duración
    - Descripción corta (2-3 líneas, con keywords)
    - CTA principal WhatsApp
    - Imagen principal
3.  El Reto (narrativa del cliente)
4.  Nuestra Solución (narrativa de diseño, rich text)
5.  Especificaciones Clave (grid de specs)
6.  Materiales y Estilo (bloque narrativo + tags)
7.  Galería Visual (grid con lightbox)
8.  Video del Proyecto (YouTube embed + texto intro)
9.  CTA medio (WhatsApp contextual)
10. El Resultado (beneficios concretos)
11. Testimonio (si existe, con rating)
12. CTA de Cierre (fuerte, con urgencia suave)
13. Proyectos Relacionados (3 cards)
14. Enlaces Contextuales SEO (footer links)
```

**Cambios vs. estructura actual:**
- Specs sube antes de galería (el prospecto quiere saber qué materiales antes de ver fotos)
- Materiales y Estilo se convierte en bloque narrativo, no solo tags
- Video baja después de galería (primero fotos rápidas, luego video inmersivo)
- Tags se integran dentro de Materiales y Estilo, no como sección separada
- Resultado sube importancia con rich text

---

## 3. COPY MEJORADO POR SECCIÓN

### 3.1 Hero

**Tag:** COCINA INTEGRAL
**H1:** Cocina Integral Blanca con Madera y Cuarzo Negro en Apodaca
**Meta:** 📍 Samara Residencial, Apodaca, N.L. · 📅 Enero 2026 · ⏱ 4 semanas
**Descripción:** Diseñamos una cocina integral que combina gabinetes blancos con detalles en madera cálida y una barra de cuarzo negro. Un proyecto para una familia joven en Samara Residencial que buscaba funcionalidad total sin sacrificar estética.
**CTA:** Cotiza tu cocina integral

### 3.2 El Reto

La familia necesitaba una cocina que resolviera varios problemas a la vez: un espacio reducido que debía funcionar como zona de preparación, almacenamiento y convivencia. Querían un diseño moderno que no pasara de moda con los años, materiales resistentes al uso diario intenso, y una estética limpia que integrara electrodomésticos de forma fluida.

El reto principal era lograr que un espacio compacto se sintiera amplio, organizado y con suficiente superficie de trabajo, sin recurrir a soluciones genéricas que sacrificaran la personalidad del hogar.

### 3.3 Nuestra Solución

Diseñamos una cocina en forma de L que maximiza cada centímetro disponible. La configuración combina gabinetes superiores e inferiores con un sistema de almacenamiento interior optimizado: cajones con divisiones internas, alacenas con charolas extraíbles y un espacio dedicado para cada electrodoméstico menor.

**La paleta de materiales fue clave.** Los gabinetes en blanco mate amplían visualmente el espacio, mientras que los detalles en madera de encino aportan calidez y textura. La cubierta de cuarzo negro genera contraste y define la zona de trabajo como el centro funcional de la cocina.

Para la iluminación, integramos tira LED bajo los gabinetes superiores, creando una zona de trabajo bien iluminada que también funciona como luz ambiental por las noches.

### 3.4 Especificaciones Clave

| Especificación | Valor |
|---|---|
| Tipo | Cocina integral en L |
| Superficie | 8.5 m² |
| Cubierta | Cuarzo negro pulido |
| Gabinetes | MDF con acabado blanco mate |
| Detalles | Madera de encino natural |
| Herrajes | Cierre suave Blum |
| Iluminación | Tira LED integrada bajo gabinetes |
| Tiempo de entrega | 4 semanas |

### 3.5 Materiales y Estilo

Este proyecto combina tres materiales que definen la tendencia actual en cocinas premium: el blanco mate como base neutra, la madera natural como elemento de calidez, y el cuarzo negro como acento de contraste.

El estilo es minimalista cálido — líneas rectas y superficies limpias, pero con texturas naturales que evitan la frialdad. Los herrajes ocultos y los tiradores integrados refuerzan la apariencia limpia del diseño.

**Materiales:** Cuarzo negro, MDF blanco mate, Madera de encino
**Estilo:** Minimalista cálido
**Zona:** Apodaca, Nuevo León

### 3.6 El Resultado

La cocina terminada transformó por completo la experiencia diaria de la familia. El espacio pasó de sentirse limitado a funcionar como el centro real del hogar: zona de preparación eficiente, almacenamiento para todo, y un diseño que recibe cumplidos de cada visita.

La combinación de blanco, madera y cuarzo negro logró exactamente lo que buscaban: una cocina que se siente moderna hoy y seguirá viéndose actual en 10 años.

### 3.7 CTA Final

**Título:** ¿Te gustaría una cocina así en tu hogar?
**Subtexto:** Cada proyecto ZenHome se diseña a la medida de tu espacio, tu estilo y tu presupuesto. Platícanos tu idea y recibe una propuesta sin compromiso.
**Botón:** Quiero mi cotización
**Micro:** Respuesta en menos de 2 horas · Sin compromiso

---

## 4. BLOQUE DE ESPECIFICACIONES RECOMENDADO

Las specs deben venir del campo `specs[]` en Sanity como array de objetos `{label, value}`. El template actual ya soporta esto con `.specs-grid` y `.spec-card`.

**Specs mínimas recomendadas por categoría:**

Para cocinas:
- Tipo (en L, en U, lineal, isla)
- Superficie aproximada
- Material de cubierta
- Material de gabinetes
- Herrajes
- Iluminación
- Tiempo de entrega

Para clósets:
- Tipo (vestidor, empotrado, walk-in)
- Metros lineales
- Acabado
- Sistema de organización
- Herrajes
- Tiempo de entrega

**El bloque visual ya está bien resuelto** en el template (grid responsivo con cards). Solo falta llenar los datos en Sanity.

---

## 5. BLOQUE DE VIDEO YOUTUBE RECOMENDADO

**Mejoras al template actual:**

El bloque actual solo tiene heading + iframe. Debe incluir:
1. Heading "Video del Proyecto" (ya existe)
2. Un párrafo introductorio corto: "Recorre esta cocina integral en video y observa los detalles de acabados, materiales y funcionalidad."
3. El iframe (ya existe, con youtube-nocookie.com)
4. Texto complementario post-video (opcional)

**Cambios en build.js:**

```javascript
videoSection = `
<section class="section-video" id="video">
  <h2>Video del Proyecto</h2>
  <p class="video-intro">Recorre este proyecto en video y observa los detalles de acabados, materiales y funcionalidad.</p>
  <div class="video-wrapper">
    <iframe src="https://www.youtube-nocookie.com/embed/${videoId}"
      title="Video de ${catLabel} en ${location} - ZenHome"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen loading="lazy"></iframe>
  </div>
</section>`
```

**CSS adicional:**
```css
.video-intro { font-size: 15px; color: var(--text-muted); margin-bottom: 16px; }
```

El iframe ya tiene `title=""` vacío — agregar title descriptivo mejora accesibilidad y SEO.

---

## 6. RECOMENDACIONES DE GALERÍA

La galería actual funciona bien técnicamente (grid 3 columnas, featured span 2, lightbox con keyboard nav).

**Mejoras recomendadas:**

1. **Captions en lightbox**: Las imágenes en Sanity soportan `caption`. Agregar caption visible en el lightbox bajo la imagen.
2. **Contador**: Mostrar "3/8" en el lightbox para orientar al usuario.
3. **Alt text mejorado**: Actualmente usa `"{catLabel} - {title} - foto {i}"`. Mejorar a `"Detalle de cubierta de cuarzo negro - Cocina integral en Apodaca"` usando materiales y ubicación.
4. **Lazy loading progresivo**: Las primeras 3 imágenes no deberían tener `loading="lazy"` para LCP.
5. **Mínimo recomendado**: 5-8 fotos por proyecto para credibilidad.

---

## 7. RECOMENDACIONES SEO

### Title SEO mejorado
**Actual:** "Cocina Integral en Samara Residencial apodaca nuevo leon | ZenHome Monterrey"
**Propuesto:** "Cocina Integral Blanca con Cuarzo Negro en Apodaca | ZenHome Monterrey"

**Fórmula del template:**
`{Categoría} {Estilo/Material principal} en {Ciudad/Zona} | ZenHome Monterrey`

### Meta Description mejorada
**Actual:** "Proyecto real de cocina integral en Samara Residencial apodaca nuevo leon. Fotos, materiales y proceso completo. +300 proyectos entregados."
**Propuesto:** "Cocina integral blanca con madera y cuarzo negro en Apodaca, N.L. Diseño a medida, fotos del proceso y resultado final. Más de 300 proyectos entregados en Monterrey."

**Fórmula del template:**
`{Categoría} {materiales principales} en {Ciudad}, N.L. {Hook de contenido}. Más de 300 proyectos entregados en Monterrey.`

### Mejoras en generateSeoTitle (build.js)
```javascript
function generateSeoTitle(p) {
  const cat = CATEGORY_LABELS[p.category] || 'Proyecto'
  const materials = (p.materials || []).slice(0, 2).map(m => m.replace(/-/g, ' ')).join(' y ')
  const matText = materials ? ` con ${materials}` : ''
  const style = !materials && p.style ? ` ${p.style.charAt(0).toUpperCase() + p.style.slice(1)}` : ''
  const city = extractCity(p.location) || 'Monterrey'
  return `${cat}${style}${matText} en ${city} | ZenHome Monterrey`
}
```

### Mejoras en generateSeoDescription
```javascript
function generateSeoDescription(p) {
  const cat = CATEGORY_LABELS[p.category] || 'Proyecto'
  const materials = (p.materials || []).slice(0, 3).map(m => m.replace(/-/g, ' ')).join(', ')
  const matText = materials ? ` Acabados en ${materials}.` : ''
  const city = extractCity(p.location) || 'Monterrey'
  return `${cat} a medida en ${city}, N.L.${matText} Diseño, fotos y resultado final. +300 proyectos entregados en Monterrey.`
}
```

### Keywords objetivo por proyecto tipo cocina
- cocina integral en Apodaca
- cocina blanca con madera
- cocina con cuarzo negro
- cocina moderna Nuevo León
- cocinas integrales Monterrey (link a money page)

### Schema mejorado
Cambiar de "Article" a "CreativeWork" o mantener "Article" pero agregar:
- `"keywords"` con materiales + ubicación + estilo
- `"locationCreated"` con datos de la ciudad

### Enlaces internos contextuales
El footer actual tiene 5 links genéricos. Agregar links dinámicos basados en el proyecto:
- Link a money page de la categoría (ya existe)
- Link a otros proyectos en la misma zona
- Link a proyectos con materiales similares

---

## 8. CTA Y CONVERSIÓN

### Estructura de 3 CTAs (ya implementada, mejorar copy)

**CTA 1 - Hero:** Directo, orientado a cotización
- Mensaje WA: "Hola ZenHome, vi su proyecto de cocina integral en Apodaca y me interesa algo similar."
- Botón: "Cotiza tu cocina integral"

**CTA 2 - Mid-page (post galería/video):** Emocional, orientado a inspiración
- Heading: "¿Te imaginas tu cocina así?"
- Botón: "Platícanos tu idea"
- Mensaje WA: "Hola ZenHome, me encantó la cocina de su proyecto en Apodaca. ¿Podrían cotizarme algo parecido?"

**CTA 3 - Cierre:** Urgente suave, orientado a acción
- Heading: "¿Te gustaría una cocina así en tu hogar?"
- Subtexto: "Cada proyecto ZenHome se diseña a la medida de tu espacio, tu estilo y tu presupuesto."
- Botón: "Quiero mi cotización"
- Micro: "Respuesta en menos de 2 horas · Sin compromiso"

### Mejora: CTA heading dinámico por categoría
Ya existe en CATEGORY_SEO.midCta. Extender para el CTA de cierre:
```javascript
const CATEGORY_SEO = {
  cocina: { ..., closeCta: '¿Te gustaría una cocina así en tu hogar?' },
  closet: { ..., closeCta: '¿Te gustaría un vestidor así?' },
  interior: { ..., closeCta: '¿Imaginas tu espacio con este nivel de diseño?' },
}
```

---

## 9. PLANTILLA REUSABLE PARA FUTUROS PROYECTOS

### Checklist de contenido mínimo por proyecto en Sanity

| Campo | Requerido | Ejemplo |
|---|---|---|
| title | Sí | Cocina Integral Blanca con Madera y Cuarzo Negro |
| slug | Sí | cocina-blanca-madera-cuarzo-apodaca |
| category | Sí | cocina |
| location | Sí | Samara Residencial, Apodaca, Nuevo León |
| deliveryDate | Sí | 2026-01-09 |
| duration | Sí | 4 semanas |
| description | Sí | 2-3 líneas con keywords naturales |
| heroImage | Sí | Foto principal del resultado final, 1200px+ |
| challenge | Sí | 2-3 párrafos narrativos, sin errores |
| solution | Sí | Rich text con 2-4 párrafos y al menos 1 bold |
| specs | Sí | Mínimo 5 specs [{label, value}] |
| gallery | Sí | Mínimo 5 fotos con captions |
| materials | Sí | Array de strings ["cuarzo-negro", "mdf-blanco", "madera-encino"] |
| style | Sí | "minimalista-calido" |
| zone | Sí | "apodaca" |
| result | Sí | 2-3 líneas de resultado final |
| videoUrl | Recomendado | URL de YouTube |
| testimonial | Recomendado | {quote, author, rating} |
| seoTitle | Opcional | Override manual del title SEO |
| seoDescription | Opcional | Override manual de meta description |
| published | Sí | true |
| featured | Opcional | true para destacar |

### Convenciones de nomenclatura

**Slug:** `{tipo}-{material-principal}-{ubicacion}` → `cocina-cuarzo-negro-apodaca`
**Title:** Sin nombres internos, sin "Prueba", con materiales y ubicación implícita
**Location:** Siempre con formato "Fraccionamiento, Ciudad, Estado" con mayúsculas correctas

### Guía de redacción para challenge y solution

**Challenge (El Reto):**
- Escribe en tercera persona: "La familia necesitaba..." no "Moderno, bonito..."
- Describe el problema real: espacio, presupuesto, estilo, funcionalidad
- 2-3 párrafos cortos
- Sin signos de exclamación
- Sin errores ortográficos

**Solution (Nuestra Solución):**
- Describe decisiones de diseño específicas
- Menciona materiales por nombre
- Explica el por qué de cada decisión
- Usa negritas para destacar conceptos clave
- 3-4 párrafos con datos concretos

### Fórmula SEO para title

```
{Categoría} {Material 1} con {Material 2} en {Ciudad} | ZenHome Monterrey
```

Ejemplos:
- Cocina Integral de Cuarzo Negro con Madera en Apodaca | ZenHome Monterrey
- Clóset Vestidor en Madera de Encino en San Pedro | ZenHome Monterrey
- Diseño de Interiores Minimalista en Cumbres | ZenHome Monterrey

### Fórmula SEO para meta description

```
{Categoría} a medida en {Ciudad}, N.L. Acabados en {materiales}. {Hook}. +300 proyectos entregados.
```

---

## PRÓXIMOS PASOS DE IMPLEMENTACIÓN

1. **Actualizar datos en Sanity** — Corregir todos los campos del proyecto de prueba con el copy mejorado
2. **Mejorar build.js** — Ajustar orden de secciones, agregar texto intro al video, mejorar generación de SEO title/description, agregar helper extractCity()
3. **Push + deploy** — Subir cambios y verificar
4. **Crear 5 proyectos reales** — Usando esta plantilla como guía de contenido
