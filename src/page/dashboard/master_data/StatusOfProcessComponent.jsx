import React from "react";
import MasterDataPage from "./MasterDataPage";
import { statusOfProcessService } from "../../../api/api.service";

const FIELDS = [
  { key: "name", label: "ឈ្មោះ", required: true, placeholder: "បញ្ចូលឈ្មោះស្ថានភាពដំណើរការ" },
  { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
];

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ" },
  { key: "note", label: "កំណត់សម្គាល់" },
];

const SEARCH_KEYS = ["name"];

function StatusOfProcessComponent() {
  return (
    <MasterDataPage
      title="ស្ថានភាពដំណើរការ"
      service={statusOfProcessService}
      fields={FIELDS}
      columns={COLUMNS}
      searchKeys={SEARCH_KEYS}
    />
  );
}

export default StatusOfProcessComponent;
