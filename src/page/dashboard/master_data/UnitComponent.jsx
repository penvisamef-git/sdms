import React from "react";
import MasterDataPage from "./MasterDataPage";
import OrgTree from "./OrgTree";
import ListTreeTabs from "./ListTreeTabs";
import { unitService } from "../../../api/api.service";

const FIELDS = [
  { key: "name", label: "ឈ្មោះ (ខ្មែរ)", required: true, placeholder: "បញ្ចូលឈ្មោះអង្គភាព" },
  { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)", placeholder: "Unit name in English" },
  { key: "location", label: "ទីតាំង", placeholder: "បញ្ចូលទីតាំង" },
  { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
];

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ (ខ្មែរ)" },
  { key: "name_in_eng", label: "ឈ្មោះ (អង់គ្លេស)" },
  { key: "location", label: "ទីតាំង" },
];

const SEARCH_KEYS = ["name", "name_in_eng", "location"];

// Unit → General Directorate → Department → Office → Users
const fetchTree = () => unitService.tree({ include_users: true });

function UnitComponent() {
  return (
    <ListTreeTabs
      list={
        <MasterDataPage
          title="អង្គភាព"
          service={unitService}
          fields={FIELDS}
          columns={COLUMNS}
          searchKeys={SEARCH_KEYS}
        />
      }
      tree={<OrgTree fetchTree={fetchTree} />}
    />
  );
}

export default UnitComponent;
