import React, { useCallback, useEffect, useMemo, useState } from "react";
import MasterDataPage from "./MasterDataPage";
import { frameworkService } from "../../../api/api.service";

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ" },
  { key: "code", label: "កូដ" },
  {
    key: "framework_parent_id",
    label: "ក្របខណ្ឌមេ",
    render: (row) => row.framework_parent_id?.name || "-",
  },
];

const SEARCH_KEYS = ["name", "code"];

function FrameworkComponent() {
  const [parents, setParents] = useState([]);

  // All frameworks, used as options for the parent select
  const loadParents = useCallback(async () => {
    try {
      const res = await frameworkService.all();
      setParents(res.data || []);
    } catch {
      setParents([]);
    }
  }, []);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  const fields = useMemo(
    () => [
      { key: "name", label: "ឈ្មោះ", required: true, placeholder: "បញ្ចូលឈ្មោះក្របខណ្ឌ" },
      { key: "code", label: "កូដ", placeholder: "បញ្ចូលកូដ" },
      {
        key: "framework_parent_id",
        label: "ក្របខណ្ឌមេ",
        type: "select",
        placeholder: "-- គ្មាន (ក្របខណ្ឌកំពូល) --",
        options: parents.map((p) => ({
          value: p._id,
          label: p.code ? `${p.code} - ${p.name}` : p.name,
        })),
      },
      { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
    ],
    [parents],
  );

  return (
    <MasterDataPage
      title="ក្របខណ្ឌ"
      service={frameworkService}
      fields={fields}
      columns={COLUMNS}
      searchKeys={SEARCH_KEYS}
      onSaved={loadParents}
    />
  );
}

export default FrameworkComponent;
