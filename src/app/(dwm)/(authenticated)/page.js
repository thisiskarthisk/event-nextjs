'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAppLayoutContext } from "@/components/appLayout";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import Link from "next/link";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { HttpClient } from "@/helper/http";

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
  minHeight: "790px",
  maxHeight: "790px",
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
  cursor: "pointer",
};

const orgNodeFooterStyle = {
  borderTop: "1px solid #eee",
  padding: "10px 0 0 0",
  display: "flex",
  justifyContent: "center",
  gap: "25px",
};

/* -------------------- Role Card -------------------- */
const OrgChartCard = ({
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
}) => {
  const userList = role.users || [];
  const validUsers = userList.filter(u => u && u.id);

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <div style={{ ...orgNodeCardStyle, transform: expanded ? "scale(1.03)" : "scale(1)", zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            ...orgNodeHeaderStyle,
            cursor: hasChildren ? "pointer" : "default",
            position: "relative",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(role.id);
          }}
        >
          {/* LEFT CHEVRON */}
          {hasChildren && (
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 20,
                opacity: 0.9,
              }}
            >
              {expanded ? (
                <AppIcon ic="chevron-down"  size="large" className="text-white" />
              ) : (
                <AppIcon ic="chevron-right" size="large" className="text-white" />
              )}
            </span>
          )}

          {/* CENTERED ROLE NAME */}
          <span
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: "70%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: 17,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            {role.name}
          </span>

          {/* RIGHT ACTIONS */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <span
              title="Add Sub Role"
              onClick={(e) => {
                e.stopPropagation();
                onAddRole(role.id);
              }}
            >
              <AppIcon ic="plus-circle" size="large" />
            </span>

            <Link
              href={`/roles/${encodeURLParam(role.id)}`}
              onClick={(e) => e.stopPropagation()}
            >
              <AppIcon ic="chart-bar" size="large" className="text-white" />
            </Link>
          </div>
        </div>


        <div className="my-2">
          <a href="#" className="btn btn-primary btn-rounded" onClick={(e) => {
              e.stopPropagation();
              onAddUser(role.id);
            }}>
            <AppIcon ic="plus" />&nbsp;Add a User
          </a>
        </div>

        {/* Body */}
        <div className="list-group text-left mb-3 mx-1">
          { 
            validUsers.length > 0 ? (
              validUsers.map((user) => (
                <div key={user.id} className="list-group-item flex-space-between flex-valign-center">
                  <span className="flex-column">
                    <span className="badge bg-secondary rounded-pill mb-2"><AppIcon ic="badge-account" />&nbsp;{ user.employee_id }</span>
                    <span>{ user.first_name } {user.last_name || '' }</span>
                  </span>

                  <span className="">
                    <Link href={`/roles/${encodeURLParam(role.id)}/responses/${encodeURLParam(user.id)}`} className="text-success">
                      <AppIcon ic="speedometer" size="large" />
                    </Link>
                    &nbsp;|&nbsp;
                    <Link href={`/admin/users/edit/${encodeURLParam(user.id)}?from=${encodeURLParam('/')}`} className="text-primary">
                      <AppIcon ic="pencil" size="large" />
                    </Link>
                    &nbsp;|&nbsp;
                    <a href="#" className="text-danger fs-large" onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUser(role.id, user);
                      }}>
                      <AppIcon ic="delete" />
                    </a>
                  </span>
                </div>
              ))
            ) : (
              <div className="list-group-item text-secondary text-center">No users assigned</div>
            )
          }
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
const buildTree = (roles) => {
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
const renderOrgNode = (node, expandedNodes, toggleExpand, actions) => {
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
const UploadOrgChartWidget = ({ onChange, errorMessage }) => {
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
  const { setPageTitle, toggleProgressBar, setRHSAppBarMenuItems, setLHSAppBarMenuItems, modal, closeModal, toast , confirm } =
    useAppLayoutContext();
  const { t } = useI18n?.() ?? {};
  const [roles, setRoles] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const toggleExpand = (id) => setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (status == 'authenticated') {
      setPageTitle(t ? t("organizationChart") : "Organization Chart");
      toggleProgressBar(false);
      setRHSAppBarMenuItems([{ icon: "upload", tooltip: "Upload Organization Chart", className: "text-primary", onClick: showUploadDialog }]);

      loadRoles(true);

      const action = decodeURLParam(searchParams.get('action'));
      const temp_role_id = decodeURLParam(searchParams.get('role'));
      const temp_user_id = decodeURLParam(searchParams.get('user'));

      if (action == 'assign' && temp_role_id) {
        console.log('temp_user_id:',temp_user_id);

        openFormModal("addUser", { role_id: temp_role_id, user_id: (temp_user_id || null) });
      }
    }
  }, [status]);

  const buildInitialExpandedMap = (nodes, level = 0, map = {}) => {
    nodes.forEach((n) => {
      if (level < 1) {
        map[n.id] = true; // Expand this node
        if (n.children && n.children.length > 0) {
          buildInitialExpandedMap(n.children, level + 1, map);
        }
      }
    });
    return map;
  };

  // Helper to build the expansion map based on depth or full expansion
  const buildExpandedMap = (nodes, level = 0, map = {}, expandAll = false) => {
    nodes.forEach((n) => {
      if (expandAll) {
        // For Expand All: Add every single node ID to the map
        map[n.id] = true;
        if (n.children && n.children.length > 0) {
          buildExpandedMap(n.children, level + 1, map, true);
        }
      } else {
        // For Collapse: Only expand Level 0 (to show level 1 children)
        if (level < 1) { 
          map[n.id] = true;
          if (n.children && n.children.length > 0) {
            buildExpandedMap(n.children, level + 1, map, false);
          }
        }
      }
    });
    return map;
  };

  const handleExpandAll = () => {
    const allIds = {};
    roles.forEach(r => allIds[r.id] = true);
    setExpandedNodes(allIds);
  };

  const handleCollapseToDefault = () => {
    const treeData = buildTree(roles);
    const defaultMap = buildInitialExpandedMap(treeData);
    setExpandedNodes(defaultMap);
  };

  const isAllExpanded = () => {
    const treeData = buildTree(roles);
    const allMap = buildExpandedMap(treeData, 0, {}, true);
    return Object.keys(allMap).length > 0 &&
          Object.keys(allMap).every(id => expandedNodes[id]);
  };

  
  
  const loadRoles = async (isInitial = false) => {
    toggleProgressBar(true);
    try {
      HttpClient({
        url: "/organizationChart/list",
        method: "GET",
      })
        .then((data) => {
          if (data.success) {
            const rolesList = data.data.roles || [];
            const treeData = buildTree(rolesList);

            setRoles(rolesList);

            if (isInitial) {
              const initialExpanded = buildInitialExpandedMap(treeData);
              setExpandedNodes(initialExpanded);
            }
          }

        })
        .catch((e) => {
          console.error("Error loading roles:", e);
          toast("error", "Failed to load organization chart roles.");
        })
        .finally(() => {
          toggleProgressBar(false);
        });
    } catch (e) {
      console.error(e);
      toggleProgressBar(false);
    }
  }

  /* -------------------- Unified Modal -------------------- */
  const openFormModal = (type, payload = {}) => {
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
      const nameLabel = isRole 
        ? payload.name || "(unnamed)" 
        : payload.user?.first_name + " " + payload.user?.last_name;

      const roleId = payload.role_id || payload.id;
      const userId = payload.user?.id || null;

      confirm({
        title: `Delete ${isRole ? "Role" : "User"} "${nameLabel}"?`,
        message: <p>Are you sure you want to delete this {isRole ? "role" : "user"}?</p>,
        positiveBtnOnClick: async () => {
          const finalPayload = {
            type,
            role_id: roleId,
            user_id: userId,
          };

          toggleProgressBar(true);

          try {
            const res = await HttpClient({
              url: "/organizationChart/delete",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify(finalPayload),
            });
            if (!res.success) {
              toast("error", res.message || "Delete failed.");
              toggleProgressBar(false);
              closeModal();
              return;
            }
            toast("success", res.message || "Deleted successfully.");
            toggleProgressBar(false);
            closeModal();
            if (res.success) loadRoles();
          } catch (err) {
            console.error("Delete error:", err);
            toggleProgressBar(false);
            closeModal();
            if (res.success) loadRoles();
            if(err.response && err.response.data && err.response.data.message){
                let message = err.response?.data?.message;
                toast("error", message);
            }
            toast("error", message || "Error occurred when trying to delete.");}
        }
      });

      return;
    }
    

    /* -------------------- ADD USER MODAL -------------------- */
    if (type === "addUser") {
      let selectedUser = payload.user_id || null;
      let users = [];

      (async () => {
        HttpClient({
          url: "/organizationChart/list",
          method: "GET",
        })
          .then((res) => {
            const list = res?.data?.users ?? res?.data ?? [];

            if (Array.isArray(list)) {
              users = list;
              const select = document.getElementById("userDropdown");
              if (select) {
                select.innerHTML = `<option value="">-- Select User --</option>`;
                users.forEach((u) => {
                  const opt = document.createElement("option");
                  opt.value = u.id;
                  opt.textContent = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "(Unnamed)";

                  if (selectedUser == u.id) {
                    opt.selected = true;
                  }

                  select.appendChild(opt);
                });
              }
            }
          })
          .catch((err) => {
            console.error("Failed to load users:", err);
            toast("error", "Failed to load user list.");
          });
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
                href={`/admin/users/add?from=${encodeURLParam(`/?action=${encodeURLParam('assign')}&role=${encodeURLParam(payload.role_id)}`)}`}
                className="btn btn-outline-primary btn-sm"
                onClick={() => closeModal()}
              >
                <AppIcon ic="plus" />&nbsp;Create New User
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

              HttpClient({
                url: '/organizationChart/save',
                method: "POST",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(finalPayload),
              }).then(res => {
                  console.log('res:',res);
                  if (!res.success) {
                    toast('error', res.message || 'Failed to assign the User.');
                    return; // ⛔ keep modal open
                  }
                  toast('success', res.message || 'The User has been assigned successfully.');
                  closeModal();
                  loadRoles();
              }).catch(err => {
                  let message = 'Error occurred when trying to assign the User.';
                  if (err.response && err.response.data && err.response.data.message) {
                    message = err.response.data.message;
                  }
                  toast('error', message);
              });
            } catch (error) {
              console.error("Assign user error:", error);
              toast('error', 'Error occurred when trying to assign the User.');
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
            placeholder="Enter name for the role"
            autoFocus={true}
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

          try {
            HttpClient({
              url: '/organizationChart/save',
              method: "POST",
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify(finalPayload),
            }).then(res => {
                console.log('res:',res);
                if (!res.success) {
                  toast('error', res.message || 'Failed to save the Role.');
                  return; // ⛔ keep modal open
                }
                toast('success', res.message || 'The Role has been saved successfully.');
                closeModal();
                loadRoles();
            }).catch(err => {
                let message = 'Error occurred when trying to save the Role.';
                if (err.response && err.response.data && err.response.data.message) {
                  message = err.response.data.message;
                }
                toast('error', message);
            });
          } catch (error) {
            toast('error', 'Error occurred when trying to save the Role.');
          }
        },
      },
      cancelBtn: { label: "Cancel" },
    });
  }

  /* -------------------- Formatter: build HTML for validation errors -------------------- */
  const formatUploadErrors = (data) => {
    if (!data || !data.errors) return "";

    const { 
      roleNotAssigned = [], 
      missingUsers = [], 
      duplicateUsers = [], 
      duplicateRoles = [] // 👈 NEW ERROR TYPE
    } = data.errors;
    
    let html = "";
    let needsDivider = false;

    // 1. Duplicate Roles (Active Role Check / Internal CSV Duplicates)
    if (duplicateRoles.length > 0) {
      html += `<h6 style="margin-top:15px; font-weight:600; color:#e74c3c;">Duplicate Role Error:</h6><dl style="margin-top:8px;">`;

      for (const r of duplicateRoles) {
        const reasonText = r.reason.includes("database")
          ? `Role '${escapeHtml(r.role)}' already active in Roles Table`
          : `Role '${escapeHtml(r.role)}' duplicated within CSV File`;
        html += `<dt style="margin-top:8px;font-weight:600;">Row: ${r.row} </dt><dd style="margin-left:12px;">${reasonText}</dd>`;

      }

      html += `</dl><br>`;
      needsDivider = true;
    }
    
    // Divider if needed
    if (needsDivider && (roleNotAssigned.length || missingUsers.length || duplicateUsers.length)) {
      html += `<hr style="margin:12px 0;border-top:1px solid #8e8e8e;">`;
      needsDivider = false;
    }

    // 2. Role Not Assigned (No user assigned to the role in CSV)
    if (roleNotAssigned.length > 0) {
      html += `<h6 style="margin-top:15px; font-weight:600;color:#e74c3c;">Role Not assigned User:</h6><dl style="margin-top:8px;">`;
      for (const r of roleNotAssigned) {
        html += `<dt style="margin-top:8px;font-weight:600;">Row: ${r.row}</dt><dd style="margin-left:12px;">User Not Assigned for Role '${escapeHtml(r.role)}'</dd>`;
      }
      html += `</dl><br>`;
      needsDivider = true;
    }

    // Divider if needed
    if (needsDivider && (missingUsers.length || duplicateUsers.length)) {
      html += `<hr style="margin:12px 0;border-top:1px solid #8e8e8e;">`;
      needsDivider = false;
    }

    // 3. Missing Users
    if (missingUsers.length > 0) {
      html += `<h6 style="margin-top:15px; font-weight:600;color:#e74c3c;">User(s) not found in users table:</h6><dl style="margin-top:8px;">`;
      for (const m of missingUsers) {
        html += `<dt style="margin-top:8px;font-weight:600;">Row: ${m.row}</dt><dd style="margin-left:12px;">User '${escapeHtml(m.user)}' does not exist</dd>`;
      }
      html += `</dl><br>`;
      needsDivider = true;
    }

    // Divider if needed
    if (needsDivider && duplicateUsers.length) {
      html += `<hr style="margin:12px 0;border-top:1px solid #8e8e8e;">`;
      needsDivider = false;
    }

    // 4. Duplicate Users (User assigned to multiple roles in CSV)
    if (duplicateUsers.length > 0) {
        html += `<h6 style="margin-top:15px; font-weight:600;color:#e74c3c;">User assigned to multiple roles (within CSV):</h6><dl style="margin-top:8px;">`;
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
  const escapeHtml = (str) =>{
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

              // use HttpClient helper
              HttpClient({
                url: "/organizationChart/upload",
                method: "POST",
                data: formData,
              }).then((result) => {
                // NORMALIZE where validation payload might sit (some servers use `data`, others use `errors`)
                const validationWrapper = result?.errors || result?.data || null;

                // Validation errors returned as structured payload: wrapper.type === "validation_errors"
                if (validationWrapper?.type === "validation_errors") {
                  // validationWrapper has shape: { type: "validation_errors", errors: { roleNotAssigned:[], missingUsers:[], ... } }
                  errorMessage = formatUploadErrors(validationWrapper); // formatUploadErrors expects the wrapper (it looks at wrapper.errors)
                  openDialog(); // reopen modal with error details
                  toast("error", "Validation errors found in CSV. See modal.");
                  return;
                }
                

                // generic error fallback
                if (!result.success) {
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
              })
              .catch((err) => {
                console.error("Upload exception:", err);
                toast("error", "Server error while uploading file.");
              });
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

  const tree = buildTree(roles);

  return (
    <>
      <div className="d-flex justify-content-end gap-3 mb-4">
        <button
          className="btn btn-outline-primary"
          onClick={() => {
            if (isAllExpanded()) handleCollapseToDefault();
            else handleExpandAll();
          }}
        >
          <AppIcon ic={isAllExpanded() ? "minus-circle-multiple" : "plus-circle-multiple"} />
          &nbsp;
          {isAllExpanded() ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div style={cardContainerStyle}>

        <div style={{ width: "100%", minHeight: "500px", minWidth: "max-content", padding: "16px 6px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {
            tree.length > 0 ? (
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
            ) : (
              <div className="text-placeholder">
                <h5>No data found</h5>

                <p className="mt-3">Upload an organization chart or add a role to get started.</p>

                <p className="mt-3 flex-inline-column">
                  <button className="btn btn-primary" onClick={showUploadDialog}><AppIcon ic="upload"/>&nbsp;Upload</button>
                  <button className="btn btn-info mt-3" onClick={(id) => openFormModal("addRole", { reporting_to: null })}><AppIcon ic="account-plus"/>&nbsp;Add a Role</button>
                </p>
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}