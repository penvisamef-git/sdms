import React, { useMemo } from "react";
import SearchSelect from "./SearchSelect";
import OrgTreeSelect from "./OrgTreeSelect";
import { idOf, personName } from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";

// Users that can receive: everybody by default, or only the users of the chosen receiving offices
const isInReceivingOffice = (u, officeIds) => !officeIds || officeIds.includes(idOf(u.office_id));

/**
 * "អ្នកទទួល" card — pick ONE receiving unit / directorate / department / office (tree select)
 * and/or ONE receiving user. Same behaviour as the create page.
 *
 * props:
 *   orgTree, users            - options (unitService.tree() / userService.all())
 *   myOfficeId, myUserId      - can't send to yourself
 *   toOffice / onOfficeChange - { id, offices: [officeId, ...] } | null
 *   toUserId / onUserChange   - user id | ""
 *   disabled, children (footer, e.g. the send button)
 */
function ReceiverCard({
  orgTree,
  users,
  myOfficeId,
  myUserId,
  toOffice,
  onOfficeChange,
  toUserId,
  onUserChange,
  disabled,
  children,
}) {
  const userOptions = useMemo(
    () =>
      users
        .filter((u) => u._id !== myUserId && u.status !== false && !u.is_super_admin)
        .filter((u) => isInReceivingOffice(u, toOffice?.offices))
        .map((u) => ({
          value: u._id,
          label: personName(u),
          sub: [u.office_id?.name, u.email].filter(Boolean).join(" · "),
        })),
    [users, myUserId, toOffice],
  );

  // Choosing another receiving office drops a chosen user who isn't in it
  const pickOffice = (node) => {
    const next = node ? { id: node._id, offices: node._leaves } : null;
    onOfficeChange(next);
    if (toUserId) {
      const chosen = users.find((u) => u._id === toUserId);
      if (chosen && !isInReceivingOffice(chosen, next?.offices)) onUserChange("");
    }
  };

  return (
    <section className="md-card doc-section">
      <h3 className="doc-section-heading">អ្នកទទួល</h3>
      <div className="md-hint">
        ជ្រើសរើសអង្គភាពទទួល និង/ឬអ្នកប្រើប្រាស់ទទួលម្នាក់ (អាចរំលងបាន ហើយផ្ញើនៅពេលក្រោយ)។
        ការជ្រើសរើសអង្គភាព អគ្គនាយកដ្ឋាន ឬនាយកដ្ឋាន នឹងផ្ញើទៅគ្រប់ការិយាល័យខាងក្រោម។
      </div>

      <div className="doc-grid doc-grid-2">
        <div className="md-field">
          <label>អង្គភាពទទួល</label>
          <OrgTreeSelect
            single
            tree={orgTree}
            excludeId={myOfficeId}
            value={toOffice?.id || ""}
            onPick={pickOffice}
            placeholder="-- ជ្រើសរើសអង្គភាព អគ្គនាយកដ្ឋាន នាយកដ្ឋាន ឬការិយាល័យ --"
            disabled={disabled}
          />
        </div>

        <div className="md-field">
          <label>អ្នកប្រើប្រាស់ទទួល</label>
          <SearchSelect
            options={userOptions}
            value={toUserId}
            onChange={onUserChange}
            placeholder="-- ជ្រើសរើសអ្នកប្រើប្រាស់ --"
            disabled={disabled}
          />
        </div>
      </div>

      {children}
    </section>
  );
}

export default ReceiverCard;
