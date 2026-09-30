import { loadPdfLib } from "./pdfLibs";
import { paintAnnotations } from "./annotationUtils";

const canvasToBytes = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error("មិនអាចបង្កើតរូបភាពបានទេ"));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });

/**
 * Burn the annotations into a copy of the PDF.
 * Each annotated page gets a transparent PNG overlay (drawn on a canvas, so Khmer text keeps the
 * browser's fonts); the original pages stay untouched underneath.
 *
 *   pdfDoc      - pdf.js document
 *   pages       - [{ w, h }] size of every page as displayed (after rotation)
 *   annotations - see annotationUtils.js
 * → Blob (application/pdf)
 */
export async function exportSignedPdf({ pdfDoc, pages, annotations, fontFamily, onProgress }) {
  const { PDFDocument, degrees } = await loadPdfLib();
  const bytes = await pdfDoc.getData();
  const out = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const outPages = out.getPages();

  const byPage = new Map();
  annotations.forEach((a) => {
    if (!byPage.has(a.page)) byPage.set(a.page, []);
    byPage.get(a.page).push(a);
  });

  let done = 0;
  for (const [pageNumber, list] of byPage) {
    const meta = pages[pageNumber - 1];
    const page = outPages[pageNumber - 1];
    if (!meta || !page) continue;

    // overlay resolution: ~3x the page size in points, capped
    const scale = Math.min(3, 3200 / meta.w);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(meta.w * scale);
    canvas.height = Math.round(meta.h * scale);
    const ctx = canvas.getContext("2d");
    paintAnnotations(ctx, canvas.width, canvas.height, list, fontFamily);

    const png = await out.embedPng(await canvasToBytes(canvas));

    // place the overlay so it is upright on rotated pages too
    const { width: w, height: h } = page.getSize();
    const angle = (((page.getRotation().angle % 360) + 360) % 360) | 0;
    const sideways = angle === 90 || angle === 270;
    const origin = { 0: [0, 0], 90: [w, 0], 180: [w, h], 270: [0, h] }[angle] || [0, 0];
    page.drawImage(png, {
      x: origin[0],
      y: origin[1],
      width: sideways ? h : w,
      height: sideways ? w : h,
      rotate: degrees(angle),
    });

    done += 1;
    if (onProgress) onProgress(done, byPage.size);
  }

  const saved = await out.save();
  return new Blob([saved], { type: "application/pdf" });
}
