#!/usr/bin/env node
/**
 * Medidor de bundles cliente — baseline de performance (Fase 0 del plan de optimización).
 *
 * Uso:
 *   npm run build            # genera .next con Turbopack
 *   npm run analyze:routes   # este script
 *
 * Por qué existe: en Next 16 + Turbopack, `next build` no imprime "First Load JS"
 * por ruta y @next/bundle-analyzer no es compatible con Turbopack. Este script mide
 * el tamaño gzip real de los chunks cliente emitidos en .next/static/chunks y atribuye
 * los más pesados a las librerías que los dominan, para priorizar code-splitting y dedup.
 *
 * Reejecutar después de cada cambio de performance para comparar contra el baseline.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHUNKS_DIR = join(ROOT, '.next', 'static', 'chunks');
const BUILD_MANIFEST = join(ROOT, '.next', 'build-manifest.json');

// Huellas de librerías pesadas conocidas, para atribuir el peso de cada chunk.
const FINGERPRINTS = [
  '@react-pdf', 'react-pdf', 'exceljs', 'xlsx', 'jspdf', 'recharts',
  'framer-motion', 'moment', 'swiper', 'embla', 'react-modal', 'react-day-picker',
  'react-hook-form', '@tanstack', 'zod', 'lucide', 'html-to-image', 'react-qr-code',
];

const KB = (n) => `${(n / 1024).toFixed(1)} KB`;

function gzipSize(absPath) {
  return gzipSync(readFileSync(absPath)).length;
}

function attribute(absPath) {
  let text;
  try {
    text = readFileSync(absPath, 'latin1');
  } catch {
    return [];
  }
  const hits = [];
  for (const fp of FINGERPRINTS) {
    const count = text.split(fp).length - 1;
    if (count > 0) hits.push({ fp, count });
  }
  return hits.sort((a, b) => b.count - a.count).slice(0, 3);
}

function main() {
  const jsFiles = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.js'));
  const sized = jsFiles
    .map((f) => ({ file: f, gz: gzipSize(join(CHUNKS_DIR, f)) }))
    .sort((a, b) => b.gz - a.gz);

  const manifest = JSON.parse(readFileSync(BUILD_MANIFEST, 'utf8'));
  const rootMain = (manifest.rootMainFiles || []).map((p) => p.replace('static/chunks/', ''));
  const baseline = rootMain.reduce((sum, f) => sum + gzipSize(join(CHUNKS_DIR, f)), 0);
  const total = sized.reduce((sum, c) => sum + c.gz, 0);

  console.log('\n=== BASELINE DE BUNDLES CLIENTE (gzip) ===\n');
  console.log(`Chunks cliente totales : ${jsFiles.length} archivos, ${KB(total)} gzip`);
  console.log(`Baseline compartido    : ${KB(baseline)} gzip  (lo que paga TODA navegación)\n`);

  console.log('TOP 15 chunks por peso gzip:');
  console.log('  '.padEnd(4) + 'gzip'.padStart(10) + '   contenido dominante');
  for (const c of sized.slice(0, 15)) {
    const isBase = rootMain.includes(c.file) ? ' [baseline]' : '';
    const attr = attribute(join(CHUNKS_DIR, c.file));
    const label = attr.length ? attr.map((a) => `${a.fp}`).join(', ') : '(app/framework)';
    console.log('  ' + KB(c.gz).padStart(10) + `   ${label}${isBase}`);
  }
  console.log('');
}

main();
