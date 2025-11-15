'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import Link from "next/link";

/* Dynamically import chart */
const Tree = dynamic(() => import("react-organizational-chart").then((mod) => mod.Tree), { ssr: false });
const TreeNode = dynamic(() => import("react-organizational-chart").then((mod) => mod.TreeNode), { ssr: false });

/* -------------------- Styles -------------------- */
const cardContainerStyle = {
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  border: "1px solid #d3e0f0",
  padding: "20px",
  marginTop: "12px",
  width: "100%",
  maxWidth: "100%",
  maxHeight: "660px",
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
};

const orgNodeCardStyle = {
  minWidth: "280px",
  maxWidth: "320px",
  borderRadius: "13px",
  background: "#fff",
  boxShadow: "0 3px 16px rgba(47,64,84,0.08)",
  overflow: "hidden",
  margin: "8px",
  padding: "0px",
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const orgNodeHeaderStyle = {
  background: "#215fb1ff",
  color: "#fff",
  padding: "14px 16px 12px 16px",
  fontWeight: 600,
  fontSize: "17px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const orgNodeBodyStyle = {
  padding: "22px 0px 16px 0px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const orgNodeFooterStyle = {
  borderTop: "1px solid #eee",
  padding: "10px 0 0 0",
  display: "flex",
  justifyContent: "center",
  gap: "25px",
};

/* -------------------- Role Card -------------------- */
function OrgChartCard({
  role,
  onToggle,
  expanded,
  hasChildren,
  onAddUser,
  onAddRole,
  onEditRole,
  onDeleteRole,
  onEditUser,
  onDeleteUser,
}) {
  const userList = role.users ? role.users.split(",").map((u) => u.trim()).filter(Boolean) : [];

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <div style={{ ...orgNodeCardStyle, transform: expanded ? "scale(1.03)" : "scale(1)", zIndex: 1 }}>
        {/* Header */}
        <div
          style={orgNodeHeaderStyle}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(role.id);
          }}
        >
          <span
            style={{
              flexGrow: 1,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {role.name}
          </span>

          <span
            style={{ fontSize: 20, cursor: "pointer" }}
            title="Add Sub Role"
            onClick={(e) => {
              e.stopPropagation();
              onAddRole(role.id);
            }}
          >
            <AppIcon ic="plus" />
          </span>

          <Link style={{ marginLeft: "10px", color: "#fff" }} href={`/roles/${role.id}`} onClick={() => toggleProgressBar(true)}>
            <AppIcon ic="chart-bar" />
          </Link>
        </div>

        {/* Body */}
        <div style={{ ...orgNodeBodyStyle, flexDirection: "column" }}>
          {userList.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "6px",
                marginBottom: "10px",
                padding: "0 10px",
              }}
            >
              {userList.map((user, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f1f5ff",
                  color: "#215fb1",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  margin: "4px",
                  transition: "all 0.25s ease",
                  overflow: "hidden",
                  maxWidth: "150px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.paddingRight = "38px";
                  const icons = e.currentTarget.querySelector(".user-actions");
                  if (icons) icons.style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.paddingRight = "12px";
                  const icons = e.currentTarget.querySelector(".user-actions");
                  if (icons) icons.style.opacity = 0;
                }}
              >
                <span>{user}</span>

                {/* Hover icons (hidden until hover) */}
                <div
                  className="user-actions"
                  style={{
                    position: "absolute",
                    right: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {/* Edit icon */}
                  <span
                    style={{ cursor: "pointer", color: "#2980b9" }}
                    title="Edit User"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/users/${user}`); // ✅ opens user page, no modal
                    }}
                  >
                    <AppIcon ic="pencil" />
                  </span>

                  {/* Delete icon */}
                  <span
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", marginRight: "-7px", color: "#e74c3c" }}
                    title="Delete User"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteUser(role.id, user);
                    }}
                  >
                    <AppIcon ic="delete" />
                  </span>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <span style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>No users assigned</span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddUser(role.id);
            }}
            style={{
              background: "#19e9a4",
              border: 0,
              color: "#fff",
              borderRadius: "24px",
              padding: "8px 28px",
              fontWeight: 500,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            + Add User
          </button>
        </div>

        {/* Footer */}
        <div style={orgNodeFooterStyle}>
          <span style={{ cursor: "pointer", color: "#2980b9" }} title="Edit Role" onClick={(e) => { e.stopPropagation(); onEditRole(role); }}>
            <AppIcon ic="pencil" />
          </span>
          <span style={{ cursor: "pointer", color: "#e74c3c" }} title="Delete Role" onClick={(e) => { e.stopPropagation(); onDeleteRole(role); }}>
            <AppIcon ic="delete" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Build Tree -------------------- */
function buildTree(roles) {
  const map = {};
  const roots = [];
  roles.forEach((r) => (map[r.id] = { ...r, children: [] }));
  roles.forEach((r) => {
    if (r.reporting_to && map[r.reporting_to]) map[r.reporting_to].children.push(map[r.id]);
    else roots.push(map[r.id]);
  });
  return roots;
}

/* -------------------- Recursive Render -------------------- */
function renderOrgNode(node, expandedNodes, toggleExpand, actions) {
  const expanded = !!expandedNodes[node.id];
  const hasChildren = node.children.length > 0;

  return (
    <TreeNode
      key={node.id}
      label={
        <OrgChartCard
          role={node}
          expanded={expanded}
          hasChildren={hasChildren}
          onToggle={toggleExpand}
          {...actions}
        />
      }
    >
      {expanded && node.children.map((child) => renderOrgNode(child, expandedNodes, toggleExpand, actions))}
    </TreeNode>
  );
}

/* -------------------- Upload Chart Widget -------------------- */
function UploadOrgChartWidget({ onChange, errorMessage }) {
  return (
    <div className="row mt-3 text-left">
      <div className="col-12">
        <form>
          <div className="mb-3 flex-column align-items-start">
            <label className="form-label">Organization Chart Template</label>
            <a href="/templates/organization_chart_template.csv" className="btn btn-link p-0" download>
              <AppIcon ic="download" /> Click here to download
            </a>
          </div>
          <div>
            <label className="form-label">Select a CSV File</label>
            <input type="file" name="file" className="form-control mb-3" accept=".csv" autoFocus onChange={onChange} />
            {errorMessage && (
              <div
                className="alert alert-danger mt-3"
                role="alert"
                style={{ whiteSpace: "pre-wrap" }}   // 👈 IMPORTANT
              >
                <strong className="mt-3">Upload Error:</strong>
                <br />
                <dl dangerouslySetInnerHTML={{ __html: errorMessage }}></dl>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export default function OrganizationChartPage() {
  const { setPageTitle, toggleProgressBar, setAppBarMenuItems, modal, closeModal, toast } =
    useAppLayoutContext();
  const { t } = useI18n?.() ?? {};
  const [roles, setRoles] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loading, setLoading] = useState(true);

  const toggleExpand = (id) => setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    setPageTitle(t ? t("organizationChart") : "Organization Chart");
    toggleProgressBar(false);
    setAppBarMenuItems([{ icon: "upload", tooltip: "Upload Organization Chart", className: "text-primary", onClick: showUploadDialog }]);
  }, []);

  useEffect(() => { loadRoles(); }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/organizationChart/list");
      const data = await res.json();
      if (data.success) setRoles(data.data.roles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

/* -------------------- Unified Modal -------------------- */
function openFormModal(type, payload = {}) {
  let title = "";
  if (type === "addRole") title = "Add Role";
  else if (type === "editRole") title = "Edit Role";
  else if (type === "addUser") title = "Add User";
  else if (type === "editUser") title = "Edit User";
  else if (type === "deleteRole") title = `Delete Role "${payload.name}"?`;
  else if (type === "deleteUser") title = `Delete User "${payload.user}"?`;

  /* -------------------- DELETE MODAL -------------------- */
  if (type.startsWith("delete")) {
    const isRole = type === "deleteRole";
    const nameLabel = isRole ? payload.name || "(unnamed)" : payload.user || "(unknown)";
    const idField = payload.role_id || payload.id;

    modal({
      title: `Delete ${isRole ? "Role" : "User"} "${nameLabel}"?`,
      body: <p>Are you sure you want to delete this {isRole ? "role" : "user"}?</p>,
      okBtn: {
        label: "Delete",
        variant: "danger",
        onClick: async () => {
          const finalPayload = {
            type,
            role_id: idField,
            user: payload.user || null,
          };

          const res = await fetch(`/api/v1/organizationChart/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          });

          const result = await res.json();
          toast(result.success ? "success" : "error", result.message);
          closeModal();
          if (result.success) loadRoles();
        },
      },
      cancelBtn: { label: "Cancel" },
    });
    return;
  }

  /* -------------------- ADD USER MODAL -------------------- */
  if (type === "addUser") {
    let selectedUser = "";
    let users = [];

    // Load user list dynamically inside try/catch
    (async () => {
      try {
        const res = await fetch("/api/v1/users/list");
        const data = await res.json();
        const list = data?.data?.users ?? data?.data ?? [];

        if (Array.isArray(list)) {
          users = list;
          const select = document.getElementById("userDropdown");
          if (select) {
            select.innerHTML = `<option value="">-- Select User --</option>`;
            users.forEach((u) => {
              const opt = document.createElement("option");
              opt.value = u.id;
              opt.textContent = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "(Unnamed)";
              select.appendChild(opt);
            });
          }
        }
      } catch (err) {
        console.error("❌ Failed to load users:", err);
        toast("error", "Failed to load user list.");
      }
    })();

    modal({
      title: "Add User",
      body: (
        <div>
          <label className="form-label">User Name</label>
          <select
            id="userDropdown"
            className="form-control mt-2"
            defaultValue=""
            onChange={(e) => (selectedUser = e.target.value)}
          >
            <option value="">Select users...</option>
          </select>

          <div className="text-center mt-3">
            <Link
              href={`/admin/user?role_id=${payload.role_id || ""}`}
              className="btn btn-outline-primary btn-sm"
              onClick={() => closeModal()}
            >
              + Create New User
            </Link>
          </div>
        </div>
      ),
      okBtn: {
        label: "Assign User",
        onClick: async () => {
          try {
            if (!selectedUser) {
              toast("error", "Please select a user");
              return;
            }

            const finalPayload = {
              type: "addUser",
              role_id: payload.role_id,
              user_id: selectedUser,
            };

            const res = await fetch(`/api/v1/organizationChart/save`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(finalPayload),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
              toast("error", result.message || "Failed to assign user");
              return; // ⛔ keep modal open
            }

            toast("success", result.message || "User assigned successfully");
            closeModal();
            loadRoles();
          } catch (err) {
            console.error("Error assigning user:", err);
            toast("error", "Unexpected error while assigning user.");
          }
        },
      },
      cancelBtn: { label: "Cancel" },
    });

    return;
  }

  /* -------------------- ADD / EDIT ROLE -------------------- */
  let name = payload.name || "";
  modal({
    title,
    body: (
      <div>
        <label>Name</label>
        <input
          type="text"
          className="form-control mt-2"
          defaultValue={name}
          onChange={(e) => (name = e.target.value)}
          placeholder="Enter name"
        />
      </div>
    ),
    okBtn: {
      label: "Save",
      onClick: async () => {
        if (!name.trim()) return toast("error", "Enter a name");

        const finalPayload = {
          type,
          name,
          role_id: payload.role_id || payload.id || null,
          user_id: payload.user_id || null,
          reporting_to: payload.reporting_to || null,
        };

        const res = await fetch(`/api/v1/organizationChart/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload),
        });

        const result = await res.json();
        toast(result.success ? "success" : "error", result.message);
        closeModal();
        if (result.success) loadRoles();
      },
    },
    cancelBtn: { label: "Cancel" },
  });
}

/* -------------------- Formatter: build HTML for validation errors -------------------- */
function formatUploadErrors(data) {
  if (!data || !data.errors) return "";

  const { roleNotAssigned = [], missingUsers = [], duplicateUsers = [] } = data.errors;
  let html = "";

  // Role Not Assigned
  if (roleNotAssigned.length > 0) {
    html += `<h6 style="margin-top:15px; font-weight:600;">Role Not assigned User</h6><dl style="margin-top:8px;">`;
    for (const r of roleNotAssigned) {
      html += `<dt style="margin-top:8px;font-weight:600;">Row: ${r.row}</dt><dd style="margin-left:12px;">User Not Assigned for Role '${escapeHtml(r.role)}'</dd>`;
    }
    html += `</dl><br>`;
    // divider if next section exists
    if (missingUsers.length || duplicateUsers.length) {
      html += `<hr style="margin:12px 0;border-top:1px solid #8e8e8e;">`;
    }
  }

  // Missing Users
  if (missingUsers.length > 0) {
    html += `<h6 style="margin-top:15px; font-weight:600;">User(s) not found in users table:</h6><dl style="margin-top:8px;">`;
    for (const m of missingUsers) {
      html += `<dt style="margin-top:8px;font-weight:600;">Row: ${m.row}</dt><dd style="margin-left:12px;">User '${escapeHtml(m.user)}' does not exist</dd>`;
    }
    html += `</dl><br>`;

    // divider if next group exists
    if (duplicateUsers.length) {
      html += `<hr style="margin:12px 0;border-top:1px solid #8e8e8e;">`;
    }
  }

  // Duplicate Users
  if (duplicateUsers.length > 0) {
      html += `<h6 style="margin-top:15px; font-weight:600;">User assigned to multiple roles:</h6><dl style="margin-top:8px;">`;
      for (const d of duplicateUsers) {
        html += `<dt style="margin-top:8px;font-weight:600;">Row: ${d.row}</dt>`;
        html += `<dd style="margin-left:12px;">User: ${escapeHtml(d.user)}</dd>`;
        const escapedRoles = d.roles.map(role => escapeHtml(role));
        const rolesString = escapedRoles.join(" , <br>"); 
        html += `<dd style="margin-left:12px;">Role(s): ${rolesString}</dd>`;
      }
      html += `</dl><br>`;
  }

  return html;
}

/* small helper to escape html so user names don't break output */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}


/* -------------------- showUploadDialog (modal handler) -------------------- */
const showUploadDialog = () => {
  let selectedFile = null;
  let errorMessage = "";

  const openDialog = () => {
    modal({
      title: "Upload Organization Chart",
      body: (
        <UploadOrgChartWidget
          errorMessage={errorMessage}
          onChange={(e) => {
            try {
              const file = e.target.files?.[0];
              if (!file) {
                toast("error", "Please select a file.");
                return;
              }
              if (!file.name.toLowerCase().endsWith(".csv")) {
                toast("error", "Please select a valid CSV file (.csv)");
                return;
              }
              selectedFile = file;
            } catch (err) {
              console.error("File selection error:", err);
              toast("error", "Something went wrong while selecting the file.");
            }
          }}
        />
      ),
      okBtn: {
        label: "Upload",
        onClick: async () => {
          try {
            if (!selectedFile) {
              toast("error", "Please select a CSV file first.");
              return;
            }

            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch("/api/v1/organizationChart/upload", {
              method: "POST",
              body: formData,
            });

            const result = await res.json();

            // Validation errors returned as structured payload: result.data.type === "validation_errors"
            if (!res.ok && result?.data?.type === "validation_errors") {
              errorMessage = formatUploadErrors(result.data);
              openDialog(); // reopen modal with error details
              toast("error", "Validation errors found in CSV. See modal.");
              return;
            }

            // generic error fallback
            if (!res.ok || !result.success) {
              const msg = result?.message || "Upload failed.";
              errorMessage = escapeHtml(msg).replace(/\n/g, "<br>");
              openDialog();
              toast("error", msg);
              return;
            }

            // success
            toast("success", result.message || "Upload successful.");
            closeModal();
            loadRoles();
          } catch (err) {
            console.error("Upload exception:", err);
            toast("error", "Server error while uploading file.");
          }
        },
      },
      cancelBtn: { label: "Close" },
    });
  };

  openDialog();
};

  /* -------------------- Render -------------------- */
  if (loading)
    return (
      <AuthenticatedPage>
        <div>Loading roles...</div>
      </AuthenticatedPage>
    );

  const tree = buildTree(roles);

  return (
    <AuthenticatedPage>
      <div style={cardContainerStyle}>
        <div style={{ width: "100%", minHeight: "500px", minWidth: "max-content", padding: "16px 6px", display: "flex", justifyContent: "center" }}>
          {tree.length > 0 && (
            <Tree lineWidth="2px" lineColor="#444" lineBorderRadius="0px" label={<div style={{ fontSize: 20, color: "#5807d1", fontWeight: 700 }}>Organization Chart</div>}>
              {tree.map((node) =>
                renderOrgNode(node, expandedNodes, toggleExpand, {
                  onAddUser: (id) => openFormModal("addUser", { role_id: id }),
                  onEditUser: (id, user) => openFormModal("editUser", { role_id: id, user }),
                  onDeleteUser: (id, user) => openFormModal("deleteUser", { role_id: id, user }),
                  onAddRole: (id) => openFormModal("addRole", { reporting_to: id }),
                  onEditRole: (role) => openFormModal("editRole", role),
                  onDeleteRole: (role) => openFormModal("deleteRole", role),
                })
              )}
            </Tree>
          )}
        </div>
      </div>
    </AuthenticatedPage>
  );
}
