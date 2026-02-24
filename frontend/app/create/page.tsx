"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { MEETING_TEMPLATES, type MeetingTemplate } from "../data/meetingTemplates";

type ActionItem = {
  task: string;
  owner?: string;
  deadline?: string;
};

function CreateMeetingForm() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { task: "", owner: "", deadline: "" },
  ]);

  const { fetchWithAuth } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [liveTranscribing, setLiveTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveTranscribeStreamRef = useRef<MediaStream | null>(null);
  const liveChunkPromiseRef = useRef<Promise<void>>(Promise.resolve());
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const livePcmBufferRef = useRef<Float32Array[]>([]);
  const liveChunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [folderId, setFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<{ id: number; name: string; color: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth(`${API_URL}/folders`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setFolders(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      }
    }
    load();
  }, [fetchWithAuth]);

  function applyTemplate(template: MeetingTemplate) {
    setTitle(template.defaultTitle);
    setActionItems(
      template.defaultActionItems.length
        ? template.defaultActionItems.map((a) => ({
            task: a.task ?? "",
            owner: a.owner ?? "",
            deadline: a.deadline ?? "",
          }))
        : [{ task: "", owner: "", deadline: "" }]
    );
    setSelectedTemplateId(template.id);
  }

  function updateItem(index: number, field: keyof ActionItem, value: string) {
    setActionItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setActionItems((prev) => [...prev, { task: "", owner: "", deadline: "" }]);
  }

  function removeItem(index: number) {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function sendAudioForTranscription(
    blob: Blob,
    filename: string,
    opts?: { silent?: boolean }
  ) {
    if (!opts?.silent) {
      setError(null);
      setTranscribing(true);
    }
    try {
      const formData = new FormData();
      formData.append("audio", blob, filename);
      const res = await fetchWithAuth(`${API_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Transcription failed");
      const text = (data.transcript || "").trim();
      const sep = opts?.silent ? " " : "\n\n";
      setTranscript((prev) =>
        prev ? (text ? `${prev}${sep}${text}` : prev) : text
      );
      if (!opts?.silent) success("Transcription complete");
      return text;
    } catch (e: any) {
      const msg = e.message || "Transcription failed";
      if (!opts?.silent) {
        setError(msg);
        showError(msg);
      }
      throw e;
    } finally {
      if (!opts?.silent) setTranscribing(false);
    }
  }

  function createWavBlob(pcm: Float32Array, sampleRate: number): Blob {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++)
        view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);
    const int16 = new Int16Array(buffer, 44, pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  async function startLiveTranscription() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveTranscribeStreamRef.current = stream;
      const ctx = new AudioContext();
      liveAudioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      liveProcessorRef.current = processor;
      livePcmBufferRef.current = [];
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        livePcmBufferRef.current.push(new Float32Array(input));
      };
      src.connect(processor);
      processor.connect(ctx.destination);

      const CHUNK_MS = 5000;
      const sampleRate = ctx.sampleRate;
      liveChunkIntervalRef.current = setInterval(() => {
        const chunks = livePcmBufferRef.current;
        livePcmBufferRef.current = [];
        if (chunks.length === 0) return;
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Float32Array(total);
        let off = 0;
        for (const c of chunks) {
          merged.set(c, off);
          off += c.length;
        }
        if (merged.length < sampleRate * 0.5) return; // skip <0.5s
        const wav = createWavBlob(merged, sampleRate);
        liveChunkPromiseRef.current = liveChunkPromiseRef.current
          .then(() =>
            sendAudioForTranscription(wav, "chunk.wav", { silent: true })
          )
          .catch(() => {});
      }, CHUNK_MS);

      setLiveTranscribing(true);
      setError(null);
      success("Live transcription started — speak and text will appear");
    } catch (e: any) {
      setError("Microphone access denied");
      showError(e.message || "Could not access microphone");
    }
  }

  function stopLiveTranscription() {
    if (liveChunkIntervalRef.current) {
      clearInterval(liveChunkIntervalRef.current);
      liveChunkIntervalRef.current = null;
    }
    liveProcessorRef.current?.disconnect();
    liveProcessorRef.current = null;
    liveAudioContextRef.current?.close();
    liveAudioContextRef.current = null;
    liveTranscribeStreamRef.current?.getTracks().forEach((t) => t.stop());
    liveTranscribeStreamRef.current = null;
    mediaRecorderRef.current = null;
    setLiveTranscribing(false);
    success("Live transcription stopped");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendAudioForTranscription(file, file.name);
    e.target.value = "";
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: mime });
          await sendAudioForTranscription(blob, "recording.webm");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e: any) {
      setError("Microphone access denied");
      showError(e.message || "Could not access microphone");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  async function handleGenerate() {
    if (!transcript.trim()) {
      setError("Please paste a transcript first.");
      return;
    }

    try {
      setError(null);
      setGenerating(true);

      const res = await fetch(`${API_URL}/extract-action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Failed to extract action items");

      const extracted: ActionItem[] = (data?.action_items || []).map((a: any) => ({
        task: a.task ?? "",
        owner: a.owner ?? "",
        deadline: a.deadline ?? "",
      }));

      setSummary((data?.summary || "").trim());
      setActionItems(extracted.length ? extracted : [{ task: "", owner: "", deadline: "" }]);
    } catch (e: any) {
      const msg = e.message || "Generate failed";
      setError(msg);
      showError(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const cleaned = actionItems
      .map((x) => ({
        task: x.task.trim(),
        owner: x.owner?.trim() || null,
        deadline: x.deadline?.trim() || null,
      }))
      .filter((x) => x.task.length > 0);

    const res = await fetchWithAuth(`${API_URL}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        transcript,
        summary: summary.trim() || null,
        folder_id: folderId || null,
        action_items: cleaned,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.detail || "Failed to save meeting";
      setLoading(false);
      setError(msg);
      showError(msg);
      return;
    }

    setResult(data);
    success("Meeting saved!");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-pastel-cream">
      <div className="max-w-3xl mx-auto p-6">
        {/* Top header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-pastel-text-muted hover:text-pastel-accent transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-pastel-text">Create Meeting</h1>
        </div>

        {error && (
          <div className="mb-6 bg-pastel-blush border border-pastel-border rounded-xl p-4 text-red-600">
            Error: {error}
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-pastel-card rounded-xl border border-pastel-border p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Meeting template</label>
            <div className="flex flex-wrap gap-2">
              {MEETING_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedTemplateId === t.id
                      ? "border-pastel-accent bg-pastel-accent/10 text-pastel-accent"
                      : "border-pastel-border bg-pastel-cream text-pastel-text hover:bg-pastel-cream"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Folder (optional)</label>
            <select
              value={folderId ?? ""}
              onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Meeting title</label>
            <input
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream"
              placeholder="Team Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Conversation transcript</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={transcribing || liveTranscribing}
                className="px-4 py-2 rounded-lg border border-pastel-border bg-pastel-card text-pastel-text hover:bg-pastel-cream disabled:opacity-60 transition-colors text-sm font-medium"
              >
                {transcribing ? "Transcribing…" : "Upload audio"}
              </button>
              {!recording && !liveTranscribing ? (
                <>
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={transcribing}
                    className="px-4 py-2 rounded-lg border border-pastel-border bg-pastel-card text-pastel-text hover:bg-pastel-cream disabled:opacity-60 transition-colors text-sm font-medium"
                  >
                    Record
                  </button>
                  <button
                    type="button"
                    onClick={startLiveTranscription}
                    disabled={transcribing}
                    className="px-4 py-2 rounded-lg border border-pastel-border bg-pastel-card text-pastel-text hover:bg-pastel-cream disabled:opacity-60 transition-colors text-sm font-medium"
                  >
                    Live transcribe
                  </button>
                </>
              ) : liveTranscribing ? (
                <button
                  type="button"
                  onClick={stopLiveTranscription}
                  className="px-4 py-2 rounded-lg border border-pastel-accent bg-pastel-accent/10 text-pastel-accent font-medium"
                >
                  Stop live transcribe
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-lg border border-pastel-accent bg-pastel-accent/10 text-pastel-accent font-medium"
                >
                  Stop recording
                </button>
              )}
            </div>
            <textarea
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream resize-y"
              placeholder="Paste the raw conversation (e.g. Sarah: So we need to... John: Yeah I'll handle that by Friday. Sarah: Who's on design? John: Emma.)"
              rows={7}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            />
            <p className="text-xs text-pastel-text-muted">
              Paste dialogue, upload audio, record, or use Live transcribe to capture speech in real time — our AI converts it into clear notes and action items.
            </p>
          </div>
        </div>

        {summary && (
          <div className="bg-pastel-card rounded-xl border border-pastel-border p-5 shadow-sm space-y-2">
            <label className="font-medium text-pastel-text">Meeting notes (summary)</label>
            <textarea
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream resize-y min-h-[120px]"
              placeholder="Generated notes will appear here..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
            />
          </div>
        )}

        <div className="bg-pastel-card rounded-xl border border-pastel-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-pastel-text">Action items</h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-lg border border-pastel-border bg-pastel-card text-pastel-text hover:bg-pastel-cream disabled:opacity-60 transition-colors"
                title="Convert conversation into notes and action items"
              >
                {generating ? "Converting..." : "✨ Convert to notes"}
              </button>

              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 rounded-lg border border-pastel-border hover:bg-pastel-cream text-pastel-text transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {actionItems.map((item, idx) => (
              <div key={idx} className="border border-pastel-border rounded-lg p-3 bg-pastel-cream">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <input
                    className="border border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card md:col-span-6"
                    placeholder="Task (required)"
                    value={item.task}
                    onChange={(e) => updateItem(idx, "task", e.target.value)}
                  />

                  <input
                    className="border border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card md:col-span-3"
                    placeholder="Owner"
                    value={item.owner || ""}
                    onChange={(e) => updateItem(idx, "owner", e.target.value)}
                  />

                  <input
                    className="border border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card md:col-span-2"
                    placeholder="Deadline"
                    value={item.deadline || ""}
                    onChange={(e) => updateItem(idx, "deadline", e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="md:col-span-1 border border-pastel-border rounded-lg h-10 w-10 flex items-center justify-center hover:bg-pastel-cream text-pastel-text-muted transition-colors"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-pastel-text-muted">
            Tip: Click <span className="font-medium text-pastel-text">Convert to notes</span> to turn your
            conversation into a summary and action items. You can edit both before saving.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-pastel-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving..." : "Save Meeting"}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-6 rounded-xl border border-pastel-border bg-pastel-cream text-center">
          <h2 className="text-xl font-semibold text-pastel-text">Meeting saved!</h2>
          <p className="mt-2 text-pastel-text-muted">
            Your meeting &quot;{result.title}&quot; has been saved.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href={`/meetings/${result.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-pastel-accent text-white px-5 py-2.5 font-medium hover:bg-pastel-accent-hover transition-colors"
            >
              View meeting
            </Link>
            <Link
              href="/meetings"
              className="inline-flex items-center justify-center rounded-lg border border-pastel-border px-5 py-2.5 font-medium text-pastel-text hover:bg-pastel-cream transition-colors"
            >
              All meetings
            </Link>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

export default function CreateMeeting() {
  return (
    <RequireAuth>
      <CreateMeetingForm />
    </RequireAuth>
  );
}
