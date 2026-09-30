import React, { useCallback, useEffect, useMemo, useState } from "react";
import MasterDataPage from "./MasterDataPage";
import OrgTree from "./OrgTree";
import ListTreeTabs from "./ListTreeTabs";
import { generalDirectorateService, unitService } from "../../../api/api.service";

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ (ខ្មែរ)" },
  { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)" },
  {
    key: "unit_id",
    label: "អង្គភាព",
    render: (row) => row.unit_id?.name || "-",
  },
];

const SEARCH_KEYS = ["name", "name_in_eng"];

// General directorate → Department → Office → Users
const fetchTree = () => generalDirectorateService.tree({ include_users: true });

function GeneralDirectorateComponent() {
  const [units, setUnits] = useState([]);

  // Units are the parent of a general directorate
  const loadUnits = useCallback(async () => {
    try {
      const res = await unitService.all();
      setUnits(res.data || []);
    } catch {
      setUnits([]);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const fields = useMemo(
    () => [
      { key: "name", label: "ឈ្មោះ (ខ្មែរ)", required: true, placeholder: "បញ្ចូលឈ្មោះអគ្គនាយកដ្ឋាន" },
      { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)", placeholder: "General directorate name in English" },
      {
        key: "unit_id",
        label: "អង្គភាព",
        type: "select",
        required: true,
        placeholder: "-- ជ្រើសរើសអង្គភាព --",
        options: units.map((u) => ({ value: u._id, label: u.name })),
      },
      { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
    ],
    [units],
  );

  return (
    <ListTreeTabs
      list={
        <MasterDataPage
          title="អគ្គនាយកដ្ឋាន"
          service={generalDirectorateService}
          fields={fields}
          columns={COLUMNS}
          searchKeys={SEARCH_KEYS}
        />
      }
      tree={<OrgTree fetchTree={fetchTree} />}
    />
  );
}

export default GeneralDirectorateComponent;
