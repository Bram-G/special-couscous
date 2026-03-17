"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Progress,
} from "@heroui/react";
import {
  Download,
  Upload,
  FileJson,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clapperboard,
  RefreshCw,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportResults {
  users:           { created: number; existing: number };
  groups:          { created: number; updated: number };
  movieMondays:    { created: number; updated: number };
  movieSelections: { created: number };
  eventDetails:    { created: number; updated: number };
  watchlists:      { created: number; updated: number };
  watchlistItems:  { created: number; skipped: number };
  errors:          string[];
}

interface ImportResponse {
  success: boolean;
  message: string;
  results: ImportResults;
  error?: string;
}

interface ExportMeta {
  exportVersion: string;
  exportedAt: string;
  exportedBy: string;
  groups: { name: string; movieMondays: unknown[] }[];
  watchlists: unknown[];
  users: unknown[];
}

interface EnrichStatus {
  total: number;
  missing: number;
  enriched: number;
}

interface EnrichBatchResult {
  total: number;
  offset: number;
  batchSize: number;
  enriched: number;
  failed: number;
  done: boolean;
  nextOffset: number;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ResultRow({
  label,
  created,
  updated,
  skipped,
}: {
  label: string;
  created?: number;
  updated?: number;
  skipped?: number;
}) {
  const total = (created ?? 0) + (updated ?? 0) + (skipped ?? 0);
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-default-600">{label}</span>
      <div className="flex gap-2">
        {(created ?? 0) > 0 && (
          <Chip size="sm" color="success" variant="flat">+{created} new</Chip>
        )}
        {(updated ?? 0) > 0 && (
          <Chip size="sm" color="primary" variant="flat">{updated} updated</Chip>
        )}
        {(skipped ?? 0) > 0 && (
          <Chip size="sm" color="default" variant="flat">{skipped} skipped</Chip>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataManagement() {
  const { token } = useAuth();

  // ── Export state ────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting]   = useState(false);
  const [exportError, setExportError]   = useState<string | null>(null);

  // ── Import state ────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta]         = useState<ExportMeta | null>(null);
  const [fileError, setFileError]       = useState<string | null>(null);
  const [isImporting, setIsImporting]   = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Enrich state ────────────────────────────────────────────────────────────
  const [enrichStatus, setEnrichStatus]           = useState<EnrichStatus | null>(null);
  const [enrichStatusLoading, setEnrichStatusLoading] = useState(false);
  const [isEnriching, setIsEnriching]             = useState(false);
  const [enrichProgress, setEnrichProgress]       = useState(0);   // 0-100
  const [enrichProcessed, setEnrichProcessed]     = useState(0);   // movies done so far
  const [enrichTotal, setEnrichTotal]             = useState(0);
  const [enrichErrors, setEnrichErrors]           = useState<string[]>([]);
  const [enrichDone, setEnrichDone]               = useState(false);
  const [enrichFailed, setEnrichFailed]           = useState(0);
  const enrichRunning = useRef(false);

  // ── Load enrich status on mount ─────────────────────────────────────────────
  const fetchEnrichStatus = useCallback(async () => {
    if (!token) return;
    setEnrichStatusLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enrich-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEnrichStatus(await res.json());
    } catch { /* silent */ }
    finally { setEnrichStatusLoading(false); }
  }, [token]);

  useEffect(() => { fetchEnrichStatus(); }, [fetchEnrichStatus]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!token) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${response.status}`);
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `movie-monday-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // ── File handling ───────────────────────────────────────────────────────────
  const readFile = useCallback((file: File) => {
    setFileError(null);
    setFileMeta(null);
    setImportResult(null);

    if (!file.name.endsWith(".json")) {
      setFileError("Please select a .json export file");
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as ExportMeta;
        if (!parsed.exportVersion || !parsed.groups) throw new Error("File is not a valid Movie Monday export");
        setSelectedFile(file);
        setFileMeta(parsed);
      } catch (err: any) {
        setFileError(err.message || "Could not parse file");
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop      = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) readFile(f); };
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    setSelectedFile(null);
    setFileMeta(null);
    setFileError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!selectedFile || !token) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const payload = JSON.parse(await selectedFile.text());
      const response = await fetch(`${API_BASE_URL}/api/admin/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const result: ImportResponse = await response.json();
      setImportResult(result);

      if (result.success) {
        setSelectedFile(null);
        setFileMeta(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refresh enrich status since we now have new MovieSelections
        fetchEnrichStatus();
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        message: "Import failed",
        error: err.message,
        results: {
          users:           { created: 0, existing: 0 },
          groups:          { created: 0, updated: 0 },
          movieMondays:    { created: 0, updated: 0 },
          movieSelections: { created: 0 },
          eventDetails:    { created: 0, updated: 0 },
          watchlists:      { created: 0, updated: 0 },
          watchlistItems:  { created: 0, skipped: 0 },
          errors:          [err.message],
        },
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ── Enrichment ──────────────────────────────────────────────────────────────
  const startEnrichment = async () => {
    if (!token || isEnriching) return;

    setIsEnriching(true);
    setEnrichDone(false);
    setEnrichProgress(0);
    setEnrichProcessed(0);
    setEnrichErrors([]);
    setEnrichFailed(0);
    enrichRunning.current = true;

    let offset         = 0;
    const BATCH_SIZE   = 15;
    let totalMovies    = 0;
    let totalProcessed = 0;
    let totalFailed    = 0;
    const allErrors: string[] = [];

    try {
      while (enrichRunning.current) {
        const res = await fetch(`${API_BASE_URL}/api/admin/enrich-tmdb`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ offset, batchSize: BATCH_SIZE }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Server error ${res.status}`);
        }

        const batch: EnrichBatchResult = await res.json();

        totalMovies     = batch.total;
        totalProcessed += batch.enriched;
        totalFailed    += batch.failed;

        if (batch.errors?.length) allErrors.push(...batch.errors);

        setEnrichTotal(totalMovies);
        setEnrichProcessed(totalProcessed + (enrichStatus?.enriched ?? 0));
        setEnrichErrors([...allErrors]);
        setEnrichFailed(totalFailed);

        const overallEnriched = (enrichStatus?.enriched ?? 0) + totalProcessed;
        const overallTotal    = (enrichStatus?.enriched ?? 0) + totalMovies;
        setEnrichProgress(overallTotal > 0 ? Math.round((overallEnriched / overallTotal) * 100) : 100);

        if (batch.done) {
          setEnrichDone(true);
          break;
        }

        offset = batch.nextOffset;

        // Small pause between batches to be polite to the TMDB API
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err: any) {
      allErrors.push(`Enrichment stopped: ${err.message}`);
      setEnrichErrors([...allErrors]);
    } finally {
      enrichRunning.current = false;
      setIsEnriching(false);
      fetchEnrichStatus();
    }
  };

  const stopEnrichment = () => {
    enrichRunning.current = false;
  };

  const resetEnrich = () => {
    setEnrichDone(false);
    setEnrichProgress(0);
    setEnrichProcessed(0);
    setEnrichTotal(0);
    setEnrichErrors([]);
    setEnrichFailed(0);
    fetchEnrichStatus();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const allEnriched = enrichStatus && enrichStatus.missing === 0;

  return (
    <div className="space-y-6">

      {/* ── Info banner ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-default-700 space-y-1">
          <p className="font-medium text-default-900">About data management</p>
          <p>
            Exports include all Movie Monday events, movie selections, food &amp; drink details,
            and your watchlists — but not cast/crew (that data lives in TMDB and can be re-fetched
            after any import). New users created during an import get the temporary password{" "}
            <code className="bg-content2 px-1 rounded text-xs">ChangeMe123!</code>.
          </p>
        </div>
      </div>

      {/* ── Export card ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30">
            <Download className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-lg">Export Data</p>
            <p className="text-sm text-default-500">Download a full backup of your Movie Monday data as JSON</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          <p className="text-sm text-default-600">
            The export includes all your groups, every Movie Monday event (movies, menus, themes), and your
            watchlists. Use it to back up before a database reset, or to migrate to a new setup.
          </p>

          {exportError && (
            <div className="flex items-center gap-2 text-danger text-sm">
              <XCircle className="w-4 h-4 shrink-0" />{exportError}
            </div>
          )}

          <Button
            color="success"
            variant="flat"
            startContent={!isExporting && <Download className="w-4 h-4" />}
            isLoading={isExporting}
            onPress={handleExport}
            className="w-fit"
          >
            {isExporting ? "Preparing export…" : "Download Export"}
          </Button>
        </CardBody>
      </Card>

      {/* ── Import card ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">Import Data</p>
            <p className="text-sm text-default-500">Restore from a previously exported JSON file</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          <p className="text-sm text-default-600">
            Import is <strong>safe to run multiple times</strong> — existing records are updated rather than
            duplicated. After importing, use the Cast &amp; Crew card below to restore actor statistics.
          </p>

          {!selectedFile && !importResult && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragging
                    ? "border-primary bg-primary-50 dark:bg-primary-900/20"
                    : "border-default-300 hover:border-primary hover:bg-default-50 dark:hover:bg-default-50/5"
                  }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileJson className="w-10 h-10 mx-auto mb-3 text-default-400" />
                <p className="font-medium text-default-700">Drop your export file here</p>
                <p className="text-sm text-default-400 mt-1">or click to browse — .json files only</p>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              </div>
              {fileError && (
                <div className="flex items-center gap-2 text-danger text-sm">
                  <XCircle className="w-4 h-4 shrink-0" />{fileError}
                </div>
              )}
            </>
          )}

          {selectedFile && fileMeta && !importResult && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-content2">
                <FileJson className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-default-500 mt-0.5">
                    Exported by <strong>{fileMeta.exportedBy}</strong> on{" "}
                    {new Date(fileMeta.exportedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Chip size="sm" variant="flat" color="primary">
                      {fileMeta.groups.reduce((n, g) => n + (g.movieMondays?.length ?? 0), 0)} Movie Mondays
                    </Chip>
                    <Chip size="sm" variant="flat" color="secondary">
                      {fileMeta.groups.length} {fileMeta.groups.length === 1 ? "Group" : "Groups"}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {fileMeta.watchlists.length} {fileMeta.watchlists.length === 1 ? "Watchlist" : "Watchlists"}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      <Users className="w-3 h-3 inline mr-1" />{fileMeta.users.length}
                    </Chip>
                  </div>
                </div>
                <Button size="sm" variant="light" isIconOnly onPress={clearFile} className="shrink-0">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  color="primary"
                  startContent={!isImporting && <Upload className="w-4 h-4" />}
                  isLoading={isImporting}
                  onPress={handleImport}
                >
                  {isImporting ? "Importing…" : "Start Import"}
                </Button>
                <Button variant="flat" onPress={clearFile} isDisabled={isImporting}>Cancel</Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                importResult.success
                  ? "bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800"
                  : "bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800"
              }`}>
                {importResult.success
                  ? <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  : <XCircle className="w-5 h-5 text-danger shrink-0" />}
                <div>
                  <p className="font-medium text-sm">
                    {importResult.success ? "Import complete" : "Import failed"}
                  </p>
                  {importResult.error && <p className="text-xs text-default-500 mt-0.5">{importResult.error}</p>}
                </div>
              </div>

              {importResult.success && (
                <div className="p-4 rounded-lg bg-content2 space-y-1">
                  <p className="text-xs font-semibold text-default-500 uppercase tracking-wide mb-2">Summary</p>
                  <ResultRow label="Users"            created={importResult.results.users.created}           skipped={importResult.results.users.existing} />
                  <ResultRow label="Groups"           created={importResult.results.groups.created}          updated={importResult.results.groups.updated} />
                  <ResultRow label="Movie Mondays"    created={importResult.results.movieMondays.created}    updated={importResult.results.movieMondays.updated} />
                  <ResultRow label="Movie Selections" created={importResult.results.movieSelections.created} />
                  <ResultRow label="Event Details"    created={importResult.results.eventDetails.created}    updated={importResult.results.eventDetails.updated} />
                  <ResultRow label="Watchlists"       created={importResult.results.watchlists.created}      updated={importResult.results.watchlists.updated} />
                  <ResultRow label="Watchlist Items"  created={importResult.results.watchlistItems.created}  skipped={importResult.results.watchlistItems.skipped} />
                </div>
              )}

              {importResult.results?.errors?.length > 0 && (
                <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                    <p className="text-sm font-medium text-warning-700 dark:text-warning-400">
                      {importResult.results.errors.length} warning{importResult.results.errors.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ul className="text-xs text-default-600 space-y-1 max-h-40 overflow-y-auto">
                    {importResult.results.errors.map((e, i) => <li key={i} className="font-mono">{e}</li>)}
                  </ul>
                </div>
              )}

              <Button variant="flat" onPress={() => setImportResult(null)}>
                Import Another File
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Cast & Crew Enrichment card ──────────────────────────────────── */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30">
            <Clapperboard className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">Cast &amp; Crew Data</p>
            <p className="text-sm text-default-500">
              Pull actor and director stats from TMDB for all your movies
            </p>
          </div>
          {enrichStatus && !enrichStatusLoading && (
            <div className="shrink-0 text-right">
              {allEnriched ? (
                <Chip size="sm" color="success" variant="flat" startContent={<CheckCircle className="w-3 h-3" />}>
                  All enriched
                </Chip>
              ) : (
                <Chip size="sm" color="warning" variant="flat">
                  {enrichStatus.missing} missing
                </Chip>
              )}
            </div>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          <p className="text-sm text-default-600">
            Cast &amp; crew data is not included in exports since it can always be re-fetched from TMDB.
            Run this after any import to restore your actor statistics, director history, and the
            actor appearance counts your group loves.
          </p>

          {/* Status bar */}
          {enrichStatus && !enrichStatusLoading && (
            <div className="p-4 rounded-lg bg-content2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-default-600">
                  <strong className="text-default-900">{enrichStatus.enriched}</strong> of{" "}
                  <strong className="text-default-900">{enrichStatus.total}</strong> movies enriched
                </span>
                {enrichStatus.total > 0 && (
                  <span className="text-default-400 text-xs">
                    {Math.round((enrichStatus.enriched / enrichStatus.total) * 100)}%
                  </span>
                )}
              </div>
              {enrichStatus.total > 0 && (
                <Progress
                  value={enrichStatus.total > 0 ? (enrichStatus.enriched / enrichStatus.total) * 100 : 0}
                  color={allEnriched ? "success" : "secondary"}
                  size="sm"
                  className="max-w-full"
                />
              )}
            </div>
          )}

          {/* Active enrichment progress */}
          {(isEnriching || enrichDone) && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-default-600">
                  {enrichDone ? "Enrichment complete" : "Fetching cast & crew from TMDB…"}
                </span>
                <span className="text-default-400 font-mono text-xs">{enrichProgress}%</span>
              </div>
              <Progress
                value={enrichProgress}
                color={enrichDone ? "success" : "secondary"}
                size="sm"
                isIndeterminate={isEnriching && enrichTotal === 0}
              />
              {enrichTotal > 0 && (
                <p className="text-xs text-default-500">
                  Processed <strong>{enrichProcessed}</strong> of{" "}
                  <strong>{(enrichStatus?.enriched ?? 0) + enrichTotal}</strong> total
                  {enrichFailed > 0 && (
                    <span className="text-warning ml-2">· {enrichFailed} failed</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Errors during enrichment */}
          {enrichErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <p className="text-xs font-medium text-warning-700 dark:text-warning-400">
                  {enrichErrors.length} issue{enrichErrors.length !== 1 ? "s" : ""} during enrichment
                </p>
              </div>
              <ul className="text-xs text-default-600 space-y-0.5 max-h-32 overflow-y-auto font-mono">
                {enrichErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!isEnriching && !enrichDone && !allEnriched && (
              <Button
                color="secondary"
                variant="flat"
                startContent={<Clapperboard className="w-4 h-4" />}
                onPress={startEnrichment}
                isDisabled={enrichStatusLoading || enrichStatus?.missing === 0}
              >
                {enrichStatus?.missing === 0
                  ? "All caught up"
                  : `Pull Cast & Crew${enrichStatus ? ` (${enrichStatus.missing} movies)` : ""}`}
              </Button>
            )}

            {isEnriching && (
              <Button color="danger" variant="flat" onPress={stopEnrichment}>
                Stop
              </Button>
            )}

            {(enrichDone || allEnriched) && (
              <>
                {enrichDone && (
                  <div className="flex items-center gap-2 text-success text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Done! Actor stats are up to date.
                  </div>
                )}
                <Button
                  variant="flat"
                  size="sm"
                  startContent={<RefreshCw className="w-3.5 h-3.5" />}
                  onPress={resetEnrich}
                >
                  Re-check status
                </Button>
              </>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}