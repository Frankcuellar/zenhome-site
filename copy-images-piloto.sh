#!/bin/bash
# copy-images-piloto.sh — Copia los thumbnails JPG con nombres limpios listos para SEO
# Origen: /Users/frankcuellar/Documents/1. Business/1. ZenHome/visor-thumbs/{pid}/{base}.jpg
# Destino: /Users/frankcuellar/Downloads/zenhome-site/cocinas-integrales-{zona}/img/{nombre-limpio}.jpg
# Uso: bash "/Users/frankcuellar/Downloads/zenhome-site/copy-images-piloto.sh"

set -u

SRC="/Users/frankcuellar/Documents/1. Business/1. ZenHome/visor-thumbs"
GPE_DIR="/Users/frankcuellar/Downloads/zenhome-site/cocinas-integrales-guadalupe/img"
APO_DIR="/Users/frankcuellar/Downloads/zenhome-site/cocinas-integrales-apodaca/img"

mkdir -p "$GPE_DIR" "$APO_DIR"

# Función auxiliar: copia archivo si existe, reporta si no
copy_img() {
  local src_file="$1"
  local dst_file="$2"
  local desc="$3"

  if [ -f "$src_file" ]; then
    cp "$src_file" "$dst_file"
    echo "  ✓ $desc"
  else
    echo "  ✗ $desc — origen no encontrado: $src_file"
  fi
}

echo "🖼  Copiando imágenes de los pilotos..."
echo ""

# ===== GUADALUPE =====
echo "📍 GUADALUPE"

echo "→ Alfonso Jonathan (Parques de Guadalupe)"
copy_img "$SRC/alfonso-jonathan/IMG_4463.jpg" "$GPE_DIR/alfonso-jonathan-hero.jpg" "hero"
copy_img "$SRC/alfonso-jonathan/IMG_4460.jpg" "$GPE_DIR/alfonso-jonathan-despues-1.jpg" "despues 1"
copy_img "$SRC/alfonso-jonathan/IMG_4461.jpg" "$GPE_DIR/alfonso-jonathan-despues-2.jpg" "despues 2"
copy_img "$SRC/alfonso-jonathan/IMG_3965.jpg" "$GPE_DIR/alfonso-jonathan-antes-1.jpg" "antes 1"
copy_img "$SRC/alfonso-jonathan/69aa8eff-9f25-49ab-bdc4-2ef34e85f301.jpg" "$GPE_DIR/alfonso-jonathan-antes-2.jpg" "antes 2"
copy_img "$SRC/alfonso-jonathan/367EC75B-D86B-49B8-9C9B-C9D75FC57DF1.jpg" "$GPE_DIR/alfonso-jonathan-antes-3.jpg" "antes 3"

echo "→ Nohemí Saldaña (Misión de la Silla)"
copy_img "$SRC/nohemi-saldana/af72d54e-2b5d-4607-add3-75a1dd38f7f0.jpg" "$GPE_DIR/nohemi-saldana-hero.jpg" "hero"
copy_img "$SRC/nohemi-saldana/0f5ab38a-eda4-433d-bf1e-0777775392e1.jpg" "$GPE_DIR/nohemi-saldana-despues-1.jpg" "despues 1"
copy_img "$SRC/nohemi-saldana/57525ab5-0f6b-4b2a-a1d7-d343532d603c.jpg" "$GPE_DIR/nohemi-saldana-despues-2.jpg" "despues 2"
copy_img "$SRC/nohemi-saldana/f42377c8-c9a6-439c-b9e1-3a46068fcf75.jpg" "$GPE_DIR/nohemi-saldana-antes-1.jpg" "antes 1"

echo ""
# ===== APODACA =====
echo "📍 APODACA"

echo "→ Manuel Castillo (Encino Residencial)"
copy_img "$SRC/manuel-castillo/8ba4a908-de70-4bc7-bd37-d6645abd0343.jpg" "$APO_DIR/manuel-castillo-hero.jpg" "hero"
copy_img "$SRC/manuel-castillo/84b162ee-bece-4f71-bf37-3c0252e336c4.jpg" "$APO_DIR/manuel-castillo-despues-1.jpg" "despues 1"
copy_img "$SRC/manuel-castillo/3cc551ab-37de-4820-af15-817125490ed1.jpg" "$APO_DIR/manuel-castillo-despues-2.jpg" "despues 2"
copy_img "$SRC/manuel-castillo/a43ff2e0-99da-4c88-aa96-9debde233b94.jpg" "$APO_DIR/manuel-castillo-despues-3.jpg" "despues 3"
copy_img "$SRC/manuel-castillo/ANTES - 1.jpg" "$APO_DIR/manuel-castillo-antes-1.jpg" "antes 1"
copy_img "$SRC/manuel-castillo/ANTES - 2.jpg" "$APO_DIR/manuel-castillo-antes-2.jpg" "antes 2"

echo "→ Valeria (Cerradas Ámbar)"
copy_img "$SRC/valeria-cerradas/ANTES - 3.jpg" "$APO_DIR/valeria-hero.jpg" "hero (filename ANTES pero contenido es después)"
copy_img "$SRC/valeria-cerradas/IMG_5844.jpg" "$APO_DIR/valeria-despues-1.jpg" "despues 1"
copy_img "$SRC/valeria-cerradas/IMG_5845.jpg" "$APO_DIR/valeria-despues-2.jpg" "despues 2"
copy_img "$SRC/valeria-cerradas/ANTES - 1.jpg" "$APO_DIR/valeria-antes-1.jpg" "antes 1"
copy_img "$SRC/valeria-cerradas/ANTES - 2.jpg" "$APO_DIR/valeria-antes-2.jpg" "antes 2"

echo "→ Paloma Mtz (Fracc Platino)"
copy_img "$SRC/paloma-mtz/ad2ea6e2-ec11-40cc-b761-6c417f4c298a.jpg" "$APO_DIR/paloma-mtz-hero.jpg" "hero"
copy_img "$SRC/paloma-mtz/e3884cf1-cf78-4b05-ba50-0fe58e3d8df7.jpg" "$APO_DIR/paloma-mtz-despues-1.jpg" "despues 1"
copy_img "$SRC/paloma-mtz/IMG_7358.jpg" "$APO_DIR/paloma-mtz-antes-1.jpg" "antes 1"
copy_img "$SRC/paloma-mtz/9609a6eb-a66d-40e6-82c8-a26caf28b213.jpg" "$APO_DIR/paloma-mtz-antes-2.jpg" "antes 2"

echo "→ David Cabriales (Paraje Santa Rosa)"
copy_img "$SRC/david-cabriales/5a87acdb-9237-4d55-a433-70a814faffc7.jpg" "$APO_DIR/david-cabriales-hero.jpg" "hero"
copy_img "$SRC/david-cabriales/3132695e-9d29-4097-a803-d7adf3822310.jpg" "$APO_DIR/david-cabriales-despues-1.jpg" "despues 1"
copy_img "$SRC/david-cabriales/86c8b350-f01e-4ac4-bd51-34da631bdb5b.jpg" "$APO_DIR/david-cabriales-despues-2.jpg" "despues 2"
copy_img "$SRC/david-cabriales/IMG_5615.jpg" "$APO_DIR/david-cabriales-antes-1.jpg" "antes 1"
copy_img "$SRC/david-cabriales/IMG_5616.jpg" "$APO_DIR/david-cabriales-antes-2.jpg" "antes 2"
copy_img "$SRC/david-cabriales/IMG_5617.jpg" "$APO_DIR/david-cabriales-antes-3.jpg" "antes 3"

echo "→ Eduardo González (Paseo de los Nogales) — galería secundaria"
copy_img "$SRC/eduardo-gonzalez/c69e70ed-bf9f-4080-8975-2077704b318e.jpg" "$APO_DIR/eduardo-gonzalez-hero.jpg" "hero"

echo "→ Claudia Alvarado (Las Cruces) — galería secundaria"
copy_img "$SRC/claudia-alvarado/IMG_0738.jpg" "$APO_DIR/claudia-alvarado-hero.jpg" "hero"

echo "→ Lourdes Ramos (Valterra Residencial) — galería secundaria"
copy_img "$SRC/lourdes-ramos/f3074a56-f973-4e32-b440-3497353089a3.jpg" "$APO_DIR/lourdes-ramos-hero.jpg" "hero"

echo ""
echo "✓ Resumen final:"
echo "   Guadalupe: $(find "$GPE_DIR" -name "*.jpg" 2>/dev/null | wc -l | xargs) archivos copiados"
echo "   Apodaca:   $(find "$APO_DIR" -name "*.jpg" 2>/dev/null | wc -l | xargs) archivos copiados"
echo ""
echo "Si ves '✗ origen no encontrado' arriba, asegúrate de que generar-thumbs.sh corrió antes."
echo "Listo. Las imágenes están listas en cada carpeta /img/ para hacer commit y deploy."
