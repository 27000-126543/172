import { create } from "zustand";

export type TaskStatus =
  | "pending_check"
  | "preprocessing"
  | "impedance_calc"
  | "inversion_iter"
  | "image_gen"
  | "completed"
  | "rollback";

export interface User {
  id: string;
  name: string;
  role: string;
}

export interface Task {
  id: string;
  name: string;
  surveyArea: string;
  status: TaskStatus;
  iteration: number;
  maxIteration: number;
  misfit: number;
  roughness: number;
  created: string;
  updated: string;
  algorithm?: string;
  regularization?: number;
  description?: string;
  stationCount?: number;
  frequencyRange?: string;
  lineName?: string;
}

export interface DashboardStats {
  completionRate: number;
  convergenceCount: number;
  misfitImprovement: number;
  activeAlerts: number;
}

export interface Alert {
  id: string;
  level: "warning" | "critical" | "info";
  type: string;
  message: string;
  surveyArea: string;
  time: string;
  processed: boolean;
  taskId?: string;
}

export interface Approval {
  id: string;
  taskId: string;
  taskName: string;
  stage: "data_verifier" | "chief_engineer";
  action: string;
  requester: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  comment: string;
}

export interface Recommendation {
  id: string;
  name: string;
  matchScore: number;
  successRate: number;
  description: string;
  weights: { regularization: number; smoothness: number };
  applied: boolean;
  algorithm?: string;
  surveyArea?: string;
  confidence?: number;
  reason?: string;
}

export interface IterationData {
  iteration: number;
  misfit: number;
  roughness: number;
  rms?: number;
}

export interface Result {
  id: string;
  taskId?: string;
  taskName: string;
  surveyArea: string;
  created: string;
  reportStatus: "generating" | "ready" | "none";
  finalMisfit?: number;
  finalRoughness?: number;
  totalIterations?: number;
}

export interface SurveyAreaStatus {
  name: string;
  paused: boolean;
  activeAlerts: number;
  criticalAlerts: number;
  falseAnomalyCount: number;
}

export interface WeightPreset {
  surveyArea: string;
  misfit: number;
  roughness: number;
  name: string;
  description: string;
}

interface TaskFilters {
  status: string;
  surveyArea: string;
  search: string;
}

interface StoreState {
  currentUser: User;
  tasks: Task[];
  currentTask: Task | null;
  taskFilters: TaskFilters;
  dashboardStats: DashboardStats;
  alerts: Alert[];
  approvals: Approval[];
  recommendations: Recommendation[];
  iterationData: IterationData[];
  results: Result[];
  loading: boolean;
  regAdjustments: any[];
  algorithmSwitches: any[];
  surveyAreaStatus: SurveyAreaStatus[];
  selectedRecommendation: Recommendation | null;
  weightPresets: WeightPreset[];
  defaultArea: string;

  setTaskFilters: (filters: Partial<TaskFilters>) => void;
  fetchDashboard: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchApprovals: () => Promise<void>;
  fetchRecommendations: (surveyArea?: string) => Promise<void>;
  fetchIterationData: (taskId: string) => Promise<void>;
  fetchResults: () => Promise<void>;
  fetchRegAdjustments: (taskId: string) => Promise<void>;
  fetchAlgorithmSwitches: (taskId: string) => Promise<void>;
  fetchSurveyAreaStatus: () => Promise<void>;
  createTask: (data: { name: string; surveyArea: string; algorithm: string; regularization: number; description: string; stationCount: number; frequencyRange: string; lineName?: string }) => Promise<{ success: boolean; data?: Task; error?: string }>;
  adjustRegularization: (taskId: string, value: number, reason: string) => Promise<void>;
  switchAlgorithm: (taskId: string, algorithm: string, reason: string) => Promise<void>;
  advanceTask: (taskId: string, status: string) => Promise<void>;
  rollbackTask: (taskId: string) => Promise<void>;
  processAlert: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  approveItem: (taskId: string, stage: string, comment: string) => Promise<{ pushToGeologyTeam?: boolean }>;
  rejectItem: (taskId: string, stage: string, comment: string) => Promise<void>;
  applyRecommendation: (rec: Recommendation) => void;
  fetchRecommendationsByArea: (surveyArea: string) => Promise<void>;
  fetchWeights: (surveyArea?: string) => Promise<void>;
}

async function apiFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data !== undefined) {
        return json.data;
      }
      return json;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

async function apiPost(url: string, body: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json;
  } catch {
    return { success: false, error: "网络错误" };
  }
}

async function apiPut(url: string, body: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json;
  } catch {
    return { success: false, error: "网络错误" };
  }
}

function formatDate(d?: string): string {
  if (!d) return "";
  return d.split("T").join(" ").substring(0, 16);
}

function mapAlertType(type: string): string {
  const map: Record<string, string> = {
    divergence: "收敛异常",
    false_anomaly: "假异常检测",
    system: "系统通知",
    rollback: "反演回退",
    parameter_adjust: "参数调整",
    progress: "进度通知",
  };
  return map[type] || type;
}

function mapAlertSeverity(severity: string): "warning" | "critical" | "info" {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "info";
}

function mapTaskFromApi(t: any): Task {
  return {
    id: t.id,
    name: t.name,
    surveyArea: t.surveyArea,
    status: t.status,
    iteration: t.iterations?.length || t.iteration || 0,
    maxIteration: 30,
    misfit: t.iterations?.[t.iterations.length - 1]?.misfit || t.misfit || 0,
    roughness: t.iterations?.[t.iterations.length - 1]?.roughness || t.roughness || 0,
    created: formatDate(t.createdAt),
    updated: formatDate(t.updatedAt),
    algorithm: t.algorithm,
    regularization: t.regularization,
    description: t.description,
    stationCount: t.stationCount,
    frequencyRange: t.frequencyRange,
    lineName: t.lineName,
  };
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser: { id: "u1", name: "张明", role: "数据处理员" },
  tasks: [],
  currentTask: null,
  taskFilters: { status: "", surveyArea: "", search: "" },
  dashboardStats: { completionRate: 0, convergenceCount: 0, misfitImprovement: 0, activeAlerts: 0 },
  alerts: [],
  approvals: [],
  recommendations: [],
  iterationData: [],
  results: [],
  loading: false,
  regAdjustments: [],
  algorithmSwitches: [],
  surveyAreaStatus: [],
  selectedRecommendation: null,
  weightPresets: [],
  defaultArea: "",

  setTaskFilters: (filters) =>
    set((state) => ({ taskFilters: { ...state.taskFilters, ...filters } })),

  fetchDashboard: async () => {
    const data = await apiFetch<any>("/api/dashboard/stats", null as any);
    if (data && data.totalTasks !== undefined) {
      const rate = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 1000) / 10 : 0;
      set({
        dashboardStats: {
          completionRate: rate,
          convergenceCount: data.activeTasks || 0,
          misfitImprovement: 0,
          activeAlerts: data.activeAlerts,
        },
      });
    }
  },

  fetchTasks: async () => {
    const data = await apiFetch<{ items: any[]; total: number }>("/api/tasks", null as any);
    if (data && Array.isArray(data.items)) {
      const tasks: Task[] = data.items.map(mapTaskFromApi);
      set({ tasks });
    }
  },

  fetchTask: async (id) => {
    const data = await apiFetch<any>(`/api/tasks/${id}`, null as any);
    if (data && data.id) {
      const task = mapTaskFromApi(data);
      const iterData: IterationData[] = Array.isArray(data.iterations)
        ? data.iterations.map((it: any) => ({
            iteration: it.iteration,
            misfit: it.misfit,
            roughness: it.roughness,
            rms: it.rms,
          }))
        : [];
      const regAdj = Array.isArray(data.regAdjustments) ? data.regAdjustments : [];
      const algoSw = Array.isArray(data.algorithmSwitches) ? data.algorithmSwitches : [];
      set({ currentTask: task, iterationData: iterData, regAdjustments: regAdj, algorithmSwitches: algoSw });
    }
  },

  fetchAlerts: async () => {
    const data = await apiFetch<any[]>("/api/alerts", null as any);
    if (Array.isArray(data)) {
      const alerts: Alert[] = data.map((a: any) => ({
        id: a.id,
        level: mapAlertSeverity(a.severity || "warning"),
        type: mapAlertType(a.type),
        message: a.message,
        surveyArea: a.surveyArea,
        time: formatDate(a.createdAt),
        processed: a.status !== "active",
        taskId: a.taskId,
      }));
      set({ alerts });
    }
  },

  fetchApprovals: async () => {
    const data = await apiFetch<any[]>("/api/approvals?status=pending", null as any);
    const tasks = get().tasks;
    if (Array.isArray(data)) {
      const approvals: Approval[] = data.map((a: any) => {
        const task = tasks.find((t) => t.id === a.taskId);
        return {
          id: a.id,
          taskId: a.taskId,
          taskName: task?.name || a.taskId,
          stage: a.stage,
          action: a.stage === "data_verifier" ? "数据验证" : "总工程师确认",
          requester: a.reviewer || "",
          time: formatDate(a.createdAt),
          status: a.status,
          comment: a.comment || "",
        };
      });
      set({ approvals });
    }
  },

  fetchRecommendations: async (surveyArea?: string) => {
    const url = surveyArea ? `/api/recommend/models?surveyArea=${encodeURIComponent(surveyArea)}` : "/api/recommend/models";
    const data = await apiFetch<any>(url, null as any);
    if (data) {
      let recs: Recommendation[] = [];
      if (surveyArea && data.recommendation) {
        const rec = data.recommendation;
        const historyModels = Array.isArray(data.historyModels) ? data.historyModels : [];
        recs = historyModels.map((m: any) => ({
          id: m.id,
          name: m.modelName || m.name || rec.algorithm,
          matchScore: rec.confidence || m.matchConfidence || 0,
          successRate: m.successRate || 0,
          description: rec.reason || m.reason || m.description || "",
          weights: { regularization: m.regularization || rec.regularization || 0, smoothness: m.smoothness || 0.85 },
          applied: m.applied || false,
          algorithm: m.algorithm || rec.algorithm,
          surveyArea: m.surveyArea || data.surveyArea || surveyArea,
          confidence: rec.confidence,
          reason: rec.reason,
        }));
        if (recs.length === 0) {
          recs = [{
            id: "rec-" + Date.now(),
            name: rec.algorithm + " 推荐",
            matchScore: rec.confidence || 0,
            successRate: 0,
            description: rec.reason || "",
            weights: { regularization: rec.regularization || 0, smoothness: 0.85 },
            applied: false,
            algorithm: rec.algorithm,
            surveyArea: data.surveyArea || surveyArea,
            confidence: rec.confidence,
            reason: rec.reason,
          }];
        }
      } else if (data.groupedByArea) {
        Object.entries(data.groupedByArea as Record<string, any[]>).forEach(([, models]) => {
          models.forEach((m: any) => {
            recs.push({
              id: m.id,
              name: m.modelName || m.name,
              matchScore: m.matchConfidence || m.matchScore || 0,
              successRate: m.successRate || 0,
              description: m.reason || m.description || "",
              weights: { regularization: m.regularization || m.regularizationWeight || 0, smoothness: m.smoothness || 0.85 },
              applied: m.applied || false,
              algorithm: m.algorithm,
              surveyArea: m.surveyArea,
            });
          });
        });
      } else if (Array.isArray(data.models)) {
        recs = data.models.map((m: any) => ({
          id: m.id,
          name: m.modelName || m.name,
          matchScore: m.matchConfidence || m.matchScore || 0,
          successRate: m.successRate || 0,
          description: m.reason || m.description || "",
          weights: { regularization: m.regularization || m.regularizationWeight || 0, smoothness: m.smoothness || 0.85 },
          applied: m.applied || false,
          algorithm: m.algorithm,
          surveyArea: m.surveyArea,
        }));
      } else if (Array.isArray(data)) {
        recs = data.map((m: any) => ({
          id: m.id,
          name: m.modelName || m.name,
          matchScore: m.matchConfidence || m.matchScore || 0,
          successRate: m.successRate || 0,
          description: m.reason || m.description || "",
          weights: { regularization: m.regularization || m.regularizationWeight || 0, smoothness: m.smoothness || 0.85 },
          applied: m.applied || false,
          algorithm: m.algorithm,
          surveyArea: m.surveyArea,
        }));
      }
      set({ recommendations: recs });
    }
  },

  fetchIterationData: async (taskId) => {
    const data = await apiFetch<any[]>(`/api/inversion/${taskId}/iterations`, null as any);
    if (Array.isArray(data)) {
      const iterData: IterationData[] = data.map((it: any) => ({
        iteration: it.iteration,
        misfit: it.misfit,
        roughness: it.roughness,
        rms: it.rms,
      }));
      set({ iterationData: iterData });
    }
  },

  fetchResults: async () => {
    await get().fetchTasks();
    const tasks = get().tasks;
    const completed = tasks.filter((t) => t.status === "completed");
    const results: Result[] = completed.map((t) => ({
      id: t.id,
      taskId: t.id,
      taskName: t.name,
      surveyArea: t.surveyArea,
      created: t.updated || t.created,
      reportStatus: "ready" as const,
      finalMisfit: t.misfit,
      finalRoughness: t.roughness,
      totalIterations: t.iteration,
    }));
    set({ results });
  },

  fetchRegAdjustments: async (taskId) => {
    const data = await apiFetch<any[]>(`/api/inversion/${taskId}/adjustments`, null as any);
    if (Array.isArray(data)) {
      set({ regAdjustments: data });
    }
  },

  fetchAlgorithmSwitches: async (taskId) => {
    const data = await apiFetch<any[]>(`/api/inversion/${taskId}/switches`, null as any);
    if (Array.isArray(data)) {
      set({ algorithmSwitches: data });
    }
  },

  fetchSurveyAreaStatus: async () => {
    const alerts = get().alerts;
    const areas = ["青藏高原东缘测区", "华北克拉通测区", "南海北部陆缘测区"];
    const statuses: SurveyAreaStatus[] = areas.map((name) => {
      const areaAlerts = alerts.filter((a) => a.surveyArea === name);
      const activeAlerts = areaAlerts.filter((a) => !a.processed);
      const criticalAlerts = activeAlerts.filter((a) => a.level === "critical");
      const falseAnomalyCount = activeAlerts.filter((a) => a.type === "假异常检测").length;
      return {
        name,
        paused: falseAnomalyCount >= 3,
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        falseAnomalyCount,
      };
    });
    set({ surveyAreaStatus: statuses });
  },

  createTask: async (data) => {
    const res = await apiPost("/api/tasks", {
      name: data.name,
      surveyArea: data.surveyArea,
      algorithm: data.algorithm,
      regularization: data.regularization,
      description: data.description,
      stationCount: data.stationCount,
      frequencyRange: data.frequencyRange,
      lineName: data.lineName,
    });
    if (res.success && res.data) {
      const task = mapTaskFromApi(res.data);
      set((state) => ({ tasks: [task, ...state.tasks] }));
      return { success: true, data: task };
    }
    return { success: false, error: res.error || "创建任务失败" };
  },

  adjustRegularization: async (taskId, value, reason) => {
    const res = await apiPost(`/api/inversion/${taskId}/adjust`, {
      toValue: value,
      reason,
      adjustedBy: get().currentUser.id,
    });
    if (!res.success) {
      throw new Error(res.error || "调整正则化参数失败");
    }
    await get().fetchTask(taskId);
    await get().fetchRegAdjustments(taskId);
  },

  switchAlgorithm: async (taskId, algorithm, reason) => {
    const res = await apiPost(`/api/inversion/${taskId}/switch-algorithm`, {
      toAlgorithm: algorithm,
      reason,
      switchedBy: get().currentUser.id,
    });
    if (!res.success) {
      throw new Error(res.error || "切换算法失败");
    }
    await get().fetchTask(taskId);
    await get().fetchAlgorithmSwitches(taskId);
  },

  advanceTask: async (taskId, status) => {
    const res = await apiPut(`/api/tasks/${taskId}/status`, { status });
    if (!res.success) {
      throw new Error(res.error || "状态更新失败");
    }
    await get().fetchTask(taskId);
  },

  rollbackTask: async (taskId) => {
    const res = await apiPost(`/api/tasks/${taskId}/rollback`, {});
    if (!res.success) {
      throw new Error(res.error || "回滚任务失败");
    }
    await get().fetchTask(taskId);
  },

  processAlert: async (id) => {
    const res = await apiPut(`/api/alerts/${id}/process`, { processedBy: get().currentUser.id });
    if (!res.success) {
      throw new Error(res.error || "处理预警失败");
    }
    await get().fetchAlerts();
    await get().fetchSurveyAreaStatus();
  },

  dismissAlert: async (id) => {
    const res = await apiPut(`/api/alerts/${id}/dismiss`, { processedBy: get().currentUser.id });
    if (!res.success) {
      throw new Error(res.error || "忽略预警失败");
    }
    await get().fetchAlerts();
    await get().fetchSurveyAreaStatus();
  },

  approveItem: async (taskId, stage, comment) => {
    const res = await apiPost(`/api/approvals/${taskId}/approve`, {
      stage,
      reviewer: get().currentUser.id,
      comment,
    });
    if (!res.success) {
      throw new Error(res.error || "审批通过失败");
    }
    await get().fetchApprovals();
    return { pushToGeologyTeam: res.data?.pushToGeologyTeam };
  },

  rejectItem: async (taskId, stage, comment) => {
    const res = await apiPost(`/api/approvals/${taskId}/reject`, {
      stage,
      reviewer: get().currentUser.id,
      comment,
    });
    if (!res.success) {
      throw new Error(res.error || "审批拒绝失败");
    }
    await get().fetchApprovals();
  },

  applyRecommendation: (rec) => {
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === rec.id ? { ...r, applied: true } : r
      ),
      selectedRecommendation: rec,
    }));
  },

  fetchRecommendationsByArea: async (surveyArea) => {
    const data = await apiFetch<any>(`/api/recommend/models?surveyArea=${encodeURIComponent(surveyArea)}`, null as any);
    if (data) {
      let recs: Recommendation[] = [];
      if (data.recommendation) {
        const rec = data.recommendation;
        const historyModels = Array.isArray(data.historyModels) ? data.historyModels : [];
        recs = historyModels.map((m: any) => ({
          id: m.id,
          name: m.modelName || m.name || rec.algorithm,
          matchScore: rec.confidence || m.matchConfidence || 0,
          successRate: m.successRate || 0,
          description: rec.reason || m.reason || m.description || "",
          weights: { regularization: m.regularization || rec.regularization || 0, smoothness: m.smoothness || 0.85 },
          applied: m.applied || false,
          algorithm: m.algorithm || rec.algorithm,
          surveyArea: m.surveyArea || data.surveyArea || surveyArea,
          confidence: rec.confidence,
          reason: rec.reason,
        }));
        if (recs.length === 0) {
          recs = [{
            id: "rec-" + Date.now(),
            name: rec.algorithm + " 推荐",
            matchScore: rec.confidence || 0,
            successRate: 0,
            description: rec.reason || "",
            weights: { regularization: rec.regularization || 0, smoothness: 0.85 },
            applied: false,
            algorithm: rec.algorithm,
            surveyArea: data.surveyArea || surveyArea,
            confidence: rec.confidence,
            reason: rec.reason,
          }];
        }
      }
      set({ recommendations: recs });
    }
  },

  fetchWeights: async (surveyArea?) => {
    const url = surveyArea ? `/api/recommend/weights?surveyArea=${encodeURIComponent(surveyArea)}` : "/api/recommend/weights";
    const data = await apiFetch<any>(url, null as any);
    if (data) {
      const presets: WeightPreset[] = Array.isArray(data.presets)
        ? data.presets.map((p: any) => ({
            surveyArea: p.surveyArea,
            misfit: p.misfit,
            roughness: p.roughness,
            name: p.name || "",
            description: p.description || "",
          }))
        : [];
      set({ weightPresets: presets, defaultArea: data.defaultArea || "" });
    }
  },
}));
