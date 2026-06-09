import { useState } from "react";
import { User, MapPin, Zap, Shield } from "lucide-react";

const mockUsers = [
  { id: "u1", name: "张明", role: "数据处理员", status: "在线" },
  { id: "u2", name: "李伟", role: "反演工程师", status: "在线" },
  { id: "u3", name: "王芳", role: "数据分析师", status: "离线" },
  { id: "u4", name: "赵强", role: "系统管理员", status: "在线" },
];

const mockAreas = [
  { id: "a1", name: "青藏高原", status: "活跃", tasks: 3 },
  { id: "a2", name: "华北盆地", status: "活跃", tasks: 1 },
  { id: "a3", name: "四川盆地", status: "活跃", tasks: 1 },
  { id: "a4", name: "天山造山带", status: "活跃", tasks: 1 },
  { id: "a5", name: "东南沿海", status: "暂停", tasks: 1 },
  { id: "a6", name: "鄂尔多斯", status: "活跃", tasks: 1 },
  { id: "a7", name: "滇西地区", status: "暂停", tasks: 1 },
  { id: "a8", name: "南海海域", status: "活跃", tasks: 1 },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"users" | "areas" | "algo" | "threshold">("users");
  const [algoParams, setAlgoParams] = useState({
    maxIteration: "30",
    tolerance: "1e-4",
    initReg: "0.15",
    smoothWeight: "0.85",
    occamAlpha: "0.1",
  });
  const [thresholds, setThresholds] = useState({
    misfitMax: "5.0",
    misfitDelta: "0.5",
    convergenceMin: "3",
    noiseFloor: "0.01",
    gpuUsage: "90",
  });

  const tabs = [
    { key: "users" as const, label: "用户管理", icon: User },
    { key: "areas" as const, label: "测区管理", icon: MapPin },
    { key: "algo" as const, label: "算法参数", icon: Zap },
    { key: "threshold" as const, label: "预警阈值", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-geo-text">系统设置</h1>

      <div className="flex gap-1 bg-geo-card rounded-lg border border-slate-700/50 p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-geo-accent text-white"
                  : "text-geo-text-secondary hover:text-geo-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "users" && (
        <div className="gradient-card rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  姓名
                </th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  角色
                </th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  状态
                </th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20"
                >
                  <td className="px-5 py-3 text-sm text-geo-text">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-geo-text-secondary">
                    {u.role}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs ${
                        u.status === "在线"
                          ? "text-geo-success"
                          : "text-geo-muted"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-geo-accent hover:underline cursor-pointer">
                    编辑
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "areas" && (
        <div className="gradient-card rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  测区名称
                </th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  状态
                </th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  关联任务
                </th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {mockAreas.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20"
                >
                  <td className="px-5 py-3 text-sm text-geo-text">{a.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs ${
                        a.status === "活跃"
                          ? "text-geo-success"
                          : "text-geo-warning"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-geo-text-secondary">
                    {a.tasks}
                  </td>
                  <td className="px-5 py-3 text-sm text-geo-accent hover:underline cursor-pointer">
                    管理
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "algo" && (
        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4">
            算法参数配置
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                最大迭代次数
              </label>
              <input
                type="text"
                value={algoParams.maxIteration}
                onChange={(e) =>
                  setAlgoParams((p) => ({ ...p, maxIteration: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                收敛容差
              </label>
              <input
                type="text"
                value={algoParams.tolerance}
                onChange={(e) =>
                  setAlgoParams((p) => ({ ...p, tolerance: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                初始正则化参数
              </label>
              <input
                type="text"
                value={algoParams.initReg}
                onChange={(e) =>
                  setAlgoParams((p) => ({ ...p, initReg: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                平滑权重
              </label>
              <input
                type="text"
                value={algoParams.smoothWeight}
                onChange={(e) =>
                  setAlgoParams((p) => ({
                    ...p,
                    smoothWeight: e.target.value,
                  }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                OCCAM Alpha
              </label>
              <input
                type="text"
                value={algoParams.occamAlpha}
                onChange={(e) =>
                  setAlgoParams((p) => ({ ...p, occamAlpha: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
          </div>
          <button className="mt-5 px-6 py-2 gradient-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
            保存配置
          </button>
        </div>
      )}

      {activeTab === "threshold" && (
        <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
          <h2 className="text-sm font-medium text-geo-text mb-4">
            预警阈值配置
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                拟合差上限
              </label>
              <input
                type="text"
                value={thresholds.misfitMax}
                onChange={(e) =>
                  setThresholds((t) => ({ ...t, misfitMax: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                拟合差波动阈值
              </label>
              <input
                type="text"
                value={thresholds.misfitDelta}
                onChange={(e) =>
                  setThresholds((t) => ({ ...t, misfitDelta: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                最小连续收敛次数
              </label>
              <input
                type="text"
                value={thresholds.convergenceMin}
                onChange={(e) =>
                  setThresholds((t) => ({
                    ...t,
                    convergenceMin: e.target.value,
                  }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                噪声底限
              </label>
              <input
                type="text"
                value={thresholds.noiseFloor}
                onChange={(e) =>
                  setThresholds((t) => ({ ...t, noiseFloor: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
            <div>
              <label className="text-xs text-geo-text-secondary block mb-1.5">
                GPU使用率告警阈值 (%)
              </label>
              <input
                type="text"
                value={thresholds.gpuUsage}
                onChange={(e) =>
                  setThresholds((t) => ({ ...t, gpuUsage: e.target.value }))
                }
                className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text font-mono focus:outline-none focus:border-geo-accent"
              />
            </div>
          </div>
          <button className="mt-5 px-6 py-2 gradient-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
            保存阈值
          </button>
        </div>
      )}
    </div>
  );
}
