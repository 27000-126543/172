import { useEffect, useState } from "react";
import { CheckCircle, X as XIcon, Clock, AlertCircle, BadgeCheck } from "lucide-react";
import { useStore } from "@/store";

const stageLabels: Record<string, string> = {
  data_verifier: "数据处理员验证",
  chief_engineer: "项目总工程师确认",
};

const stageBadge: Record<string, string> = {
  data_verifier: "bg-blue-500/20 text-blue-300",
  chief_engineer: "bg-purple-500/20 text-purple-300",
};

export default function Approval() {
  const { approvals, fetchApprovals, fetchTasks, approveItem, rejectItem } = useStore();
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [approvedByGeology, setApprovedByGeology] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks().then(() => fetchApprovals());
  }, [fetchTasks, fetchApprovals]);

  useEffect(() => {
    if (actionMsg) {
      const t = setTimeout(() => setActionMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionMsg]);

  const pending = approvals.filter((a) => a.status === "pending");
  const history = approvals.filter((a) => a.status !== "pending");

  const handleApprove = async (item: typeof approvals[0]) => {
    setLoadingId(item.id);
    try {
      const result = await approveItem(item.taskId, item.stage, commentMap[item.id] || "");
      setActionMsg({ type: "success", text: "审批通过成功" });
      setCommentMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      if (result.pushToGeologyTeam) {
        setApprovedByGeology((prev) => new Set(prev).add(item.taskId));
      }
      await fetchApprovals();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "审批失败" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (item: typeof approvals[0]) => {
    const comment = commentMap[item.id] || "";
    if (!comment.trim()) {
      setActionMsg({ type: "error", text: "拒绝审批必须填写意见" });
      return;
    }
    setLoadingId(item.id);
    try {
      await rejectItem(item.taskId, item.stage, comment);
      setActionMsg({ type: "success", text: "已拒绝审批" });
      setCommentMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await fetchApprovals();
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

      <h1 className="text-xl font-semibold text-geo-text">审批中心</h1>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">待审批 ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-geo-muted text-center py-8">暂无待审批项</p>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <div key={item.id} className="p-4 bg-geo-secondary/50 rounded-lg border border-slate-700/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-geo-text font-medium">{item.taskName}</div>
                    <div className="text-xs text-geo-text-secondary mt-1">
                      审批阶段：<span className={`px-1.5 py-0.5 rounded text-xs ${stageBadge[item.stage] || "text-geo-accent"}`}>{stageLabels[item.stage] || item.action}</span>
                    </div>
                    <div className="text-xs text-geo-muted mt-1">
                      申请人：{item.requester} | 时间：{item.time}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs bg-geo-warning/20 text-geo-warning rounded-full">待审批</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="输入审批意见..."
                    value={commentMap[item.id] || ""}
                    onChange={(e) => setCommentMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="flex-1 bg-geo-card border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-geo-text placeholder:text-geo-muted focus:outline-none focus:border-geo-accent"
                  />
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-geo-success/20 text-geo-success text-sm rounded-lg hover:bg-geo-success/30 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> 通过
                  </button>
                  <button
                    onClick={() => handleReject(item)}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-geo-danger/20 text-geo-danger text-sm rounded-lg hover:bg-geo-danger/30 transition-colors disabled:opacity-50"
                  >
                    <XIcon className="w-3.5 h-3.5" /> 拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">审批历史</h2>
        {history.length === 0 ? (
          <p className="text-sm text-geo-muted text-center py-8">暂无审批记录</p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const showGeologyBadge = approvedByGeology.has(item.taskId) && item.stage === "chief_engineer" && item.status === "approved";
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.status === "approved" ? "bg-geo-success/20" : "bg-geo-danger/20"
                    }`}>
                      {item.status === "approved" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-geo-success" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-geo-danger" />
                      )}
                    </div>
                    <div className="w-px h-full bg-slate-700/50" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-geo-text font-medium">{item.taskName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === "approved" ? "bg-geo-success/20 text-geo-success" : "bg-geo-danger/20 text-geo-danger"
                      }`}>
                        {item.status === "approved" ? "已通过" : "已拒绝"}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${stageBadge[item.stage] || "text-geo-accent"}`}>
                        {stageLabels[item.stage] || item.action}
                      </span>
                      {showGeologyBadge && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-geo-accent/20 text-geo-accent">
                          <BadgeCheck className="w-3 h-3" /> 已推送至地质解释组
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-geo-text-secondary mt-1">
                      申请人：{item.requester}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-geo-muted mt-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </div>
                    {item.comment && (
                      <div className="mt-2 text-xs text-geo-text-secondary bg-geo-secondary/50 rounded px-2 py-1">
                        意见：{item.comment}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
