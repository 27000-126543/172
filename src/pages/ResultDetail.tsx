import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "@/store";

const confidenceData = Array.from({ length: 20 }, (_, i) => ({
  depth: (i + 1) * 50,
  upper: 3.5 - i * 0.08 + Math.random() * 0.3,
  mean: 2.8 - i * 0.1 + Math.random() * 0.1,
  lower: 2.1 - i * 0.12 + Math.random() * 0.3,
}));

const depthSlices = [
  { depth: "0-200m", gradient: "from-blue-900 via-green-700 to-yellow-600" },
  { depth: "200-500m", gradient: "from-green-800 via-yellow-600 to-red-500" },
  { depth: "500-1000m", gradient: "from-yellow-700 via-red-600 to-purple-700" },
  { depth: "1000-2000m", gradient: "from-red-800 via-purple-700 to-blue-900" },
  { depth: "2000-5000m", gradient: "from-purple-900 via-blue-800 to-slate-900" },
];

async function downloadFile(url: string, filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("下载失败");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
    return { success: true };
  } catch {
    return { success: false, error: "下载失败，请稍后重试" };
  }
}

export default function ResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { results } = useStore();
  const [downloadMsg, setDownloadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const result = results.find((r) => r.id === id);
  const taskId = result?.taskId || id || "";

  useEffect(() => {
    if (downloadMsg) {
      const t = setTimeout(() => setDownloadMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [downloadMsg]);

  const handleDownload = async (url: string, filename: string) => {
    const r = await downloadFile(url, filename);
    if (r.success) {
      setDownloadMsg({ type: "success", text: "下载成功" });
    } else {
      setDownloadMsg({ type: "error", text: r.error || "下载失败" });
    }
  };

  return (
    <div className="space-y-6">
      {downloadMsg && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          downloadMsg.type === "success" ? "bg-geo-success/90 text-white" : "bg-geo-danger/90 text-white"
        }`}>
          {downloadMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{downloadMsg.text}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/results")}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-geo-text-secondary hover:text-geo-text"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-geo-text">反演成果详情</h1>
          <p className="text-sm text-geo-text-secondary mt-1">
            成果编号：{id}{result ? ` | 任务：${result.taskName}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-geo-accent" />
            电阻率深度切片
          </h2>
          <div className="space-y-2">
            {depthSlices.map((slice) => (
              <div key={slice.depth}>
                <div className="flex items-center justify-between text-xs text-geo-text-secondary mb-1">
                  <span>{slice.depth}</span>
                  <span className="font-mono">Ω·m</span>
                </div>
                <div className={`h-10 rounded-lg bg-gradient-to-r ${slice.gradient} opacity-80`} />
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-geo-muted mt-2">
              <span>低电阻率</span>
              <div className="flex-1 mx-2 h-1.5 bg-gradient-to-r from-blue-900 via-yellow-600 to-red-500 rounded-full" />
              <span>高电阻率</span>
            </div>
          </div>
        </div>

        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-geo-accent" />
            灵敏度分布
          </h2>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }, (_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const intensity = Math.max(
                0.1,
                Math.min(1, 0.3 + (col < 3 ? 0.4 - row * 0.1 : 0.1 + row * 0.05))
              );
              return (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{ backgroundColor: `rgba(232, 112, 42, ${intensity})` }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-geo-muted mt-3">
            <span>低灵敏度</span>
            <div className="flex-1 mx-2 h-1.5 bg-gradient-to-r from-geo-accent/20 to-geo-accent rounded-full" />
            <span>高灵敏度</span>
          </div>
          <div className="mt-4 text-xs text-geo-text-secondary space-y-1">
            <p>测线方向：东西向（5列）</p>
            <p>深度分层：5层</p>
            <p>最大灵敏度区域：浅层中部</p>
          </div>
        </div>
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">置信区间分布</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={confidenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="depth" tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" label={{ value: "深度 (m)", position: "insideBottom", offset: -5, fill: "#94A3B8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" label={{ value: "log10(ρ) Ω·m", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: "#152238", border: "1px solid #334155", borderRadius: "8px", color: "#E2E8F0" }} />
            <Area type="monotone" dataKey="upper" stroke="transparent" fill="rgba(232, 112, 42, 0.1)" name="上界" />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="#0A1628" name="下界" />
            <Area type="monotone" dataKey="mean" stroke="#E8702A" strokeWidth={2} fill="rgba(232, 112, 42, 0.2)" name="均值" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">数据导出</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownload(`/api/results/${taskId}/report-pdf`, `report_${taskId}.pdf`)}
            className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            <FileText className="w-4 h-4" /> 下载报告
          </button>
          <button
            onClick={() => handleDownload(`/api/results/${taskId}/export-line`, `survey_line_${taskId}.csv`)}
            className="flex items-center gap-2 px-4 py-2 bg-geo-secondary border border-slate-700/50 rounded-lg text-sm text-geo-text hover:bg-slate-700/50 transition-colors"
          >
            <Download className="w-4 h-4" /> 按测线导出
          </button>
          <button
            onClick={() => handleDownload(`/api/results/${taskId}/export-frequency`, `frequency_${taskId}.csv`)}
            className="flex items-center gap-2 px-4 py-2 bg-geo-secondary border border-slate-700/50 rounded-lg text-sm text-geo-text hover:bg-slate-700/50 transition-colors"
          >
            <Download className="w-4 h-4" /> 按频段导出
          </button>
          <button
            onClick={() => handleDownload(`/api/results/${taskId}/export-curve`, `inversion_curve_${taskId}.csv`)}
            className="flex items-center gap-2 px-4 py-2 bg-geo-secondary border border-slate-700/50 rounded-lg text-sm text-geo-text hover:bg-slate-700/50 transition-colors"
          >
            <Download className="w-4 h-4" /> 导出反演曲线
          </button>
        </div>
      </div>
    </div>
  );
}
