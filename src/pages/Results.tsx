import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { useStore } from "@/store";

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
    return { success: false, error: "下载失败" };
  }
}

const reportStatusMap: Record<string, { label: string; color: string }> = {
  generating: { label: "生成中", color: "text-geo-warning" },
  ready: { label: "已生成", color: "text-geo-success" },
  none: { label: "未生成", color: "text-geo-muted" },
};

export default function Results() {
  const navigate = useNavigate();
  const { results, fetchResults } = useStore();
  const [downloadMsg, setDownloadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    if (downloadMsg) {
      const t = setTimeout(() => setDownloadMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [downloadMsg]);

  const handleDownloadReport = async (taskId: string) => {
    const r = await downloadFile(`/api/results/${taskId}/report-pdf`, `report_${taskId}.pdf`);
    if (r.success) {
      setDownloadMsg({ type: "success", text: "下载成功" });
    } else {
      setDownloadMsg({ type: "error", text: r.error || "下载失败，请稍后重试" });
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

      <h1 className="text-xl font-semibold text-geo-text">成果管理</h1>

      <div className="gradient-card rounded-lg border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">任务名称</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">测区</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">完成时间</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">最终拟合差</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">迭代次数</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">报告状态</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const rs = reportStatusMap[result.reportStatus];
              return (
                <tr key={result.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-geo-text">{result.taskName}</td>
                  <td className="px-5 py-3 text-sm text-geo-text-secondary">{result.surveyArea}</td>
                  <td className="px-5 py-3 text-sm text-geo-text-secondary">{result.created}</td>
                  <td className="px-5 py-3 text-sm font-mono text-geo-accent">{result.finalMisfit ?? "-"}</td>
                  <td className="px-5 py-3 text-sm font-mono text-geo-text-secondary">{result.totalIterations ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm ${rs.color}`}>{rs.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/results/${result.id}`)}
                        className="flex items-center gap-1 text-sm text-geo-accent hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> 查看
                      </button>
                      <button
                        onClick={() => handleDownloadReport(result.taskId || result.id)}
                        className="flex items-center gap-1 text-sm text-geo-text-secondary hover:text-geo-text"
                      >
                        <FileText className="w-3.5 h-3.5" /> 下载报告
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-geo-muted">暂无成果数据</div>
        )}
      </div>
    </div>
  );
}
