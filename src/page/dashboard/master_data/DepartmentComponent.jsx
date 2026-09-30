import React, { useCallback, useEffect, useMemo, useState } from "react";
import MasterDataPage from "./MasterDataPage";
import OrgTree from "./OrgTree";
import ListTreeTabs from "./ListTreeTabs";
import { departmentService, generalDirectorateService } from "../../../api/api.service";

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ (ខ្មែរ)" },
  { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)" },
  {
    key: "general_directorate_id",
    label: "អគ្គនាយកដ្ឋាន",
    render: (row) => row.general_directorate_id?.name || "-",
  },
  {
    key: "unit",
    label: "អង្គភាព",
    render: (row) => row.general_directorate_id?.unit_id?.name || "-",
  },
];

const SEARCH_KEYS = ["name", "name_in_eng"];

// Department → Office → Users
const fetchTree = () => departmentService.tree({ include_users: true });

function DepartmentComponent() {
  const [directorates, setDirectorates] = useState([]);

  // General directorates are the parent of a department
  const loadDirectorates = useCallback(async () => {
    try {
      const res = await generalDirectorateService.all();
      setDirectorates(res.data || []);
    } catch {
      setDirectorates([]);
    }
  }, []);

  useEffect(() => {
    loadDirectorates();
  }, [loadDirectorates]);

  const fields = useMemo(
    () => [
      { key: "name", label: "ឈ្មោះ (ខ្មែរ)", required: true, placeholder: "បញ្ចូលឈ្មោះនាយកដ្ឋាន" },
      { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)", placeholder: "Department name in English" },
      {
        key: "general_directorate_id",
        label: "អគ្គនាយកដ្ឋាន",
        type: "select",
        required: true,
        placeholder: "-- ជ្រើសរើសអគ្គនាយកដ្ឋាន --",
        options: directorates.map((d) => ({
          value: d._id,
          label: d.unit_id?.name ? `${d.name} (${d.unit_id.name})` : d.name,
        })),
      },
      { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
    ],
    [directorates],
  );

  return (
    <ListTreeTabs
      list={
        <MasterDataPage
          title="នាយកដ្ឋាន"
          service={departmentService}
          fields={fields}
          columns={COLUMNS}
          searchKeys={SEARCH_KEYS}
        />
      }
      tree={<OrgTree fetchTree={fetchTree} />}
    />
  );
}

export default DepartmentComponent;
