'use client';

import { useEffect, useState } from "react";

import { useAppLayoutContext } from "@/components/appLayout";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";

export default function GeneralSettings() {

  const {
    setPageTitle,
    toggleProgressBar,
    toast,
    setLHSAppBarMenuItems,
  } = useAppLayoutContext();

  const [isEditing, setEditing] = useState(false);

  // =============================
  // FORM STATE
  // =============================
  const [prefix, setPrefix] = useState("");
  const [digits, setDigits] = useState(4);

  const [whatsapp, setWhatsapp] = useState({
    phone_id: "",
    template: "",
    token: "",
  });

  // =============================
  // INIT
  // =============================
  useEffect(() => {
    setPageTitle("General Settings");
    loadSettings();
  }, []);

  useEffect(() => {

    if (!isEditing) {
      setLHSAppBarMenuItems([
        {
          icon: "pencil",
          tooltip: "Edit",
          onClick: () => setEditing(true),
        },
      ]);
    } else {
      setLHSAppBarMenuItems([]);
    }

    return () => setLHSAppBarMenuItems([]);

  }, [isEditing]);

  // =============================
  // LOAD SETTINGS
  // =============================
  const loadSettings = async () => {

    toggleProgressBar(true);

    try {

      const res = await HttpClient({
        url: "/settings/get",
        method: "GET",
        params: { group: "general" },
      });

      if (res.success) {

        // ---- regn no ----
        if (res.data.regn_no) {
          const [p, d] = res.data.regn_no.split(",");
          setPrefix(p || "");
          setDigits(Number(d) || 0);
        }

        // ---- whatsapp ----
        setWhatsapp({
          phone_id: res.data.whatsapp_phone_id || "",
          template: res.data.whatsapp_template || "",
          token: res.data.whatsapp_token || "",
        });
      }

    } catch {
      toast("error", "Failed to load settings");
    } finally {
      toggleProgressBar(false);
    }
  };

  // =============================
  // SAVE
  // =============================
  const onSave = async (e) => {

    e.preventDefault();

    toggleProgressBar(true);

    const settings = [
      {
        field_name: "regn_no",
        value: `${prefix},${digits}`,
      },
      {
        field_name: "whatsapp_phone_id",
        value: whatsapp.phone_id,
      },
      {
        field_name: "whatsapp_template",
        value: whatsapp.template,
      },
      {
        field_name: "whatsapp_token",
        value: whatsapp.token,
      },
    ];

    try {

      const res = await HttpClient({
        url: "/settings/save",
        method: "POST",
        data: {
          setting_group: "general",
          settings,
        },
      });

      if (res.success) {
        toast("success", res.message);
        setEditing(false);
        loadSettings();
      } else {
        toast("error", res.message);
      }

    } catch {
      toast("error", "Save failed");
    } finally {
      toggleProgressBar(false);
    }
  };

  // =============================
  // PREVIEW
  // =============================
  const previewId = () => {

    if (!prefix || !digits) return "";

    return prefix + String(1).padStart(digits, "0");
  };

  // =============================
  // RENDER
  // =============================
  return (
    <form onSubmit={onSave}>

      {/* ================= ID FORMAT ================= */}
      <div className="card mb-4">
        <div className="card-body">

          <h5>ID Format</h5>

          <div className="row">

            <div className="col-lg-6">
              <TextField
                label="Prefix"
                value={prefix}
                disabled={!isEditing}
                onChange={v => setPrefix(v)}
              />
            </div>

            <div className="col-lg-6">
              <TextField
                type="number"
                label="No of Digits"
                value={digits}
                disabled={!isEditing}
                onChange={v =>
                  setDigits(Number(v) || 0)
                }
              />
            </div>

          </div>

          {prefix && digits > 0 && (
            <div className="mt-2">
              The ID will be:{" "}
              <span className="badge bg-primary">
                {previewId()}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* ================= WHATSAPP ================= */}
      <div className="card mb-3">
        <div className="card-body">

          <h5>WhatsApp Configuration</h5>

          <div className="row">

            <div className="col-lg-6">
              <TextField
                label="Phone Number ID"
                value={whatsapp.phone_id}
                disabled={!isEditing}
                onChange={v =>
                  setWhatsapp(p => ({
                    ...p,
                    phone_id: v,
                  }))
                }
              />
            </div>

            <div className="col-lg-6">
              <TextField
                label="Template Name"
                value={whatsapp.template}
                disabled={!isEditing}
                onChange={v =>
                  setWhatsapp(p => ({
                    ...p,
                    template: v,
                  }))
                }
              />
            </div>

            <div className="col-lg-12 mt-2">
              <TextField
                label="Access Token"
                value={whatsapp.token}
                disabled={!isEditing}
                onChange={v =>
                  setWhatsapp(p => ({
                    ...p,
                    token: v,
                  }))
                }
              />
            </div>

          </div>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      {isEditing && (
        <div className="d-flex justify-content-between">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setEditing(false);
              loadSettings();
            }}
          >
            Cancel
          </button>

          <button className="btn btn-primary" type="submit">
            <AppIcon ic="check" /> Save
          </button>

        </div>
      )}

    </form>
  );
}
