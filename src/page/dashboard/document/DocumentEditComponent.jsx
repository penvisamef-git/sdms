import React from "react";
import { useParams } from "react-router-dom";
import DocumentForm from "./DocumentForm";

// ឯកសារចេញ — edit page (/document/out/edit/:id). Same layout as create; locked unless status is "new".
function DocumentEditComponent() {
  const { id } = useParams();
  // key → the form reloads when the id in the URL changes
  return <DocumentForm key={id} documentId={id} />;
}

export default DocumentEditComponent;
