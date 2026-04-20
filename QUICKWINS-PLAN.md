# ZenHome — Plan de Quick Wins: Cocinas Integrales
## Enfoque: 80% del negocio, resultados medibles en 30 días

---

## Principio rector

No vamos a construir 40 páginas. Vamos a construir las 5-6 cosas que generan el mayor impacto comercial lo más rápido posible, medirlas, y decidir qué sigue basándonos en datos reales.

---

## QUICK WIN 1: Google Search Console (Día 1)
**Impacto: CRÍTICO — Sin esto, todo lo demás es a ciegas**

Sin GSC no sabemos:
- Si Google está indexando las páginas actuales
- Qué queries están generando impresiones
- Si hay errores de rastreo
- Cuántas páginas tiene Google en su índice

**Acción concreta:**
1. Ir a https://search.google.com/search-console
2. Agregar propiedad: zenhome.com.mx
3. Verificar con DNS (agregar registro TXT en Cloudflare DNS)
4. Enviar sitemap: https://zenhome.com.mx/sitemap.xml
5. Esperar 48-72 horas para datos iniciales

**Resultado medible:** Datos de impresiones y clics disponibles en 3-5 días.

---

## QUICK WIN 2: Google Business Profile (Día 1-2)
**Impacto: ALTO — SEO local inmediato, sin necesidad de crear páginas**

GBP es la forma más rápida de aparecer en búsquedas locales tipo "cocinas integrales cerca de mí" o "cocinas integrales monterrey" en el mapa.

**Acción concreta:**
1. Verificar que ZenHome tiene GBP activo para ambas sucursales
2. Si no existe: crear perfil en https://business.google.com
3. Optimizar:
   - Categoría principal: "Diseñador de cocinas" o "Tienda de cocinas"
   - Categorías secundarias: "Diseñador de interiores", "Tienda de muebles de cocina"
   - Descripción con keywords naturales (cocinas integrales, Monterrey, a la medida)
   - Fotos de proyectos reales (mínimo 10-15 fotos de calidad)
   - Horarios correctos
   - Número de WhatsApp
   - Link a zenhome.com.mx
4. Solicitar reseñas a clientes recientes (objetivo: llegar a 10-15 reseñas con 4.8+ estrellas)

**Resultado medible:** Aparición en Google Maps en 1-2 semanas. Llamadas y direcciones desde GBP.

---

## QUICK WIN 3: Página /cocinas-integrales-monterrey (Día 3-10)
**Impacto: CRÍTICO — Es la money page #1, la que más tráfico comercial puede capturar**

Esta es LA página. La keyword "cocinas integrales monterrey" tiene la mayor intención de compra y el mayor volumen de búsqueda del nicho.

### Especificaciones SEO
- **URL:** /cocinas-integrales-monterrey/
- **H1:** Cocinas Integrales en Monterrey a la Medida
- **Title:** Cocinas Integrales en Monterrey | Diseño a la Medida | ZenHome
- **Meta:** Diseñamos y fabricamos cocinas integrales a la medida en Monterrey. Cuarzo, granito, madera y melamina. Cotización gratis por WhatsApp. +300 proyectos entregados.
- **Keyword:** cocinas integrales monterrey

### Estructura de contenido sugerida
1. Hero: headline + imagen de impacto + CTA WhatsApp
2. Propuesta de valor: por qué ZenHome (3-4 puntos diferenciadores)
3. Proceso de trabajo: del diseño a la instalación (4-5 pasos visuales)
4. Proyectos destacados: 3-4 cards de proyectos del portafolio (ya existen)
5. Materiales que trabajamos: cuarzo, granito, melamina, madera (con fotos)
6. Zonas que atendemos: lista de zonas del área metropolitana
7. FAQ: 4-5 preguntas frecuentes (¿cuánto cuesta? ¿cuánto tiempo? etc.)
8. CTA final: WhatsApp + showrooms

### Schema.org
- Service + provider (ZenHome como LocalBusiness)
- FAQPage con las preguntas
- BreadcrumbList

### Internal linking
- Desde: Home (nav + sección de servicios)
- Hacia: /proyectos/, /contacto, /showrooms, proyectos individuales

### Implementación técnica
- Crear como HTML estático en /cocinas-integrales-monterrey/index.html
- Puede generarse por build.js desde un tipo "servicePage" en Sanity, O crearse como HTML estático manual primero y migrar a CMS después
- **Recomendación para quick win: crear como HTML estático primero.** No esperar a evolucionar Sanity.

**Resultado medible:** Indexación en Google en 1-2 semanas. Primeras impresiones en GSC en 2-4 semanas. Rankings para "cocinas integrales monterrey" en 4-8 semanas.

---

## QUICK WIN 4: 5 proyectos más en el portafolio (Día 3-14)
**Impacto: ALTO — Cada proyecto es una página indexable que posiciona por zona + estilo + material**

Actualmente hay 3 proyectos (+ 1 de prueba que hay que eliminar). ZenHome dice tener +300. Publicar 5 proyectos bien hechos es lo que más rápido multiplica el número de páginas indexables y da credibilidad al claim de "cientos de proyectos".

### Criterios de selección (publicar los que cumplan más criterios)
- [ ] Tiene fotos de calidad (mínimo 6)
- [ ] Es de cocina integral (foco del 80%)
- [ ] Es de una zona prioritaria (San Pedro, Guadalupe, Monterrey, Apodaca)
- [ ] Tiene un estilo identificable (moderna, minimalista, etc.)
- [ ] Tiene materiales relevantes (cuarzo, granito, madera)
- [ ] Tiene un reto/historia interesante
- [ ] Idealmente tiene testimonio del cliente

### Mix ideal de los 5 proyectos
1. Cocina moderna en San Pedro (zona premium)
2. Cocina minimalista en Monterrey (zona principal)
3. Cocina con isla en Guadalupe (cerca del showroom)
4. Cocina pequeña optimizada (pain point común)
5. Remodelación de cocina (servicio adicional)

### Campos que llenar en Sanity por proyecto
- title, slug, category, location, deliveryDate, duration
- heroImage (foto de impacto)
- description (2-3 párrafos de contexto)
- challenge (qué problema tenía el cliente)
- solution (cómo lo resolvió ZenHome)
- specs (materiales, medidas, acabados)
- gallery (6-12 fotos)
- testimonial (si existe)

**Resultado medible:** 5 nuevas páginas indexables. Impresiones en Google Imágenes. Internal linking desde la página de cocinas-integrales-monterrey.

---

## QUICK WIN 5: Migración /portafolio/ → /proyectos/ (Día 10-12)
**Impacto: MEDIO — Mejor URL, mejor SEO, necesario antes de crecer más**

Hacerlo AHORA, cuando solo hay 3-4 proyectos indexados, minimiza el impacto de los redirects. Si esperamos a tener 20 proyectos, el cambio será más riesgoso.

### Pasos concretos
1. En build.js: cambiar OUTPUT_DIR de 'portafolio' a 'proyectos'
2. En build.js: actualizar todas las referencias internas a /portafolio/ → /proyectos/
3. En _redirects: agregar:
   ```
   /portafolio/ /proyectos/ 301
   /portafolio/:slug /proyectos/:slug 301
   ```
4. En index.html: actualizar links del menú y sección de portafolio
5. Actualizar sitemap.xml
6. Push a GitHub → deploy automático
7. Verificar en GSC que los 301s funcionan

**Resultado medible:** URLs limpias. Sin pérdida de SEO acumulado por los redirects.

---

## QUICK WIN 6: Sitemap dinámico en build.js (Día 12-13)
**Impacto: MEDIO — Automatiza la indexación de todo el contenido nuevo**

Cada vez que se publique un proyecto o se cree una página, el sitemap se actualiza solo.

### Especificaciones
- Generar sitemap.xml al final de build()
- Incluir: /, todas las páginas de servicio que existan, /proyectos/, cada proyecto individual, /contacto, /showrooms
- Priority: home 1.0, servicios 0.9, proyectos index 0.8, proyectos individuales 0.7
- lastmod: fecha del build (new Date().toISOString().split('T')[0])

**Resultado medible:** Google indexa nuevas páginas más rápido. Sin mantenimiento manual del sitemap.

---

## QUICK WIN 7: Eliminar proyecto de prueba + token (Día 1)
**Impacto: BAJO pero necesario — Limpieza**

- Eliminar "Cocina Moderna de Prueba" de Sanity (está publicado y en producción)
- Eliminar "Test Write Token" (Editor) de Sanity API tokens
- Verificar que el webhook funciona y el rebuild elimina la página

---

## Calendario resumen

| Día | Acción | Quién |
|-----|--------|-------|
| 1 | GSC: verificar sitio + enviar sitemap | Frank (DNS) + Claude (guía) |
| 1 | GBP: optimizar perfiles de ambas sucursales | Frank (fotos + reseñas) |
| 1 | Eliminar proyecto de prueba + token en Sanity | Claude |
| 3-10 | Crear /cocinas-integrales-monterrey | Claude (HTML) + Frank (revisión) |
| 3-14 | Publicar 5 proyectos en Sanity | Frank (fotos + datos) + Claude (contenido) |
| 10-12 | Migrar /portafolio/ → /proyectos/ | Claude |
| 12-13 | Sitemap dinámico en build.js | Claude |
| 14 | Verificar todo en producción | Claude + Frank |
| 21-30 | Revisar GSC: impresiones, indexación, queries | Ambos |

---

## Qué NO hacer en estos 30 días

1. **No crear páginas de zona todavía** — necesitamos proyectos en esas zonas primero
2. **No crear blog** — hay cosas con mayor ROI antes
3. **No tocar Sanity schema** — los 5 proyectos nuevos caben en el schema actual
4. **No crear páginas de materiales ni estilos** — Fase 2
5. **No reescribir la home** — funciona, es deuda técnica pero no urgente

---

## Cómo saber si vamos por buen camino (KPIs a 30 días)

| Métrica | Meta a 30 días | Herramienta |
|---------|---------------|-------------|
| Páginas indexadas en Google | 10+ (vs 5 actuales) | GSC → Cobertura |
| Impresiones "cocinas integrales monterrey" | Primeras impresiones visibles | GSC → Rendimiento |
| Proyectos publicados | 8 (3 actuales + 5 nuevos) | Sanity |
| Clics desde búsqueda orgánica | Baseline establecido | GSC |
| Clics WhatsApp desde nueva money page | > 0 | GA4 eventos |
| Reseñas en Google Business Profile | 10+ con 4.8+ | GBP dashboard |
| Errores de rastreo | 0 | GSC |

---

## Qué sigue después de los quick wins (preview Fase 2)

Si en 30 días vemos:
- Páginas indexándose correctamente
- Impresiones creciendo para keywords de cocinas
- El pipeline Sanity → build → deploy funciona sin fricción

Entonces activamos:
1. /diseno-de-cocinas-monterrey (money page #2)
2. /cocinas-modernas-monterrey (money page #3)
3. /zonas/cocinas-integrales-san-pedro (primera geo-landing, con proyectos de San Pedro ya publicados)
4. Extensión del schema de Sanity (agregar materials[], style, zone como referencias)
5. /blog/cuanto-cuesta-cocina-integral-monterrey (artículo de costos)

---

## Elementos del doc de GPT que incorporamos

Del análisis de la "Visión General del Activo" de GPT, estos elementos se integran al plan:

1. **Money pages vs Support pages** — La clasificación guía la prioridad: cocinas-integrales-monterrey es money page #1, los proyectos son support pages que la alimentan.

2. **CTAs diferenciados por contexto:**
   - Money page: "Cotiza tu cocina integral gratis por WhatsApp"
   - Proyecto: "Quiero algo similar para mi espacio"
   - Showroom: "Agenda tu visita"
   - Material: "Quiero evaluar opciones con un asesor"

3. **Checklist de calidad para proyectos** — Integrado arriba como "Criterios de selección" para los 5 proyectos nuevos.

4. **Google Business Profile** — Agregado como Quick Win 2. GPT lo menciona y nuestro doc original no lo cubría. Es SEO local inmediato sin crear páginas.

5. **Riesgo de canibalización** — Para estos quick wins no aplica (solo creamos 1 money page). Será relevante en Fase 2 cuando haya /cocinas-integrales-monterrey + /cocinas-modernas-monterrey + /cocinas-a-medida-monterrey. La solución: cada una tiene keyword, intención y promesa distintas (ya definidas en el doc de estrategia).

6. **Flujo de producción de contenido:**
   - Definir prioridad (✅ hecho en este plan)
   - Crear brief (✅ especificaciones SEO en doc de estrategia)
   - Preparar inputs visuales (Frank: fotos)
   - Generar draft (Claude)
   - Revisar tono/negocio (Frank)
   - Publicar (Sanity o HTML directo)
   - Medir rendimiento (GSC + GA4)

7. **Métricas por tipo de página** — Integrado en la tabla de KPIs a 30 días.

8. **Estrategia visual SEO:**
   - Nombres de archivo descriptivos: cocina-moderna-san-pedro-cuarzo-blanco.webp (no IMG_4532.jpg)
   - Alt text con keyword + contexto: "Cocina integral moderna con isla de cuarzo blanco en San Pedro Garza García"
   - Fotos reales, nunca stock
   - Mínimo 6 por proyecto, ideal 8-12
