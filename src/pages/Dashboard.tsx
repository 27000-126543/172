import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Activity,
  Zap,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "@/store";
import StatusBadge from "@/components/StatusBadge";

const trendData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}日`,
  完成率: 60 + Math.random() * 20 + i * 0.6,
  收敛次数: 120 + Math.floor(Math.random() * 10 + i * 1.5),
}));

export default function Dashboard() {
  const { dashboardStats, tasks, alerts, fetchDashboard, fetchTasks, fetchAlerts } =
    useStore();

  const statusDist = [
    { label: "待审核", key: "pending_check", color: "bg-slate-400" },
    { label: "预处理", key: "preprocessing", color: "bg-blue-400" },
    { label: "阻抗计算", key: "impedance_calc", color: "bg-cyan-400" },
    { label: "反演迭代", key: "inversion_iter", color: "bg-orange-400" },
    { label: "成图生成", key: "image_gen", color: "bg-purple-400" },
    { label: "已完成", key: "completed", color: "bg-green-400" },
    { label: "已回滚", key: "rollback", color: "bg-red-400" },
  ].map((s) => {
    const count = tasks.filter((t) => t.status === s.key).length;
    const total = tasks.length || 1;
    return { ...s, count, percent: Math.round((count / total) * 100) };
  });

  useEffect(() => {
    fetchDashboard();
    fetchTasks();
    fetchAlerts();
  }, [fetchDashboard, fetchTasks, fetchAlerts]);

  const statsCards = [
    {
      label: "完成率",
      value: `${dashboardStats.completionRate}%`,
      icon: TrendingUp,
      color: "text-geo-accent",
      bg: "bg-geo-accent/10",
    },
    {
      label: "收敛次数",
      value: dashboardStats.convergenceCount,
      icon: Activity,
      color: "text-geo-success",
      bg: "bg-geo-success/10",
    },
    {
      label: "拟合差改善率",
      value: `${dashboardStats.misfitImprovement}%`,
      icon: Zap,
      color: "text-geo-warning",
      bg: "bg-geo-warning/10",
    },
    {
      label: "活跃预警",
      value: dashboardStats.activeAlerts,
      icon: AlertTriangle,
      color: "text-geo-danger",
      bg: "bg-geo-danger/10",
    },
  ];

  const recentTasks = tasks.slice(0, 5);
  const activeAlerts = alerts.filter((a) => !a.processed);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-geo-text">工作台</h1>

      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="gradient-card rounded-lg border border-slate-700/50 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-geo-text-secondary">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className={`mt-3 text-2xl font-bold font-mono ${card.color}`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4">
            性能趋势（近30天）
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis
                dataKey="day"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                stroke="#1e3a5f"
                interval={4}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                stroke="#1e3a5f"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#152238",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#E2E8F0",
                }}
              />
              <Line
                type="monotone"
                dataKey="完成率"
                stroke="#E8702A"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="收敛次数"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
                yAxisId={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4">
            任务状态分布
          </h2>
          <div className="space-y-3">
            {statusDist.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-geo-text-secondary">{item.label}</span>
                  <span className="text-geo-text font-mono">{item.count}</span>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 gradient-card rounded-lg border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-geo-text">最近任务</h2>
            <Link
              to="/tasks"
              className="text-xs text-geo-accent hover:underline flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  <span className="text-sm text-geo-text">{task.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-geo-text-secondary">
                  <span className="font-mono">
                    {task.iteration}/{task.maxIteration}
                  </span>
                  <span>{task.updated}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-geo-text">活跃预警</h2>
            <Link
              to="/alerts"
              className="text-xs text-geo-accent hover:underline flex items-center gap-1"
            >
              全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg border border-slate-700/30 bg-geo-secondary/50 animate-pulse-alert"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.level === "critical"
                        ? "bg-geo-danger"
                        : "bg-geo-warning"
                    }`}
                  />
                  <span className="text-geo-text-secondary">{alert.type}</span>
                  <span className="text-geo-muted ml-auto">{alert.time}</span>
                </div>
                <p className="text-sm text-geo-text mt-1">{alert.message}</p>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <p className="text-sm text-geo-muted text-center py-4">
                暂无活跃预警
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
