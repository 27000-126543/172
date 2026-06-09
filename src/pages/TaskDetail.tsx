import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  Activity,
  TrendingDown,
  Shield,
  AlertTriangle,
  Zap,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore, type TaskStatus } from "@/store";
import StatusBadge from "@/components/StatusBadge";

const statusFlow: { key: TaskStatus; label: string }[] = [
  { key: "pending_check", label: "待审核" },
  { key: "preprocessing", label: "预处理" },
  { key: "impedance_calc", label: "阻抗计算" },
  { key: "inversion_iter", label: "反演迭代" },
  { key: "image_gen", label: "成图生成" },
  { key: "completed", label: "已完成" },
];

function getStatusIndex(status: TaskStatus): number {
  if (status === "rollback") return 3;
  return statusFlow.findIndex((s) => s.key === status);
}

const algorithmOptions = [
  { value: "Occam反演", label: "Occam反演" },
  { value: "NLCG反演", label: "NLCG反演" },
  { value: "RRI反演", label: "RRI反演" },
  { value: "Rebocc反演", label: "Rebocc反演" },
];

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentTask,
    iterationData,
    regAdjustments,
    algorithmSwitches,
    alerts,
    fetchTask,
    adjustRegularization,
    switchAlgorithm,
    advanceTask,
    rollbackTask,
    fetchRegAdjustments,
    fetchAlgorithmSwitches,
    fetchAlerts,
  } = useStore();

  const [regValue, setRegValue] = useState("");
  const [regReason, setRegReason] = useState("");
  const [algoValue, setAlgoValue] = useState("Occam反演");
  const [algoReason, setAlgoReason] = useState("");
  const [showAlgoModal, setShowAlgoModal] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchTask(id);
      fetchRegAdjustments(id);
      fetchAlgorithmSwitches(id);
      fetchAlerts();
    }
  }, [id, fetchTask, fetchRegAdjustments, fetchAlgorithmSwitches, fetchAlerts]);

  useEffect(() => {
    if (currentTask) {
      setRegValue(String(currentTask.regularization || ""));
    }
  }, [currentTask?.regularization]);

  useEffect(() => {
    if (actionMsg) {
      const t = setTimeout(() => setActionMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionMsg]);

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center h-64 text-geo-muted">加载中...</div>
    );
  }

  const canControl = currentTask.status === "inversion_iter";
  const canAdvance = currentTask.status !== "completed" && currentTask.status !== "rollback";
  const currentIdx = getStatusIndex(currentTask.status);
  const taskAlerts = alerts.filter((a) => a.taskId === currentTask.id);

  const nextStatus = (): string | null => {
    const idx = statusFlow.findIndex((s) => s.key === currentTask.status);
    if (idx >= 0 && idx < statusFlow.length - 1) {
      return statusFlow[idx + 1].key;
    }
    return null;
  };

  const handleAdjustReg = async () => {
    if (!id) return;
    const val = parseFloat(regValue);
    if (isNaN(val)) { setActionMsg({ type: "error", text: "请输入有效的正则化参数" }); return; }
    if (!regReason.trim()) { setActionMsg({ type: "error", text: "请输入调整原因" }); return; }
    try {
      await adjustRegularization(id, val, regReason.trim());
      setRegReason("");
      setActionMsg({ type: "success", text: "正则化参数调整成功" });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "调整失败" });
    }
  };

  const handleSwitchAlgo = async () => {
    if (!id) return;
    if (!algoReason.trim()) { setActionMsg({ type: "error", text: "请输入切换原因" }); return; }
    try {
      await switchAlgorithm(id, algoValue, algoReason.trim());
      setShowAlgoModal(false);
      setAlgoReason("");
      setActionMsg({ type: "success", text: "算法切换成功" });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "切换失败" });
    }
  };

  const handleAdvance = async () => {
    if (!id) return;
    const next = nextStatus();
    if (!next) { setActionMsg({ type: "error", text: "任务已完成，无法继续" }); return; }
    try {
      await advanceTask(id, next);
      setActionMsg({ type: "success", text: "任务已推进至下一阶段" });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "推进失败" });
    }
  };

  const handleRollback = async () => {
    if (!id) return;
    try {
      await rollbackTask(id);
      setActionMsg({ type: "success", text: "任务已回滚" });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "回滚失败" });
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

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/tasks")}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-geo-text-secondary hover:text-geo-text"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-geo-text">{currentTask.name}</h1>
            <StatusBadge status={currentTask.status} />
          </div>
          <p className="text-sm text-geo-text-secondary mt-1">
            测区：{currentTask.surveyArea} | 创建时间：{currentTask.created}
          </p>
        </div>
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">处理流程</h2>
        <div className="flex items-center">
          {statusFlow.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    idx < currentIdx
                      ? "bg-geo-success text-white"
                      : idx === currentIdx
                      ? "bg-geo-accent text-white border-glow"
                      : "bg-slate-700 text-geo-muted"
                  }`}
                >
                  {idx < currentIdx ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    idx <= currentIdx ? "text-geo-text" : "text-geo-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < statusFlow.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${
                    idx < currentIdx ? "bg-geo-success" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4">迭代收敛曲线</h2>
          {iterationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={iterationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="iteration" tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" label={{ value: "迭代次数", position: "insideBottom", offset: -5, fill: "#94A3B8", fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" label={{ value: "拟合差", angle: -90, position: "insideLeft", fill: "#E8702A", fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" label={{ value: "粗糙度", angle: 90, position: "insideRight", fill: "#22C55E", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#152238", border: "1px solid #334155", borderRadius: "8px", color: "#E2E8F0" }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="misfit" name="拟合差" stroke="#E8702A" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="roughness" name="粗糙度" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-geo-muted text-sm">暂无迭代数据</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
            <h2 className="text-sm font-medium text-geo-text mb-3">当前迭代信息</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-geo-text-secondary">当前迭代</span>
                <span className="text-sm font-mono text-geo-text">{currentTask.iteration}/{currentTask.maxIteration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-geo-text-secondary flex items-center gap-1"><TrendingDown className="w-3 h-3" /> 拟合差</span>
                <span className="text-sm font-mono text-geo-accent">{currentTask.misfit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-geo-text-secondary flex items-center gap-1"><Activity className="w-3 h-3" /> 粗糙度</span>
                <span className="text-sm font-mono text-geo-success">{currentTask.roughness}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-geo-text-secondary">算法</span>
                <span className="text-sm text-geo-text">{currentTask.algorithm || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-geo-text-secondary">正则化</span>
                <span className="text-sm font-mono text-geo-accent">{currentTask.regularization ?? "-"}</span>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-geo-accent rounded-full transition-all"
                  style={{ width: `${(currentTask.iteration / currentTask.maxIteration) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
            <h2 className="text-sm font-medium text-geo-text mb-3">手动控制</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-geo-text-secondary block mb-1">正则化参数</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={regValue}
                    onChange={(e) => setRegValue(e.target.value)}
                    disabled={!canControl}
                    className="flex-1 bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent disabled:opacity-50"
                  />
                  <button
                    onClick={handleAdjustReg}
                    disabled={!canControl}
                    className="px-3 py-1.5 gradient-accent text-white text-xs rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    应用
                  </button>
                </div>
                <input
                  type="text"
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="调整原因"
                  disabled={!canControl}
                  className="mt-1.5 w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted disabled:opacity-50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdvance}
                  disabled={!canAdvance}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-geo-secondary border border-slate-700/50 rounded-lg text-xs text-geo-text hover:bg-slate-700/50 disabled:opacity-50"
                >
                  <Play className="w-3 h-3" /> 继续
                </button>
                <button
                  onClick={handleRollback}
                  disabled={currentTask.status === "completed" || currentTask.status === "rollback"}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-geo-secondary border border-slate-700/50 rounded-lg text-xs text-geo-text hover:bg-slate-700/50 disabled:opacity-50"
                >
                  <Pause className="w-3 h-3" /> 回滚
                </button>
              </div>
              <button
                onClick={() => setShowAlgoModal(true)}
                disabled={!canControl}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-geo-secondary border border-slate-700/50 rounded-lg text-xs text-geo-text hover:bg-slate-700/50 disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" /> 切换算法
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-geo-accent" />
            正则化调整记录
          </h2>
          {regAdjustments.length > 0 ? (
            <div className="space-y-3">
              {regAdjustments.map((adj: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1.5 bg-geo-accent" />
                    {i < regAdjustments.length - 1 && <div className="w-px h-full bg-slate-700/50" />}
                  </div>
                  <div>
                    <p className="text-sm text-geo-text">
                      正则化参数从 {adj.fromValue ?? adj.previousValue ?? "-"} 调整至 {adj.toValue ?? adj.value ?? "-"}
                    </p>
                    {adj.reason && <p className="text-xs text-geo-text-secondary mt-0.5">原因：{adj.reason}</p>}
                    <p className="text-xs text-geo-muted mt-0.5">{adj.createdAt ? adj.createdAt.split("T").join(" ").substring(0, 16) : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-geo-muted text-center py-4">暂无调整记录</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
            <h2 className="text-sm font-medium text-geo-text mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-geo-warning" />
              预警历史
            </h2>
            {taskAlerts.length > 0 ? (
              <div className="space-y-3">
                {taskAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${
                      alert.level === "critical"
                        ? "bg-geo-danger/10 border border-geo-danger/20"
                        : "bg-geo-warning/10 border border-geo-warning/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="w-3 h-3 text-geo-danger" />
                      <span className={alert.level === "critical" ? "text-geo-danger" : "text-geo-warning"}>{alert.type}</span>
                      <span className="text-geo-muted ml-auto">{alert.time}</span>
                    </div>
                    <p className="text-sm text-geo-text mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-geo-muted text-center py-4">暂无预警记录</p>
            )}
          </div>

          {algorithmSwitches.length > 0 && (
            <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
              <h2 className="text-sm font-medium text-geo-text mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-geo-accent" />
                算法切换记录
              </h2>
              <div className="space-y-3">
                {algorithmSwitches.map((sw: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5 bg-geo-accent" />
                      {i < algorithmSwitches.length - 1 && <div className="w-px h-full bg-slate-700/50" />}
                    </div>
                    <div>
                      <p className="text-sm text-geo-text">
                        从 {sw.fromAlgorithm ?? sw.previousAlgorithm ?? "-"} 切换至 {sw.toAlgorithm ?? sw.algorithm ?? "-"}
                      </p>
                      {sw.reason && <p className="text-xs text-geo-text-secondary mt-0.5">原因：{sw.reason}</p>}
                      <p className="text-xs text-geo-muted mt-0.5">{sw.createdAt ? sw.createdAt.split("T").join(" ").substring(0, 16) : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAlgoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-geo-card border border-slate-700/50 rounded-xl w-[420px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-geo-text">切换算法</h2>
              <button onClick={() => setShowAlgoModal(false)} className="text-geo-muted hover:text-geo-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-geo-text-secondary block mb-1">当前算法</label>
                <p className="text-sm text-geo-text font-mono">{currentTask.algorithm || "-"}</p>
              </div>
              <div>
                <label className="text-xs text-geo-text-secondary block mb-1">目标算法</label>
                <select
                  value={algoValue}
                  onChange={(e) => setAlgoValue(e.target.value)}
                  className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent"
                >
                  {algorithmOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-geo-text-secondary block mb-1">切换原因</label>
                <textarea
                  value={algoReason}
                  onChange={(e) => setAlgoReason(e.target.value)}
                  placeholder="请输入切换原因"
                  rows={2}
                  className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted resize-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowAlgoModal(false)}
                className="px-4 py-2 text-sm text-geo-text-secondary hover:text-geo-text border border-slate-700/50 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSwitchAlgo}
                className="px-4 py-2 text-sm gradient-accent text-white rounded-lg hover:opacity-90"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
