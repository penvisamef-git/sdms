// The roles a user can have (saved as text in the user's `role` field).
// The text must match what the API accepts exactly.
export const ROLE = {
  SUPER: "អ្នកគ្រប់គ្រងប្រព័ន្ធមេ", // everything
  DOC_IN: "អ្នកគ្រប់គ្រងឯកសារចូល", // dashboard + incoming documents + my account
  DOC_OUT: "អ្នកគ្រប់គ្រងឯកសារចេញ", // dashboard + outgoing documents + my account
  DOC_BOTH: "អ្នកគ្រប់គ្រងឯកសារចេញ/ចូល", // dashboard + incoming + outgoing + my account
};

export const USER_ROLES = [ROLE.SUPER, ROLE.DOC_IN, ROLE.DOC_OUT, ROLE.DOC_BOTH];

export const ROLE_OPTIONS = USER_ROLES.map((r) => ({ value: r, label: r }));

// the API may return a plain string, or (older data) an object with a name
export const roleText = (role) => (typeof role === "string" ? role : role?.name || "");
