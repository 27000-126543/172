import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Settings,
  Bell,
  Activity,
} from "lucide-react";
import { useStore } from "@/store";

const navItems = [
  { path: "/", label: "工作台", icon: LayoutDashboard },
  { path: "/tasks", label: "任务管理", icon: ClipboardList },
  { path: "/results", label: "成果管理", icon: FileBarChart },
  { path: "/recommend", label: "智能推荐", icon: Lightbulb },
  { path: "/approval", label: "审批中心", icon: CheckCircle },
  { path: "/alerts", label: "预警管理", icon: AlertTriangle },
  { path: "/settings", label: "系统设置", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { currentUser, alerts } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const unprocessedCount = alerts.filter((a) => !a.processed).length;
  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-geo-primary">
      <aside className="w-60 flex-shrink-0 gradient-sidebar border-r border-slate-700/50 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-700/50">
          <Activity className="w-6 h-6 text-geo-accent mr-2" />
          <span className="text-lg font-bold text-gradient-accent">
            MT-Inversion
          </span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-geo-accent/10 text-geo-accent border-l-[3px] border-geo-accent"
                    : "text-geo-text-secondary hover:text-geo-text hover:bg-slate-700/30"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-xs text-geo-muted">版本 v1.0.0</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-700/50 bg-geo-secondary flex-shrink-0">
          <div className="text-sm text-geo-text-secondary">
            大地电磁数据反演平台
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-slate-700/50 text-geo-text-secondary hover:text-geo-text transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unprocessedCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-geo-danger rounded-full text-[10px] flex items-center justify-center text-white font-medium">
                    {unprocessedCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-geo-card border border-slate-700/50 rounded-lg shadow-xl z-50">
                  <div className="p-3 border-b border-slate-700/50 text-sm font-medium text-geo-text">
                    预警通知
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {alerts.filter((a) => !a.processed).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 border-b border-slate-700/30 last:border-0"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              alert.level === "critical"
                                ? "bg-geo-danger"
                                : "bg-geo-warning"
                            }`}
                          />
                          <span className="text-geo-text-secondary">
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-sm text-geo-text mt-1">
                          {alert.message}
                        </p>
                      </div>
                    ))}
                    {unprocessedCount === 0 && (
                      <div className="p-4 text-center text-sm text-geo-muted">
                        暂无未处理预警
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-medium">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm text-geo-text">{currentUser.name}</div>
                <div className="text-xs text-geo-muted">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-geo-primary">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
