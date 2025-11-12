"use client";

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FREQUENCY_TYPES, CHART_TYPES } from "@/constants";
import AppIcon from "@/components/icon";

export default function AddRoleSheetPage() {
  const { toggleProgressBar, toast, setPageTitle } = useAppLayoutContext();
  const { locale } = useI18n();
  const router = useRouter();
  const { role_id, rs_id } = useParams();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState([
    {
      objective: "",
      roles: [
        {
          role: "",
          kpis: [
            {
              kpi: "",
              measure: "",
              operation_definition: "",
              frequency_of_measurement: "",
              vcs: "",
            },
          ],
        },
      ],
    },
  ]);

  /* Load role sheet data if rs_id exists (Edit Mode) */
  useEffect(() => {

    if (!role_id) return;
    if (!rs_id) {
      setLoading(false); // Add Mode — skip loading
      return;
    }

    const fetchData = async () => {

      toggleProgressBar(true);
      setPageTitle('Role Sheet Edit');
      
      try {
        const res = await fetch(`/api/v1/roles/${role_id}/rs/${rs_id}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load role sheet");
        }

        setForm(json.data?.roleSheet || []);
      } catch (error) {
        console.error("Error loading role sheet:", error);
        toast("error", "Failed to load role sheet");
      } finally {
        toggleProgressBar(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [locale, role_id, rs_id]);

  /* Helpers */
  const handleObjectiveChange = (e, objIdx) => {
    const updated = [...form];
    updated[objIdx].objective = e.target.value;
    setForm(updated);
  };

  const handleRoleChange = (e, objIdx, roleIdx) => {
    const updated = [...form];
    updated[objIdx].roles[roleIdx][e.target.name] = e.target.value;
    setForm(updated);
  };

  const handleKpiChange = (e, objIdx, roleIdx, kpiIdx) => {
    const updated = [...form];
    updated[objIdx].roles[roleIdx].kpis[kpiIdx][e.target.name] = e.target.value;
    setForm(updated);
  };

  const handleAddRole = (objIdx) => {
    const updated = [...form];
    updated[objIdx].roles.push({
      role: "",
      kpis: [
        {
          kpi: "",
          measure: "",
          operation_definition: "",
          frequency_of_measurement: "",
          vcs: "",
        },
      ],
    });
    setForm(updated);
  };

  const handleAddKpi = (objIdx, roleIdx) => {
    const updated = [...form];
    updated[objIdx].roles[roleIdx].kpis.push({
      kpi: "",
      measure: "",
      operation_definition: "",
      frequency_of_measurement: "",
      vcs: "",
    });
    setForm(updated);
  };

  const handleRemoveRole = (objIdx, roleIdx) => {
    const updated = [...form];
    updated[objIdx].roles.splice(roleIdx, 1);
    setForm(updated);
  };

  const handleRemoveKpi = (objIdx, roleIdx, kpiIdx) => {
    const updated = [...form];
    updated[objIdx].roles[roleIdx].kpis.splice(kpiIdx, 1);
    setForm(updated);
  };

  /* Validation */
  const areRolesUnique = () => {
    for (const obj of form) {
      const roleNames = obj.roles.map(r => r.role.trim().toLowerCase());
      const uniqueRoles = new Set(roleNames);
      if (uniqueRoles.size !== roleNames.length) return false;
    }
    return true;
  };

  const areKpisUnique = () => {
    for (const obj of form) {
      for (const role of obj.roles) {
        const kpiNames = role.kpis.map(k => k.kpi.trim().toLowerCase());
        const uniqueKpis = new Set(kpiNames);
        if (uniqueKpis.size !== kpiNames.length) return false;
      }
    }
    return true;
  };

  /* Submit (Add or Update) */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!areRolesUnique()) {
      toast("error", "Roles within an objective must be unique!");
      return;
    }

    if (!areKpisUnique()) {
      toast("error", "KPIs within a role must be unique!");
      return;
    }

    toggleProgressBar(true);

    try {
      const url = rs_id
        ? `/api/v1/roles/${role_id}/rs/${rs_id}/edit`
        : `/api/v1/roles/${role_id}/rs/add`;

      const method = rs_id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save role sheet");
      }

      toast("success", rs_id ? "Role Sheet Updated!" : "Role Sheet Added!");
      router.push(`/roles/${role_id}`);
    } catch (error) {
      console.error("Error saving role sheet:", error);
      toast("error", "Failed to save role sheet");
    } finally {
      toggleProgressBar(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedPage>
        <div className="text-center py-5">Loading Role Sheet...</div>
      </AuthenticatedPage>
    );
  }

  /* Page */
  return (
    <AuthenticatedPage>
      <div className="my-4">
        <form onSubmit={handleSubmit}>
          {form.map((objective, objIdx) => (
            <div key={objIdx} className="card mb-4 border-success shadow-sm">
              <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="my-1">
                  {rs_id ? "Edit Objective" : "Add Objective"}
                </h5>
                <button
                  type="button"
                  className="btn btn-light btn-sm ms-auto"
                  onClick={() => router.push(`/roles/${role_id}`)}
                >
                  Back
                </button>
              </div>

              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Objective</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={objective.objective}
                    onChange={(e) => handleObjectiveChange(e, objIdx)}
                    required
                  />
                </div>

                <h6 className="mt-4 mb-3 text-primary border-bottom pb-2">
                  Roles for this Objective
                </h6>

                {objective.roles.map((role, roleIdx) => (
                  <div key={roleIdx} className="card mb-3 border-primary shadow-sm">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-primary">
                        Role ({roleIdx + 1})
                      </span>
                      {objective.roles.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger ms-auto"
                          onClick={() => handleRemoveRole(objIdx, roleIdx)}
                        >
                          Delete Role
                        </button>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <input
                          className="form-control"
                          name="role"
                          value={role.role}
                          onChange={(e) => handleRoleChange(e, objIdx, roleIdx)}
                          required
                        />
                      </div>

                      <h6 className="mt-4 mb-3 text-info border-bottom pb-2">
                        KPIs for this Role
                      </h6>

                      {role.kpis.map((kpi, kpiIdx) => (
                        <div key={kpiIdx} className="p-3 mb-3 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="fw-bold text-info">
                              KPI ({kpiIdx + 1})
                            </span>
                            {role.kpis.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveKpi(objIdx, roleIdx, kpiIdx)}
                              >
                                Delete KPI
                              </button>
                            )}
                          </div>

                          <div className="row">
                            <div className="col-md-3 mb-3">
                              <label className="form-label">KPI</label>
                              <input
                                className="form-control"
                                name="kpi"
                                value={kpi.kpi}
                                onChange={(e) =>
                                  handleKpiChange(e, objIdx, roleIdx, kpiIdx)
                                }
                                required
                              />
                            </div>

                            <div className="col-md-2 mb-3">
                              <label className="form-label">Measure</label>
                              <input
                                className="form-control"
                                name="measure"
                                value={kpi.measure}
                                onChange={(e) =>
                                  handleKpiChange(e, objIdx, roleIdx, kpiIdx)
                                }
                              />
                            </div>

                            <div className="col-md-3 mb-3">
                              <label className="form-label">
                                Operational Definition
                              </label>
                              <textarea
                                className="form-control"
                                rows="1"
                                name="operation_definition"
                                value={kpi.operation_definition}
                                onChange={(e) =>
                                  handleKpiChange(e, objIdx, roleIdx, kpiIdx)
                                }
                              />
                            </div>

                            <div className="col-md-2 mb-3">
                              <label className="form-label">Freq</label>
                              <select
                                className="form-select"
                                name="frequency_of_measurement"
                                value={kpi.frequency_of_measurement}
                                onChange={(e) =>
                                  handleKpiChange(e, objIdx, roleIdx, kpiIdx)
                                }
                              >
                                <option value="">-</option>
                                {Object.values(FREQUENCY_TYPES).map((f) => (
                                  <option key={f} value={f}>
                                    {f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="col-md-2 mb-3">
                              <label className="form-label">Chart Type</label>
                              <select
                                className="form-select"
                                name="vcs"
                                value={kpi.vcs}
                                onChange={(e) =>
                                  handleKpiChange(e, objIdx, roleIdx, kpiIdx)
                                }
                              >
                                <option value="">-</option>
                                {Object.values(CHART_TYPES).map((c) => (
                                  <option key={c} value={c}>
                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="btn btn-sm btn-info mt-2"
                        onClick={() => handleAddKpi(objIdx, roleIdx)}
                      >
                        <AppIcon ic="plus" /> Add New KPI
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  onClick={() => handleAddRole(objIdx)}
                >
                  <AppIcon ic="plus" /> Add New Role
                </button>
              </div>
            </div>
          ))}

          <hr />
          <div className="text-end">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() => router.push(`/roles/${role_id}`)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              {rs_id ? "Update Role Sheet" : "Save Role Sheet"}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedPage>
  );
}
