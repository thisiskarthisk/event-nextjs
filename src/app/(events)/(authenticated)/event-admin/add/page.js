'use client';

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAppLayoutContext } from "@/components/appLayout";
import { useAuthPageLayoutContext } from "@/components/auth/authPageWrapper";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { decodeURLParam } from "@/helper/utils";

export default function EventAdminAddOrEditForm({ params }) {

  // -----------------------
  // ROUTE PARAM
  // -----------------------
  const { id } = use(params);
  const eventsId = id;
  const isEdit = !!eventsId;

  const router = useRouter();

  // -----------------------
  // CONTEXT
  // -----------------------
  const { setPageTitle, toggleProgressBar, toast } = useAppLayoutContext();
  const { toggleBreadcrumbs } = useAuthPageLayoutContext();

  // -----------------------
  // STATE
  // -----------------------
  const initialData = {
    event_name: "",
    event_description: "",
    event_start_datetime: "",
    event_end_datetime: "",
    event_organisation: "",
  };

  const [formData, setFormData] = useState(initialData);
  const [decryptedEventId, setDecryptedEventId] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // -----------------------
  // Helpers
  // -----------------------
  const toLocalDatetime = (val) => {
    if (!val) return "";
    const d = new Date(val);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // -----------------------
  // Universal Field Handler
  // -----------------------
  const onFieldValueChanged = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // -----------------------
  // Logo Change
  // -----------------------
  const onLogoChanged = (e) => {

    const file = e?.target?.files?.[0];
    if (!file) return;

    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // -----------------------
  // Load Edit Data
  // -----------------------
  const loadExistingEvents = async (eventId) => {

    toggleProgressBar(true);

    try {

      const res = await HttpClient({
        url: "/events/get",
        method: "GET",
        params: { id: eventId },
      });

      if (!res?.success || !res.data) {
        toast("error", "Failed to load event data.");
        return;
      }

      const event = res.data;

      setFormData({
        event_name: event.event_name || "",
        event_description: event.event_description || "",
        event_start_datetime: toLocalDatetime(event.event_start_datetime),
        event_end_datetime: toLocalDatetime(event.event_end_datetime),
        event_organisation: event.event_organisation || "",
      });

      if (event.event_logo) {
        setLogoPreview(event.event_logo);
      }

      setLogoFile(null); // 👈 important

    } catch (err) {

      console.error(err);
      toast("error", "Error loading event data.");

    } finally {
      toggleProgressBar(false);
    }
  };

  // -----------------------
  // Init
  // -----------------------
  useEffect(() => {
    toggleProgressBar(false);
    setPageTitle(isEdit ? "Edit Event" : "Add Event");
    toggleBreadcrumbs({
      Event: "/events",
      [`${isEdit ? "Edit" : "Add"} Event`]: null,
    });

    if (!isEdit) return;

    const dec = decodeURLParam(eventsId);
    setDecryptedEventId(dec);

    if (dec) {
      loadExistingEvents(dec);
    }

  }, [eventsId, isEdit]);

  // -----------------------
  // Submit
  // -----------------------
  const onSubmit = async (e) => {

    e.preventDefault();

    const payload = new FormData();

    if (decryptedEventId) {
      payload.append("id", decryptedEventId);
    }

    Object.entries(formData).forEach(([k, v]) =>
      payload.append(k, v ?? "")
    );

    if (logoFile) {
      payload.append("event_logo", logoFile);
    }

    try {

      const res = await HttpClient({
        url: "/events/save",
        method: "POST",
        data: payload,
      });

      toast(
        res.success ? "success" : "error",
        res.message || "Unable to save the Event data!"
      );

      if (res.success) {
        router.push("/events");
      }

    } catch (err) {
      console.error(err);
      toast("error", "Something went wrong while saving.");
    }
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <form onSubmit={onSubmit}>

      <div className="card">
        <div className="card-body">

          <div className="row mt-3">

            <div className="col-lg-4">
              <TextField
                label="Event Name"
                value={formData.event_name}
                onChange={(v) =>
                  onFieldValueChanged(v, "event_name")
                }
                isRequired
              />
            </div>

            <div className="col-lg-4">
              <TextField
                label="Event Description"
                value={formData.event_description}
                onChange={(v) =>
                  onFieldValueChanged(v, "event_description")
                }
                isRequired
              />
            </div>

            <div className="col-lg-4">
              <TextField
                label="Event Start Date"
                type="datetime-local"
                value={formData.event_start_datetime}
                onChange={(v) =>
                  onFieldValueChanged(v, "event_start_datetime")
                }
                isRequired
              />
            </div>

          </div>

          <div className="row mt-3">

            <div className="col-lg-4">
              <TextField
                label="Event End Date"
                type="datetime-local"
                value={formData.event_end_datetime}
                onChange={(v) =>
                  onFieldValueChanged(v, "event_end_datetime")
                }
                isRequired
              />
            </div>

            <div className="col-lg-4">
              <TextField
                label="Organisation"
                value={formData.event_organisation}
                onChange={(v) =>
                  onFieldValueChanged(v, "event_organisation")
                }
                isRequired
              />
            </div>

            <div className="col-lg-4">

              <TextField
                label="Logo"
                type="file"
                accept="image/*"
                onChange={onLogoChanged}
              />

              {logoPreview && (
                <div className="mt-3">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="rounded"
                    style={{ maxWidth: 200 }}
                  />

                  {logoFile && (
                    <div className="small text-muted mt-1">
                      Selected: {logoFile.name}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12 flex-space-between">

          <Link href="/events" className="btn btn-secondary">
            Cancel
          </Link>

          <button className="btn btn-primary" type="submit">
            <AppIcon ic="check" />{" "}
            {isEdit ? "Save" : "Add"} Event
          </button>

        </div>
      </div>

    </form>
  );
}
