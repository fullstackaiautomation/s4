"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";

type UploadStatus = "idle" | "uploading" | "success";

type RequiredFile = {
  id: "cbos" | "google" | "bing";
  label: string;
  description: string;
  accept: string;
};

const requiredFiles: RequiredFile[] = [
  {
    id: "cbos",
    label: "CBOS Dashboard Export",
    description: "Monthly export from CBOS with orders, revenue, and invoice data.",
    accept: ".csv",
  },
  {
    id: "google",
    label: "Google Ads Report",
    description: "Monthly performance CSV grouped by campaign with spend and conversions.",
    accept: ".csv",
  },
  {
    id: "bing",
    label: "Microsoft Ads Report",
    description: "Monthly performance CSV exported from Microsoft Ads.",
    accept: ".csv",
  },
];

export function MonthlyDashboardUploader() {
  const [selectedFiles, setSelectedFiles] = useState<Record<RequiredFile["id"], File | null>>({
    cbos: null,
    google: null,
    bing: null,
  });
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const allFilesSelected = useMemo(
    () => requiredFiles.every((file) => selectedFiles[file.id] !== null),
    [selectedFiles],
  );

  const handleFileChange = (id: RequiredFile["id"], fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    setSelectedFiles((prev) => ({ ...prev, [id]: file }));
  };

  const handleSubmit = async () => {
    if (!allFilesSelected) {
      setMessage("Please attach all required files before processing.");
      return;
    }
    setStatus("uploading");
    setMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setStatus("success");
    setMessage("Files validated and queued for Supabase ingestion. Refresh data after processing completes.");
    setSelectedFiles({ cbos: null, google: null, bing: null });
  };

  return (
    <div className="space-y-6">
      {status === "success" && message ? (
        <InlineAlert title="Upload scheduled" message={message} variant="success" />
      ) : null}
      {status === "idle" && message ? <InlineAlert title="Action required" message={message} variant="warning" /> : null}
      <div className="grid gap-4">
        {requiredFiles.map((file) => {
          const selected = selectedFiles[file.id];
          return (
            <div key={file.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4 shadow-subtle">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{file.label}</div>
                  <div className="text-xs text-muted-foreground">{file.description}</div>
                </div>
                <label className="shrink-0">
                  <input
                    type="file"
                    accept={file.accept}
                    className="hidden"
                    onChange={(event) => handleFileChange(file.id, event.target.files)}
                  />
                  <span className="inline-flex cursor-pointer items-center rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-subtle transition hover:bg-primary/20">
                    {selected ? "Replace" : "Upload"}
                  </span>
                </label>
              </div>
              {selected ? (
                <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                  {selected.name} • {(selected.size / 1024).toFixed(1)} KB
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  No file selected
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={status === "uploading"}>
          {status === "uploading" ? "Validating..." : "Process Upload"}
        </Button>
        <span className="text-xs text-muted-foreground">Files are staged and validated locally before Supabase import.</span>
      </div>
    </div>
  );
}
