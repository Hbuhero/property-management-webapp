import { useState, useRef, useCallback } from "react";

const API_BASE = "https://api-new.shambabora.co.tz/api/v1/chunked-files";
const CHUNK_SIZE = 64 * 1024; // 5 MB — must match backend
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB hard UI limit
const MAX_RETRIES = 3;
const CONCURRENCY = 3; // parallel chunks in-flight at once

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadResult {
    filePath?: string;
    fileId?: number;
    [key: string]: unknown;
}

interface ResumeData {
    uploadId: string;
    offset: number;
    fileName: string;
    fileSize: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
};

const resumeKey = (file: File) => `upload_resume_${file.name}_${file.size}`;
const saveResume = (file: File, d: ResumeData) => sessionStorage.setItem(resumeKey(file), JSON.stringify(d));
const loadResume = (file: File): ResumeData | null => {
    try { const r = sessionStorage.getItem(resumeKey(file)); return r ? JSON.parse(r) : null; }
    catch { return null; }
};
const clearResume = (file: File) => sessionStorage.removeItem(resumeKey(file));

/**
 * Send a single chunk with exponential-backoff retry.
 * Returns the raw Response on success; throws after MAX_RETRIES failures.
 */
async function sendChunk(
    uploadId: string,
    offset: number,
    end: number,
    chunk: Blob,
    fileSize: number,
    signal: AbortSignal,
): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const res = await fetch(`${API_BASE}/${uploadId}`, {
            method: "PATCH",
            headers: {
                "Content-Range": `bytes ${offset}-${end - 1}/${fileSize}`,
                "Content-Length": String(end - offset), // ✅ string — not a number
                "Content-Type": "application/octet-stream",
            },
            body: chunk,
            signal,
        });

        // 200 = complete, 202 = continue — both are success
        if (res.ok || res.status === 202) return res;

        // Hard 4xx errors (except 429 Too Many Requests) — don't retry
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            const body = await res.json().catch(() => ({}) as { message?: string });
            throw new Error((body as { message?: string }).message ?? `Chunk failed (${res.status})`);
        }

        if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 500 * 2 ** attempt)); // 500ms, 1s, 2s
        }
    }
    throw new Error(`Chunk at offset ${offset} failed after ${MAX_RETRIES + 1} attempts`);
}

// ─── Status ───────────────────────────────────────────────────────────────────

const STATUS = {
    IDLE: "IDLE",
    UPLOADING: "UPLOADING",
    DONE: "DONE",
    ERROR: "ERROR",
    CANCELLED: "CANCELLED",
} as const;
type StatusType = (typeof STATUS)[keyof typeof STATUS];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FileUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<StatusType>(STATUS.IDLE);
    const [progress, setProgress] = useState<number>(0);
    const [uploadedBytes, setUploadedBytes] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(0);
    const [elapsed, setElapsed] = useState<number>(0);
    const [eta, setEta] = useState<number | null>(null);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState<boolean>(false);
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [activeChunks, setActiveChunks] = useState<number>(0); // parallel in-flight count

    const uploadIdRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ── Reset ──────────────────────────────────────────────────────────────────

    const reset = useCallback(() => {
        setFile(null);
        setStatus(STATUS.IDLE);
        setProgress(0);
        setUploadedBytes(0);
        setSpeed(0);
        setElapsed(0);
        setEta(null);
        setResult(null);
        setError(null);
        setResumeData(null);
        setActiveChunks(0);
        uploadIdRef.current = null;
        abortControllerRef.current = null;
        if (timerRef.current !== null) clearInterval(timerRef.current);
    }, []);

    // ── File selection ─────────────────────────────────────────────────────────

    const handleFile = useCallback(
        (f: File | null) => {
            if (!f) return;
            if (f.size > MAX_FILE_SIZE) {
                setError(`File exceeds the ${formatBytes(MAX_FILE_SIZE)} size limit.`);
                setStatus(STATUS.ERROR);
                return;
            }
            reset();
            setFile(f);
            const existing = loadResume(f);
            if (existing) setResumeData(existing);
        },
        [reset],
    );

    // ── Drag & Drop ────────────────────────────────────────────────────────────

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 1) {
                setError("Only one file can be uploaded at a time.");
                setStatus(STATUS.ERROR);
                return;
            }
            handleFile(e.dataTransfer.files[0] ?? null);
        },
        [handleFile], // ✅ correct dep — no stale closure
    );

    // ── Upload ─────────────────────────────────────────────────────────────────

    const upload = async (resumeFrom?: ResumeData) => {
        if (!file) return;

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setStatus(STATUS.UPLOADING);
        setError(null);
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
            setElapsed(Date.now() - (startTimeRef.current ?? Date.now()));
        }, 500);

        try {
            let uploadId: string;
            let startOffset: number;

            if (resumeFrom) {
                uploadId = resumeFrom.uploadId;
                startOffset = resumeFrom.offset;
                uploadIdRef.current = uploadId;
                setUploadedBytes(startOffset);
                setProgress(Math.round((startOffset / file.size) * 100));
            } else {
                // Init new session
                const initRes = await fetch(`${API_BASE}/init`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileName: file.name, totalSize: file.size }),
                    signal: controller.signal,
                });
                if (!initRes.ok) {
                    const body = await initRes.json().catch(() => ({}) as { message?: string });
                    throw new Error((body as { message?: string }).message ?? "Failed to initialize upload session");
                }
                const { uploadId: id } = (await initRes.json()) as { uploadId: string };
                uploadId = id;
                startOffset = 0;
                uploadIdRef.current = uploadId;
                saveResume(file, { uploadId, offset: 0, fileName: file.name, fileSize: file.size });
            }

            // ── Build the full chunk list ──────────────────────────────────────────
            interface ChunkDescriptor { offset: number; end: number }
            const allChunks: ChunkDescriptor[] = [];
            for (let o = startOffset; o < file.size; o += CHUNK_SIZE) {
                allChunks.push({ offset: o, end: Math.min(o + CHUNK_SIZE, file.size) });
            }

            // bytes confirmed delivered to server (cumulative, includes resumed part)
            let confirmedBytes = startOffset;

            // ── Process chunks in parallel batches of CONCURRENCY ─────────────────
            for (let b = 0; b < allChunks.length; b += CONCURRENCY) {
                if (controller.signal.aborted) break;

                const batch = allChunks.slice(b, b + CONCURRENCY);
                const isLastBatch = b + CONCURRENCY >= allChunks.length;

                setActiveChunks(batch.length);

                // Fire all chunks in this batch simultaneously
                const results = await Promise.all(
                    batch.map(async ({ offset, end }) => {
                        const chunk = file.slice(offset, end);
                        const res = await sendChunk(uploadId, offset, end, chunk, file.size, controller.signal);
                        return { offset, end, res };
                    }),
                );

                setActiveChunks(0);

                // After the batch, all chunks up to the max end are confirmed
                const batchMaxEnd = Math.max(...results.map((r) => r.end));
                confirmedBytes = batchMaxEnd;

                const elapsedSecs = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000; // ✅ no shadowing
                const newBytesSentThisSession = confirmedBytes - startOffset;
                const bps = elapsedSecs > 0 ? newBytesSentThisSession / elapsedSecs : 0;
                const etaMs = bps > 0 ? ((file.size - confirmedBytes) / bps) * 1000 : null;

                setProgress(Math.round((confirmedBytes / file.size) * 100));
                setUploadedBytes(confirmedBytes);
                setSpeed(bps);
                setEta(etaMs);
                saveResume(file, { uploadId, offset: confirmedBytes, fileName: file.name, fileSize: file.size });

                if (isLastBatch) {
                    // Parse the response from the last chunk (largest offset = completion trigger)
                    const lastResult = results.reduce((a, r) => (r.offset > a.offset ? r : a));
                    const data = await lastResult.res.json().catch(() => null) as UploadResult | null;
                    clearInterval(timerRef.current!);
                    setElapsed(Date.now() - (startTimeRef.current ?? Date.now()));
                    setEta(null);
                    setStatus(STATUS.DONE);
                    setResult(data);
                    clearResume(file);
                    return;
                }
            }

            // Reached if aborted mid-loop
            if (controller.signal.aborted) {
                await fetch(`${API_BASE}/${uploadId}`, { method: "DELETE" }).catch(() => { });
                clearResume(file);
                clearInterval(timerRef.current!);
                setStatus(STATUS.CANCELLED);
            }
        } catch (err) {
            clearInterval(timerRef.current!);
            setActiveChunks(0);
            if ((err as Error).name !== "AbortError") {
                setError((err as Error).message);
                setStatus(STATUS.ERROR);
            }
        }
    };

    // ── Cancel ─────────────────────────────────────────────────────────────────

    const cancel = () => {
        abortControllerRef.current?.abort(); // immediately kills all in-flight fetches
    };

    // ── Derived state ──────────────────────────────────────────────────────────

    const isDone = status === STATUS.DONE;
    const isUploading = status === STATUS.UPLOADING;
    const isError = status === STATUS.ERROR;
    const isCancelled = status === STATUS.CANCELLED;
    const totalChunks = file ? Math.ceil(file.size / CHUNK_SIZE) : 0;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerIcon}>⬆</div>
                    <div>
                        <h1 style={styles.title}>File Upload</h1>
                        <p style={styles.subtitle}>Chunked · Resumable · Fast</p>
                    </div>
                </div>

                {/* Drop zone */}
                {!file && !isError && (
                    <div
                        style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDragging : {}) }}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Drop file here or click to browse"
                        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                        />
                        <div style={styles.dropIcon}>{dragging ? "📂" : "📁"}</div>
                        <p style={styles.dropText}>
                            Drop file here or <span style={styles.dropLink}>browse</span>
                        </p>
                        <p style={styles.dropHint}>Any file type · Max {formatBytes(MAX_FILE_SIZE)}</p>
                    </div>
                )}

                {/* File info */}
                {file && (
                    <div style={styles.fileCard}>
                        <div style={styles.fileIcon}>{getFileIcon(file.name)}</div>
                        <div style={styles.fileMeta}>
                            <p style={styles.fileName}>{file.name}</p>
                            <p style={styles.fileSize}>{formatBytes(file.size)}</p>
                        </div>
                        {status === STATUS.IDLE && (
                            <button style={styles.removeBtn} onClick={reset} aria-label="Remove file">✕</button>
                        )}
                    </div>
                )}

                {/* Resume banner */}
                {resumeData && status === STATUS.IDLE && (
                    <div style={styles.resumeBanner}>
                        <span>⏸ Previous upload found — </span>
                        <strong>{Math.round((resumeData.offset / resumeData.fileSize) * 100)}%</strong>
                        <span> already uploaded</span>
                    </div>
                )}

                {/* Progress */}
                {(isUploading || isDone) && (
                    <div style={styles.progressSection}>
                        <div style={styles.progressBar}>
                            <div
                                style={{
                                    ...styles.progressFill,
                                    width: `${progress}%`,
                                    background: isDone
                                        ? "linear-gradient(90deg, #10b981, #059669)"
                                        : "linear-gradient(90deg, #3b82f6, #6366f1)",
                                }}
                            />
                        </div>
                        <div style={styles.progressStats}>
                            <span style={styles.progressPct}>{progress}%</span>
                            <span style={styles.progressDetail}>
                                {formatBytes(uploadedBytes)} / {file && formatBytes(file.size)}
                            </span>
                            {isUploading && (
                                <>
                                    <span style={styles.progressDetail}>
                                        {formatBytes(speed)}/s · {formatDuration(elapsed)} elapsed
                                    </span>
                                    {eta !== null && eta > 500 && (
                                        <span style={styles.progressDetail}>~{formatDuration(eta)} left</span>
                                    )}
                                    {activeChunks > 1 && (
                                        <span style={styles.parallelBadge}>
                                            ⚡ {activeChunks} parallel
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Status messages */}
                {isDone && (
                    <div style={styles.successBox}>
                        <span style={styles.successIcon}>✓</span>
                        <div>
                            <p style={styles.successTitle}>Upload Complete</p>
                            <p style={styles.successSub}>
                                {file?.name} · {formatBytes(file?.size ?? 0)} · {formatDuration(elapsed)}
                            </p>
                            {result?.filePath && (
                                <p style={styles.successPath}>Saved to: {result.filePath}</p>
                            )}
                        </div>
                    </div>
                )}

                {isError && (
                    <div style={styles.errorBox}>
                        <span style={styles.errorIcon}>✕</span>
                        <div>
                            <p style={styles.errorTitle}>Upload Failed</p>
                            <p style={styles.errorSub}>{error}</p>
                        </div>
                    </div>
                )}

                {isCancelled && (
                    <div style={styles.cancelBox}>
                        <span>⚠</span>
                        <p style={styles.cancelText}>Upload cancelled</p>
                    </div>
                )}

                {/* Action buttons */}
                <div style={styles.actions}>
                    {status === STATUS.IDLE && file && !resumeData && (
                        <button style={styles.primaryBtn} onClick={() => upload()}>
                            Upload File
                        </button>
                    )}
                    {status === STATUS.IDLE && file && resumeData && (
                        <>
                            <button style={styles.primaryBtn} onClick={() => upload(resumeData)}>
                                Resume Upload
                            </button>
                            <button
                                style={styles.secondaryBtn}
                                onClick={() => { clearResume(file); setResumeData(null); upload(); }}
                            >
                                Restart
                            </button>
                        </>
                    )}
                    {isUploading && (
                        <button style={styles.dangerBtn} onClick={cancel}>
                            Cancel Upload
                        </button>
                    )}
                    {(isDone || isError || isCancelled) && (
                        <button style={styles.secondaryBtn} onClick={reset}>
                            Upload Another
                        </button>
                    )}
                </div>

                {/* Chunk info pill */}
                {file && (
                    <div style={styles.chunkInfo}>
                        <span style={styles.chunkPill}>
                            {totalChunks} chunk{totalChunks !== 1 ? "s" : ""} · {formatBytes(CHUNK_SIZE)} each ·
                            up to {CONCURRENCY}× parallel · max {MAX_RETRIES} retries
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── File icon helper ─────────────────────────────────────────────────────────

function getFileIcon(name: string): string {
    const ext = name.split(".").pop()?.toLowerCase() ?? ""; // ✅ safe pop()
    const map: Record<string, string> = {
        apk: "📦",
        pdf: "📄",
        zip: "🗜", tar: "🗜", gz: "🗜",
        mp4: "🎬", mov: "🎬", avi: "🎬", mkv: "🎬",
        mp3: "🎵", wav: "🎵", flac: "🎵",
        jpg: "🖼", jpeg: "🖼", png: "🖼", gif: "🖼", webp: "🖼",
        xlsx: "📊", xls: "📊", csv: "📊",
        docx: "📝", doc: "📝", txt: "📝",
        json: "🔧", xml: "🔧", yml: "🔧", yaml: "🔧",
    };
    return map[ext] ?? "📎";
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#0f0f13",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "24px",
    },
    card: {
        background: "#18181f",
        border: "1px solid #2a2a35",
        borderRadius: "20px",
        padding: "36px",
        width: "100%",
        maxWidth: "520px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
    },
    header: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" },
    headerIcon: {
        width: "44px", height: "44px", borderRadius: "12px",
        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", color: "#fff",
    },
    title: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#f1f1f5", letterSpacing: "-0.3px" },
    subtitle: { margin: "2px 0 0", fontSize: "12px", color: "#6b6b80", letterSpacing: "0.5px", textTransform: "uppercase" },
    dropzone: {
        border: "2px dashed #2a2a35", borderRadius: "14px", padding: "40px 24px",
        textAlign: "center", cursor: "pointer", transition: "all 0.2s",
        marginBottom: "20px", background: "#0f0f13",
    },
    dropzoneDragging: { borderColor: "#3b82f6", background: "rgba(59,130,246,0.05)" },
    dropIcon: { fontSize: "40px", marginBottom: "12px" },
    dropText: { color: "#9090a8", fontSize: "15px", margin: "0 0 6px" },
    dropLink: { color: "#3b82f6", fontWeight: "600" },
    dropHint: { color: "#4a4a5a", fontSize: "12px", margin: 0 },
    fileCard: {
        display: "flex", alignItems: "center", gap: "12px",
        background: "#0f0f13", border: "1px solid #2a2a35",
        borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
    },
    fileIcon: { fontSize: "28px" },
    fileMeta: { flex: 1, minWidth: 0 },
    fileName: { margin: 0, fontSize: "14px", fontWeight: "600", color: "#e0e0ee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    fileSize: { margin: "3px 0 0", fontSize: "12px", color: "#6b6b80" },
    removeBtn: { background: "none", border: "none", color: "#6b6b80", cursor: "pointer", fontSize: "16px", padding: "4px", lineHeight: 1 },
    resumeBanner: {
        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: "10px", padding: "10px 14px", marginBottom: "16px",
        fontSize: "13px", color: "#a5b4fc",
    },
    progressSection: { marginBottom: "20px" },
    progressBar: { height: "6px", background: "#2a2a35", borderRadius: "99px", overflow: "hidden", marginBottom: "10px" },
    progressFill: { height: "100%", borderRadius: "99px", transition: "width 0.3s ease" },
    progressStats: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },
    progressPct: { fontSize: "14px", fontWeight: "700", color: "#f1f1f5" },
    progressDetail: { fontSize: "12px", color: "#6b6b80" },
    parallelBadge: {
        fontSize: "11px", color: "#3b82f6",
        background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: "99px", padding: "2px 8px", letterSpacing: "0.2px",
    },
    successBox: {
        display: "flex", gap: "12px", alignItems: "flex-start",
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
    },
    successIcon: {
        width: "24px", height: "24px", borderRadius: "50%", background: "#10b981",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", flexShrink: 0, lineHeight: "24px", textAlign: "center",
    },
    successTitle: { margin: 0, fontSize: "14px", fontWeight: "600", color: "#10b981" },
    successSub: { margin: "3px 0 0", fontSize: "12px", color: "#6b6b80" },
    successPath: { margin: "4px 0 0", fontSize: "11px", color: "#4a4a5a", fontFamily: "monospace" },
    errorBox: {
        display: "flex", gap: "12px", alignItems: "flex-start",
        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
    },
    errorIcon: {
        width: "24px", height: "24px", borderRadius: "50%", background: "#ef4444",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", flexShrink: 0, lineHeight: "24px", textAlign: "center",
    },
    errorTitle: { margin: 0, fontSize: "14px", fontWeight: "600", color: "#ef4444" },
    errorSub: { margin: "3px 0 0", fontSize: "12px", color: "#6b6b80" },
    cancelBox: {
        display: "flex", gap: "10px", alignItems: "center",
        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
        color: "#f59e0b", fontSize: "14px",
    },
    cancelText: { margin: 0, fontWeight: "500" },
    actions: { display: "flex", gap: "10px" },
    primaryBtn: {
        flex: 1, padding: "13px", borderRadius: "10px", border: "none",
        background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff",
        fontSize: "14px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.2px",
    },
    dangerBtn: {
        flex: 1, padding: "13px", borderRadius: "10px",
        border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)",
        color: "#ef4444", fontSize: "14px", fontWeight: "600", cursor: "pointer",
    },
    secondaryBtn: {
        flex: 1, padding: "13px", borderRadius: "10px", border: "1px solid #2a2a35",
        background: "transparent", color: "#9090a8", fontSize: "14px", fontWeight: "600", cursor: "pointer",
    },
    chunkInfo: { marginTop: "16px", textAlign: "center" },
    chunkPill: {
        fontSize: "11px", color: "#4a4a5a", background: "#0f0f13",
        border: "1px solid #2a2a35", borderRadius: "99px",
        padding: "4px 12px", letterSpacing: "0.3px",
    },
};