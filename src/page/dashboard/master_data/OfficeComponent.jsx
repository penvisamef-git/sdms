import React, { useCallback, useEffect, useMemo, useState } from "react";
import MasterDataPage from "./MasterDataPage";
import OrgTree from "./OrgTree";
import ListTreeTabs from "./ListTreeTabs";
import { officeService, departmentService, userService } from "../../../api/api.service";

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ (ខ្មែរ)" },
  { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)" },
  {
    key: "department_id",
    label: "នាយកដ្ឋាន",
    render: (row) => row.department_id?.name || "-",
  },
  {
    key: "general_directorate",
    label: "អគ្គនាយកដ្ឋាន",
    render: (row) => row.department_id?.general_directorate_id?.name || "-",
  },
];

const SEARCH_KEYS = ["name", "name_in_eng"];

// Office → Users. sdms_api has no office-tree route, so build it from the office and user lists.
async function fetchTree() {
  const [officeRes, userRes] = await Promise.all([
    officeService.all(),
    userService.all().catch(() => ({ data: [] })),
  ]);

  const usersByOffice = {};
  (userRes.data || [])
    .filter((u) => !u.is_super_admin)
    .forEach((u) => {
      const officeId = u.office_id?._id || u.office_id;
      if (!officeId) return;
      (usersByOffice[officeId] = usersByOffice[officeId] || []).push({
        ...u,
        level: "user",
        children: [],
      });
    });

  return {
    data: (officeRes.data || []).map((office) => ({
      ...office,
      level: "office",
      children: usersByOffice[office._id] || [],
    })),
  };
}

function OfficeComponent() {
  const [departments, setDepartments] = useState([]);

  // Departments are the parent of an office
  const loadDepartments = useCallback(async () => {
    try {
      const res = await departmentService.all();
      setDepartments(res.data || []);
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const fields = useMemo(
    () => [
      { key: "name", label: "ឈ្មោះ (ខ្មែរ)", required: true, placeholder: "បញ្ចូលឈ្មោះការិយាល័យ" },
      { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)", placeholder: "Office name in English" },
      {
        key: "department_id",
        label: "នាយកដ្ឋាន",
        type: "select",
        required: true,
        placeholder: "-- ជ្រើសរើសនាយកដ្ឋាន --",
        options: departments.map((d) => ({
          value: d._id,
          label: d.general_directorate_id?.name
            ? `${d.name} (${d.general_directorate_id.name})`
            : d.name,
        })),
      },
      { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
    ],
    [departments],
  );

  return (
    <ListTreeTabs
      list={
        <MasterDataPage
          title="ការិយាល័យ"
          service={officeService}
          fields={fields}
          columns={COLUMNS}
          searchKeys={SEARCH_KEYS}
        />
      }
      tree={<OrgTree fetchTree={fetchTree} />}
    />
  );
}

export default OfficeComponent;
