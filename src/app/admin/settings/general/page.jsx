'use client';

// Mock imports for demonstration
import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { useI18n } from "@/components/i18nProvider";

import { useEffect, useState } from "react";
import { HttpClient } from "@/helper/http";

export default function GeneralSettings() {
  // Mock context hooks
  const { setPageTitle, toggleProgressBar , toast } = useAppLayoutContext();
  const { t } = useI18n(); 

  const [isEditing, setEditing] = useState(false);

  // --- Combined field state for API (employee_id, rca_id, capa_id) ---
  const [form, setForm] = useState({
    employee_id: "", // Stored as "PREFIX,DIGITS"
    rca_id: "",
    capa_id: "",
  });

  // --- Local state for parsed/editable fields (for display) ---
  const [employeePrefix, setEmployeePrefix] = useState('');
  const [employeeDigits, setEmployeeDigits] = useState();
  const [rcaPrefix, setRcaPrefix] = useState('');
  const [rcaDigits, setRcaDigits] = useState();
  const [capaPrefix, setCapaPrefix] = useState('');
  const [capaDigits, setCapaDigits] = useState();


  useEffect(() => {
    setPageTitle(t("Settings"));
    toggleProgressBar(false);
    loadSettings();
  }, []);

  /** HELPER: Parses "PREFIX,DIGITS" string into [prefix, digits] */
  const parseCombinedId = (combinedValue) => {
    if (!combinedValue) return ['', 0];
    const parts = String(combinedValue).split(',');
    // Ensure digits is a number, defaulting to 0
    const digits = parseInt(parts[1], 10);
    return [parts[0] || '', isNaN(digits) ? 0 : digits];
  }

  async function loadSettings() {
    try {
      const res = await HttpClient({
        url: '/settings/get',
        method: "GET",
        params: { group: "general" },
      }); // Assumes HttpClient returns a Promise that resolves to the response object

      if (res.success) {
        const settings = res.data;

        // Set the combined state for API interaction
        setForm({
          employee_id: settings.employee_id || "",
          rca_id: settings.rca_id || "",
          capa_id: settings.capa_id || ""
        });

        // Parse combined values into local state for display
        const [empP, empD] = parseCombinedId(settings.employee_id);
        setEmployeePrefix(empP);
        setEmployeeDigits(empD);

        const [rcaP, rcaD] = parseCombinedId(settings.rca_id);
        setRcaPrefix(rcaP);
        setRcaDigits(rcaD);

        const [capaP, capaD] = parseCombinedId(settings.capa_id);
        setCapaPrefix(capaP);
        setCapaDigits(capaD);
      }
    } catch (e) {
      console.error("Load settings failed:", e);
      toast(error ? "error" : "warning", e.message || "Error loading settings");
    } finally {
      // loading
      toggleProgressBar(false);
    }
  }

  const GeneralSettingsSave = async (e) => {
    e.preventDefault();
    toggleProgressBar(true);

    // Combination Logic: Combine prefix/digits into the main ID field values
    const finalForm = {
      employee_id: `${employeePrefix},${employeeDigits}`,
      rca_id: `${rcaPrefix},${rcaDigits}`,
      capa_id: `${capaPrefix},${capaDigits}`,
    };
    
    // Converts finalForm object to backend's required array structure
    const settingsArray = Object.keys(finalForm).map(key => ({
      field_name: key,
      value: finalForm[key]
    }));
    
    const payload = {
      setting_group: "general",
      settings: settingsArray
    };

    // Use await with your custom HttpClient
    try {
      HttpClient({
        url: '/settings/save',
        method: "POST",
        data: { ...payload },
      }).then(res => {
        toggleProgressBar(false);
        if (res.success) {
          setEditing(false);
          loadSettings(); 
          toast('success', 'Settings saved successfully.');
        } else {
          toast('error', res.message || 'Error saving settings');
        }
      }).catch(err => {
        toggleProgressBar(false);
        const errors = err.response.errors;
        if (errors) {
          toast('error', errors);
        }
      });
    } catch (error) {
      toggleProgressBar(false);

      toast('error', 'Error occurred when trying to save the User data.');
    }
  };

  return (
    <AuthenticatedPage>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="d-flex align-items-center">
                ID Formats
                {!isEditing && (
                  <button 
                    className="btn btn-primary ms-3" 
                    onClick={() => setEditing(true)}
                  >
                    <AppIcon ic="pencil" /> Edit
                  </button>
                )}
              </h5>
            </div>
          </div>
        </div>
      </div>


      <div className="row mt-2">
        {/* --- Employee ID Card --- */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>Employee ID</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField
                    label="Prefix"
                    placeholder="EMP-"
                    value={employeePrefix}
                    disabled={!isEditing}
                    onChange={(v) => setEmployeePrefix(v)} />
                </div>

                <div className="col-6">
                  <TextField
                    type="number"
                    label="No of Digits"
                    placeholder="4"
                    value={employeeDigits}
                    disabled={!isEditing}
                    onChange={(v) => setEmployeeDigits(parseInt(v, 10) || 0)} />
                </div>
              </div>

              {
                employeePrefix &&
                <div className="row mt-1">
                  <div className="col-12">
                    The ID will be: <span className="badge rounded-pill bg-primary">{ employeePrefix }{ '1'.padStart(employeeDigits || 0, '0') }</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>


        {/* --- RCA ID Card --- */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>RCA ID</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField
                    label="Prefix"
                    placeholder="RCA-"
                    value={rcaPrefix}
                    disabled={!isEditing}
                    onChange={(v) => setRcaPrefix(v)} />
                </div>

                <div className="col-6">
                  <TextField
                    type="number"
                    label="No of Digits"
                    placeholder="4"
                    value={rcaDigits}
                    disabled={!isEditing}
                    onChange={(v) => setRcaDigits(parseInt(v, 10) || 0)} />
                </div>
              </div>

              {
                rcaPrefix &&
                <div className="row mt-1">
                  <div className="col-12">
                    The ID will be: <span className="badge rounded-pill bg-primary">{ rcaPrefix }{ '1'.padStart(rcaDigits || 0, '0') }</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>


        {/* --- CAPA ID Card --- */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>CAPA ID</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField
                    label="Prefix"
                    placeholder="CAPA-"
                    value={capaPrefix}
                    disabled={!isEditing}
                    onChange={(v) => setCapaPrefix(v)} />
                </div>

                <div className="col-6">
                  <TextField
                    type="number"
                    label="No of Digits"
                    placeholder="4"
                    value={capaDigits}
                    disabled={!isEditing}
                    onChange={(v) => setCapaDigits(parseInt(v, 10) || 0)} />
                </div>
              </div>

              {
                capaPrefix &&
                <div className="row mt-1">
                  <div className="col-12">
                    The ID will be: <span className="badge rounded-pill bg-primary">{ capaPrefix }{ '1'.padStart(capaDigits || 0, '0') }</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {isEditing && (
            <div className="text-end mt-3">
              <button 
                className="btn btn-secondary me-2" 
                onClick={() => {
                  setEditing(false);
                  loadSettings(); 
                }}
              >
                Cancel
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={GeneralSettingsSave}
              >
                <AppIcon ic="save" /> Save
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedPage>
  );
}