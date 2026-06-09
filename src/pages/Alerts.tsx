import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, X as XIcon, Filter, AlertCircle, Bell } from "lucide-react";
import { useStore } from "@/store";

const levelOptions = [
  { value: "", label: "全部级别" },
  { value: "warning", label: "警告" },
  { value: "critical", label: "严重" },
];

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "unprocessed", label: "未处理" },
  { value: "processed", label: "已处理" },
];

const defaultAreas = ["青藏高原东缘测区", "华北克拉通测区", "南海北部陆缘测区"];

export default function Alerts() {
  const { alerts, fetchAlerts, processAlert, dismissAlert, surveyAreaStatus, fetchSurveyAreaStatus } = useStore();
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts().then(() => fetchSurveyAreaStatus());
  }, [fetchAlerts, fetchSurveyAreaStatus]);

  const areaNames = surveyAreaStatus.length > 0
    ? surveyAreaStatus.map((s) => s.name)
    : ["青藏高原东缘测区", "华北克拉通测区", "南海北部陆缘测区"];

  useEffect(() => {
    if (actionMsg) {
      const t = setTimeout(() => setActionMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionMsg]);

  const filtered = alerts.filter((a) => {
    if (levelFilter && a.level !== levelFilter) return false;
    if (statusFilter === "unprocessed" && a.processed) return false;
    if (statusFilter === "processed" && !a.processed) return false;
    return true;
  });

  const getAreaStatus = (area: string) => {
    const found = surveyAreaStatus.find((s) => s.name === area);
    if (found) return found;
    const areaAlerts = alerts.filter((a) => a.surveyArea === area);
    const activeAlerts = areaAlerts.filter((a) => !a.processed);
    const criticalAlerts = activeAlerts.filter((a) => a.level === "critical");
    const falseAnomalyCount = activeAlerts.filter((a) => a.type === "假异常检测").length;
    return {
      name: area,
      paused: false,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      falseAnomalyCount,
    };
  };

  const handleProcess = async (id: string) => {
    setLoadingId(id);
    try {
      await processAlert(id);
      await fetchSurveyAreaStatus();
      setActionMsg({ type: "success", text: "预警已处理" });
    } catch (err: any) {
      if (err.message?.includes("暂停")) {
        await fetchSurveyAreaStatus();
        setActionMsg({ type: "success", text: "预警已处理，测区已暂停" });
      } else {
        setActionMsg({ type: "error", text: err.message || "处理失败" });
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setLoadingId(id);
    try {
      await dismissAlert(id);
      await fetchSurveyAreaStatus();
      setActionMsg({ type: "success", text: "预警已忽略" });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "操作失败" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          actionMsg.type === "success" ? "bg-geo-success/90 text-white" : "bg-geo-danger/90 text-white"
        }`}>
          {actionMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{actionMsg.text}</span>
        </div>
      )}

      <h1 className="text-xl font-semibold text-geo-text">预警管理</h1>

      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-geo-muted" />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-geo-card border border-slate-700/50 text-geo-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-geo-accent"
        >
          {levelOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-geo-card border border-slate-700/50 text-geo-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-geo-accent"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">级别</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">类型</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">预警信息</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">测区</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">时间</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">状态</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((alert) => (
              <tr key={alert.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.level === "critical"
                      ? "bg-geo-danger/20 text-geo-danger"
                      : alert.level === "warning"
                      ? "bg-geo-warning/20 text-geo-warning"
                      : "bg-blue-500/20 text-blue-300"
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                    {alert.level === "critical" ? "严重" : alert.level === "warning" ? "警告" : "信息"}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-geo-text">{alert.type}</td>
                <td className="px-5 py-3 text-sm text-geo-text-secondary max-w-xs truncate">{alert.message}</td>
                <td className="px-5 py-3 text-sm text-geo-text-secondary">
                  {alert.surveyArea}
                  {getAreaStatus(alert.surveyArea).paused && (
                    <span className="ml-1 text-xs text-geo-danger">（已暂停）</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-geo-muted">{alert.time}</td>
                <td className="px-5 py-3">
                  {alert.processed ? (
                    <span className="flex items-center gap-1 text-xs text-geo-success"><CheckCircle className="w-3 h-3" /> 已处理</span>
                  ) : (
                    <span className="text-xs text-geo-warning animate-pulse-alert">未处理</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {!alert.processed && (
                      <button
                        onClick={() => handleProcess(alert.id)}
                        disabled={loadingId === alert.id}
                        className="text-xs text-geo-success hover:underline disabled:opacity-50"
                      >
                        处理
                      </button>
                    )}
                    {!alert.processed && (
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        disabled={loadingId === alert.id}
                        className="text-xs text-geo-muted hover:text-geo-danger disabled:opacity-50"
                      >
                        忽略
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-geo-muted">暂无预警数据</div>
        )}
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">测区暂停状态</h2>
        <div className="grid grid-cols-3 gap-3">
          {areaNames.map((area) => {
            const status = getAreaStatus(area);
            return (
              <div
                key={area}
                className={`p-3 rounded-lg border ${
                  status.paused
                    ? "border-geo-danger/30 bg-geo-danger/5"
                    : "border-slate-700/30 bg-geo-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-geo-text">{area}</span>
                  {status.paused ? (
                    <span className="w-2 h-2 rounded-full bg-geo-danger animate-pulse-alert" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-geo-success" />
                  )}
                </div>
                {status.paused ? (
                  <div className="mt-1">
                    <p className="text-xs text-geo-danger flex items-center gap-1">
                      <Bell className="w-3 h-3" /> 已暂停 - 已通知首席科学家
                    </p>
                    {status.pausedReason && (
                      <p className="text-xs text-geo-text-secondary mt-0.5">{status.pausedReason}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-geo-muted mt-1">运行正常</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-geo-text-secondary">
                  <span>活跃预警：{status.activeAlerts}</span>
                  <span>严重：{status.criticalAlerts}</span>
                  <span>假异常：{status.falseAnomalyCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
