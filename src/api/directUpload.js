import { uploadService } from "./api.service";

/**
 * Big files can't go through the API on Vercel (request body limit ≈ 4.5 MB).
 * For those, the browser uploads straight to Cloudinary with a signature from the API
 * (GET /upload/signature), then only the small file info (url, public_id …) goes to the API as JSON.
 * Small files keep using the normal API upload, exactly as before.
 */
export const DIRECT_UPLOAD_BYTES = 3.5 * 1024 * 1024;

export const totalBytes = (files) => (files || []).reduce((sum, f) => sum + (f?.size || 0), 0);

// true when this group of files is too big to send through the API
export const needsDirectUpload = (files) => totalBytes(files) > DIRECT_UPLOAD_BYTES;

const extOf = (name = "") => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : null;
};

async function uploadOne(file, sign, onProgress) {
  const form = new FormData();
  // only the signed fields (timestamp + folder) may be sent, plus file and api_key
  form.append("file", file);
  form.append("api_key", sign.api_key);
  form.append("timestamp", sign.timestamp);
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  // XMLHttpRequest, so the page can show progress for big files
  const json = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sign.upload_url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {
        /* keep empty */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.public_id) resolve(body);
      else reject(new Error(body?.error?.message || `Upload មិនបានសម្រេច (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("មិនអាច upload ទៅ Cloudinary បានទេ សូមពិនិត្យអ៊ីនធឺណិត"));
    xhr.send(form);
  });

  // same shape the API saves for an uploaded file
  return {
    url: json.secure_url,
    public_id: json.public_id,
    resource_type: json.resource_type,
    format: json.format || extOf(file.name),
    bytes: json.bytes,
    original_name: file.name,
  };
}

/**
 * Upload files straight to Cloudinary. folder: "documents" | "references".
 * Returns the file info list (same order as `files`), ready to save in document_main_url / reference files.
 * onProgress(fraction 0..1) is called while uploading (all files together).
 */
export async function uploadDirect(files, folder = "documents", onProgress) {
  const list = Array.from(files || []);
  if (list.length === 0) return [];

  const res = await uploadService.signature(folder);
  const sign = res.data;
  if (!sign?.signature || !sign?.upload_url) throw new Error("មិនអាចរៀបចំការ upload បានទេ");

  const total = totalBytes(list) || 1;
  const done = new Array(list.length).fill(0);
  const report = () => onProgress && onProgress(Math.min(1, done.reduce((a, b) => a + b, 0) / total));

  const out = new Array(list.length);
  let next = 0;
  // 3 at a time
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await uploadOne(list[i], sign, (loaded) => {
        done[i] = loaded;
        report();
      });
      done[i] = list[i].size;
      report();
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, list.length) }, worker));
  return out;
}
