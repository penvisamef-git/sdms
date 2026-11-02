import React from "react";
import DocumentListPage from "./DocumentListPage";

// Big Boss · ឯកសារចូល — documents waiting for him (to receive, check, sign and return)
function BossInboxComponent() {
  return <DocumentListPage box="in" boss="inbox" />;
}

export default BossInboxComponent;
