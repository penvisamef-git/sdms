import apiClient from "./api.client";

/**
 * Standard CRUD endpoints exposed by sdms_api for a resource.
 *
 * List params (see sdms_api/src/util/mongo_db/mongoDB_Queries.js):
 *   page, limit, sort, order ("asc" | "desc"), q, q_key, q_id, q_key_id, includeDeleted
 */
function createResource(route) {
  return {
    list: (params) => apiClient.get(`/${route}`, params),
    all: (params) => apiClient.get(`/${route}-all`, params),
    get: (id) => apiClient.get(`/${route}/${id}`),
    create: (data) => apiClient.post(`/${route}`, data),
    update: (id, data) => apiClient.put(`/${route}/${id}`, data),
    remove: (id) => apiClient.delete(`/${route}/${id}`),
    restore: (id) => apiClient.put(`/${route}/restore/${id}`),
  };
}

// ================= Auth =================
export const authService = {
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }, { skipAuth: true }),
  testLoggedIn: () => apiClient.get("/auth/test-logged-in"),
  // end THIS device's session on the server (the token stops working)
  logout: () => apiClient.post("/auth/logout", {}),
};

// ================= User =================
export const userService = {
  ...createResource("users"),
  // my own password: { old_password, new_password }
  changePassword: (data) => apiClient.put("/users/change-password", data),
  resetPassword: (id, data) => apiClient.put(`/users/reset-password/${id}`, data),
  profile: () => apiClient.get("/users-app/profile"),
};

export const groupUserService = createResource("group-user-permission");

// ================= Home (summary dashboard) =================
// params: { month: "2026-09", date_field: "created_date" | "date_in" | "date_registration_document" | "date_sign" | "date_sent" }
export const homeService = {
  // everything the home screen needs in one call
  summary: (params) => apiClient.get("/home/summary", params),
  // paged list of documents with status new. params: month · date_field · box (all|out|in) · all_time · page · limit
  newDocuments: (params) => apiClient.get("/home/new-documents", params),
  // me + office → department → general directorate → unit
  myOffice: () => apiClient.get("/home/my-office"),
};

// ================= Upload (Cloudinary, through the API) =================
// upload(FormData): files (many) + folder ("documents" | "references") → { data: [{ url, public_id, ... }] }
export const uploadService = {
  upload: (formData) => apiClient.post("/upload", formData),
  // signature for uploading big files straight to Cloudinary (see directUpload.js)
  signature: (folder) => apiClient.get("/upload/signature", { folder }),
};

// ================= Document =================
// list params: { box: "in" | "out" | "all", status, recipient_status, page, limit, q, q_key, ... }
export const documentService = {
  ...createResource("document"),
  // set the receivers of a document: { send_to_office_id: [...], send_to_user_id: [...] }
  // (only the creator office; adds receivers and creates a step-1 transfer for each new one)
  send: (id, data) => apiClient.post(`/document/${id}/send`, data),
  // timeline + tree + summary of every hop of the document
  tracking: (id) => apiClient.get(`/document/${id}/tracking`),
  // replace one saved file with a signed copy — FormData: file + public_id (of the file being replaced)
  //   or, for big files already uploaded to Cloudinary, JSON: { public_id, file: { url, public_id, resource_type, format, bytes } }
  // (creator office, or a receiver who holds the document and has not passed it on yet)
  replaceFile: (id, formData) => apiClient.put(`/document/${id}/file`, formData),
};

// One transfer = one hop of a document to one receiver (office or user)
//   status: pending → received → forwarded | returned | done
export const documentTransferService = {
  // transfers addressed to me / my office. params: { status (comma list), page, limit, order }
  inbox: (params) => apiClient.get("/document-transfer/inbox", params),
  // transfers sent by my office (scope "me" = only mine). params: { scope, status, page, limit }
  sent: (params) => apiClient.get("/document-transfer/sent", params),
  receive: (tid) => apiClient.put(`/document-transfer/${tid}/receive`, {}),
  // data: { send_to_office_id: [], send_to_user_id: [], note, status_of_process_id }
  forward: (tid, data) => apiClient.post(`/document-transfer/${tid}/forward`, data),
  // roll back one step. data: { note, status_of_process_id }
  returnBack: (tid, data) => apiClient.post(`/document-transfer/${tid}/return`, data),
  // finish at my office. data: { note }
  done: (tid, data) => apiClient.put(`/document-transfer/${tid}/done`, data || {}),
};

// ================= Session & Log =================
export const sessionService = {
  list: (params) => apiClient.get("/session", params),
  remove: (id) => apiClient.delete(`/session/${id}`),
};

export const activityLogService = {
  list: (params) => apiClient.get("/activity_log", params),
};

export const activityLogCategoryService = {
  list: (params) => apiClient.get("/activity_log/category", params),
  all: (params) => apiClient.get("/activity_log/category-all", params),
};

// ================= Master Data =================
export const documentTypeService = createResource("master-data/type-of-document");

export const frameworkService = {
  ...createResource("master-data/framework"),
  tree: (params) => apiClient.get("/master-data/framework-tree", params),
};

export const unitService = {
  ...createResource("master-data/unit"),
  // Unit → General Directorate → Department → Office (optional params: { unit_id })
  tree: (params) => apiClient.get("/master-data/unit-tree", params),
};
export const generalDirectorateService = {
  ...createResource("master-data/general-directorate"),
  // General directorate → Department → Office (params: { unit_id, general_directorate_id, include_users })
  tree: (params) => apiClient.get("/master-data/general-directorate-tree", params),
};
export const departmentService = {
  ...createResource("master-data/department"),
  // Department → Office (params: { general_directorate_id, department_id, include_users })
  tree: (params) => apiClient.get("/master-data/department-tree", params),
};
export const officeService = createResource("master-data/office");
export const statusOfProcessService = createResource("master-data/status-of-process");

