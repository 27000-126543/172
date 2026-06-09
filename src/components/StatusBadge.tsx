import type { TaskStatus } from "@/store";

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending_check: { label: "待审核", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  preprocessing: { label: "预处理", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  impedance_calc: { label: "阻抗计算", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  inversion_iter: { label: "反演迭代", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  image_gen: { label: "成图生成", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  completed: { label: "已完成", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  rollback: { label: "已回滚", color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
