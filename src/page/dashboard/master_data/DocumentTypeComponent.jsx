import React from "react";
import MasterDataPage from "./MasterDataPage";
import { documentTypeService } from "../../../api/api.service";

const FIELDS = [
  { key: "name", label: "ឈ្មោះ", required: true, placeholder: "បញ្ចូលឈ្មោះប្រភេទឯកសារ" },
  { key: "code", label: "កូដ", placeholder: "បញ្ចូលកូដ" },
  { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
];

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ" },
  { key: "code", label: "កូដ" },
  { key: "note", label: "កំណត់សម្គាល់" },
];

const SEARCH_KEYS = ["name", "code"];

function DocumentTypeComponent() {
  return (
    <MasterDataPage
      title="ប្រភេទឯកសារ"
      service={documentTypeService}
      fields={FIELDS}
      columns={COLUMNS}
      searchKeys={SEARCH_KEYS}
    />
  );
}

export default DocumentTypeComponent;
