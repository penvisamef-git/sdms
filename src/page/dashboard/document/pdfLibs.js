// Loads pdf.js (render pages) and pdf-lib (save the signed PDF) from /public/pdfjs on demand.
// The files are copied into the project — no npm install and no CDN needed.

const BASE = `${process.env.PUBLIC_URL || ""}/pdfjs`;

let pdfjsPromise = null;
let pdfLibPromise = null;

export function loadPdfJs() {
  if (!pdfjsPromise) {
    // native ES module import, not bundled by webpack (files are named .js so every server sends a JavaScript MIME type)
    pdfjsPromise = import(/* webpackIgnore: true */ `${BASE}/pdf.min.js`).then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
      return mod;
    });
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

export function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!pdfLibPromise) {
    pdfLibPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${BASE}/pdf-lib.min.js`;
      script.async = true;
      script.onload = () => resolve(window.PDFLib);
      script.onerror = () => {
        pdfLibPromise = null;
        reject(new Error("មិនអាចផ្ទុក pdf-lib បានទេ"));
      };
      document.head.appendChild(script);
    });
  }
  return pdfLibPromise;
}
