import { v4 as uuidv4 } from 'uuid'

export type TaskStatus = 'pending_check' | 'preprocessing' | 'impedance_calc' | 'inversion_iter' | 'image_gen' | 'completed' | 'rollback'

export interface Task {
  id: string
  name: string
  surveyArea: string
  status: TaskStatus
  algorithm: string
  regularization: number
  createdBy: string
  createdAt: string
  updatedAt: string
  description: string
  stationCount: number
  frequencyRange: string
  previousStatus?: TaskStatus
}

export interface InversionIteration {
  id: string
  taskId: string
  iteration: number
  misfit: number
  roughness: number
  rms: number
  timestamp: string
}

export interface Alert {
  id: string
  taskId: string
  surveyArea: string
  type: 'divergence' | 'false_anomaly' | 'system'
  severity: 'critical' | 'warning' | 'info'
  message: string
  status: 'active' | 'processed' | 'dismissed'
  processedBy?: string
  processedAt?: string
  createdAt: string
}

export interface Approval {
  id: string
  taskId: string
  stage: 'data_verifier' | 'chief_engineer'
  status: 'pending' | 'approved' | 'rejected'
  reviewer: string
  comment?: string
  createdAt: string
  updatedAt: string
}

export interface AlgorithmSwitch {
  id: string
  taskId: string
  fromAlgorithm: string
  toAlgorithm: string
  reason: string
  switchedBy: string
  switchedAt: string
}

export interface RegularizationAdjustment {
  id: string
  taskId: string
  fromValue: number
  toValue: number
  reason: string
  adjustedBy: string
  adjustedAt: string
}

export interface HistoryModel {
  id: string
  surveyArea: string
  modelName: string
  algorithm: string
  regularization: number
  finalMisfit: number
  roughness: number
  stationCount: number
  frequencyRange: string
  completedAt: string
}

export interface TaskResult {
  id: string
  taskId: string
  modelUrl: string
  crossSectionUrl: string
  misfitUrl: string
  finalMisfit: number
  finalRoughness: number
  totalIterations: number
  completedAt: string
  pushedToInterpreter: boolean
}

export interface User {
  id: string
  name: string
  role: string
}

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending_check: ['preprocessing', 'rollback'],
  preprocessing: ['impedance_calc', 'rollback'],
  impedance_calc: ['inversion_iter', 'rollback'],
  inversion_iter: ['image_gen', 'rollback'],
  image_gen: ['completed', 'rollback'],
  completed: ['rollback'],
  rollback: ['pending_check'],
}

const now = new Date()
const dayMs = 86400000
const hourMs = 3600000

function ts(daysAgo: number, hoursAgo: number = 0): string {
  return new Date(now.getTime() - daysAgo * dayMs - hoursAgo * hourMs).toISOString()
}

const users: User[] = [
  { id: 'u1', name: '张明', role: '数据处理员' },
  { id: 'u2', name: '李工', role: '项目总工程师' },
  { id: 'u3', name: '王首席', role: '首席科学家' },
  { id: 'u4', name: '赵解释', role: '地质解释组' },
  { id: 'u5', name: '管理员', role: '管理员' },
]

const surveyAreas = ['青藏高原东缘测区', '华北克拉通测区', '南海北部陆缘测区']

const algorithms = ['Occam反演', 'NLCG反演', 'RRI反演', 'Rebocc反演']

function generateIterations(taskId: string, count: number, startMisfit: number, startRoughness: number): InversionIteration[] {
  const result: InversionIteration[] = []
  let misfit = startMisfit
  let roughness = startRoughness
  for (let i = 1; i <= count; i++) {
    misfit = misfit * (0.92 + Math.random() * 0.04)
    roughness = roughness * (0.95 + Math.random() * 0.03)
    result.push({
      id: uuidv4(),
      taskId,
      iteration: i,
      misfit: Math.round(misfit * 1000) / 1000,
      roughness: Math.round(roughness * 1000) / 1000,
      rms: Math.round((misfit * 0.85 + Math.random() * 0.5) * 1000) / 1000,
      timestamp: ts(2, count - i + 1),
    })
  }
  return result
}

const tasks: Task[] = [
  {
    id: 't1',
    name: '青藏高原东缘L1测线大地电磁反演',
    surveyArea: '青藏高原东缘测区',
    status: 'completed',
    algorithm: 'Occam反演',
    regularization: 3.5,
    createdBy: 'u1',
    createdAt: ts(15),
    updatedAt: ts(5),
    description: '青藏高原东缘L1测线深部电性结构探测，含32个测点，频率范围0.001-1000Hz',
    stationCount: 32,
    frequencyRange: '0.001-1000Hz',
  },
  {
    id: 't2',
    name: '华北克拉通中部A剖面二维反演',
    surveyArea: '华北克拉通测区',
    status: 'inversion_iter',
    algorithm: 'NLCG反演',
    regularization: 2.8,
    createdBy: 'u1',
    createdAt: ts(8),
    updatedAt: ts(0, 2),
    description: '华北克拉通中部A剖面岩石圈结构探测，含48个测点，频率范围0.01-1000Hz',
    stationCount: 48,
    frequencyRange: '0.01-1000Hz',
  },
  {
    id: 't3',
    name: '南海北部陆缘B测线深部结构反演',
    surveyArea: '南海北部陆缘测区',
    status: 'inversion_iter',
    algorithm: 'Occam反演',
    regularization: 4.2,
    createdBy: 'u1',
    createdAt: ts(6),
    updatedAt: ts(0, 5),
    description: '南海北部陆缘B测线地壳与上地幔电性结构探测，含36个测点',
    stationCount: 36,
    frequencyRange: '0.001-500Hz',
  },
  {
    id: 't4',
    name: '青藏高原东缘L2测线三维反演',
    surveyArea: '青藏高原东缘测区',
    status: 'image_gen',
    algorithm: 'RRI反演',
    regularization: 3.0,
    createdBy: 'u1',
    createdAt: ts(10),
    updatedAt: ts(0, 8),
    description: '青藏高原东缘L2测线三维电性结构建模，含56个测点',
    stationCount: 56,
    frequencyRange: '0.001-1000Hz',
  },
  {
    id: 't5',
    name: '华北克拉通南部C剖面阻抗计算',
    surveyArea: '华北克拉通测区',
    status: 'impedance_calc',
    algorithm: 'NLCG反演',
    regularization: 3.2,
    createdBy: 'u1',
    createdAt: ts(4),
    updatedAt: ts(1),
    description: '华北克拉通南部C剖面深部结构探测，含28个测点',
    stationCount: 28,
    frequencyRange: '0.01-500Hz',
  },
  {
    id: 't6',
    name: '南海北部陆缘D测线数据预处理',
    surveyArea: '南海北部陆缘测区',
    status: 'preprocessing',
    algorithm: 'Rebocc反演',
    regularization: 5.0,
    createdBy: 'u1',
    createdAt: ts(3),
    updatedAt: ts(1, 5),
    description: '南海北部陆缘D测线海洋大地电磁数据预处理，含24个测点',
    stationCount: 24,
    frequencyRange: '0.01-300Hz',
  },
  {
    id: 't7',
    name: '青藏高原东缘L3测线数据审核',
    surveyArea: '青藏高原东缘测区',
    status: 'pending_check',
    algorithm: 'Occam反演',
    regularization: 3.8,
    createdBy: 'u1',
    createdAt: ts(2),
    updatedAt: ts(2),
    description: '青藏高原东缘L3测线新采集数据质量检查，含40个测点',
    stationCount: 40,
    frequencyRange: '0.001-1000Hz',
  },
  {
    id: 't8',
    name: '华北克拉通北部E剖面反演回退',
    surveyArea: '华北克拉通测区',
    status: 'rollback',
    algorithm: 'NLCG反演',
    regularization: 2.5,
    createdBy: 'u1',
    createdAt: ts(12),
    updatedAt: ts(0, 10),
    previousStatus: 'inversion_iter',
    description: '华北克拉通北部E剖面反演发散，已回退至数据审核阶段',
    stationCount: 44,
    frequencyRange: '0.01-1000Hz',
  },
  {
    id: 't9',
    name: '南海北部陆缘F测线浅部结构反演',
    surveyArea: '南海北部陆缘测区',
    status: 'completed',
    algorithm: 'RRI反演',
    regularization: 4.5,
    createdBy: 'u1',
    createdAt: ts(20),
    updatedAt: ts(10),
    description: '南海北部陆缘F测线浅部电性结构探测，含20个测点',
    stationCount: 20,
    frequencyRange: '1-1000Hz',
  },
  {
    id: 't10',
    name: '青藏高原东缘L4测线数据审核',
    surveyArea: '青藏高原东缘测区',
    status: 'pending_check',
    algorithm: 'Occam反演',
    regularization: 3.3,
    createdBy: 'u1',
    createdAt: ts(1),
    updatedAt: ts(1),
    description: '青藏高原东缘L4测线远参考道数据处理，含35个测点',
    stationCount: 35,
    frequencyRange: '0.001-1000Hz',
  },
]

const iterations: InversionIteration[] = [
  ...generateIterations('t1', 25, 5.2, 12.8),
  ...generateIterations('t2', 22, 6.1, 15.3),
  ...generateIterations('t3', 20, 4.8, 10.5),
  ...generateIterations('t4', 24, 5.5, 13.2),
  ...generateIterations('t9', 18, 4.2, 9.8),
]

const alerts: Alert[] = [
  {
    id: 'a1',
    taskId: 't2',
    surveyArea: '华北克拉通测区',
    type: 'divergence',
    severity: 'warning',
    message: '华北克拉通中部A剖面第18次迭代拟合差上升3.2%，反演可能发散',
    status: 'active',
    createdAt: ts(0, 3),
  },
  {
    id: 'a2',
    taskId: 't3',
    surveyArea: '南海北部陆缘测区',
    type: 'false_anomaly',
    severity: 'warning',
    message: '南海北部陆缘B测线深度15km处出现疑似假异常体，建议检查数据质量',
    status: 'active',
    createdAt: ts(0, 6),
  },
  {
    id: 'a3',
    taskId: 't8',
    surveyArea: '华北克拉通测区',
    type: 'divergence',
    severity: 'critical',
    message: '华北克拉通北部E剖面反演连续5次迭代拟合差上升，已触发自动回退',
    status: 'processed',
    processedBy: 'u2',
    processedAt: ts(0, 10),
    createdAt: ts(0, 12),
  },
  {
    id: 'a4',
    taskId: 't2',
    surveyArea: '华北克拉通测区',
    type: 'system',
    severity: 'info',
    message: '华北克拉通中部A剖面正则化参数已自动调整至3.0',
    status: 'dismissed',
    processedBy: 'u1',
    processedAt: ts(0, 1),
    createdAt: ts(0, 2),
  },
  {
    id: 'a5',
    taskId: 't3',
    surveyArea: '南海北部陆缘测区',
    type: 'system',
    severity: 'info',
    message: '南海北部陆缘B测线反演迭代进度已超过80%',
    status: 'active',
    createdAt: ts(0, 1),
  },
  {
    id: 'a6',
    taskId: 't4',
    surveyArea: '青藏高原东缘测区',
    type: 'false_anomaly',
    severity: 'warning',
    message: '青藏高原东缘L2测线测点MT-023附近出现孤立高阻异常，可能为近场效应',
    status: 'active',
    createdAt: ts(0, 8),
  },
]

const approvals: Approval[] = [
  {
    id: 'ap1',
    taskId: 't1',
    stage: 'data_verifier',
    status: 'approved',
    reviewer: 'u1',
    comment: '数据质量良好，各测点视电阻率和相位曲线无明显畸变',
    createdAt: ts(14),
    updatedAt: ts(13),
  },
  {
    id: 'ap2',
    taskId: 't1',
    stage: 'chief_engineer',
    status: 'approved',
    reviewer: 'u2',
    comment: '反演结果与已知地质资料吻合，批准通过',
    createdAt: ts(13),
    updatedAt: ts(12),
  },
  {
    id: 'ap3',
    taskId: 't9',
    stage: 'data_verifier',
    status: 'approved',
    reviewer: 'u1',
    comment: '海洋MT数据经Robust处理，数据质量满足要求',
    createdAt: ts(19),
    updatedAt: ts(18),
  },
  {
    id: 'ap4',
    taskId: 't9',
    stage: 'chief_engineer',
    status: 'approved',
    reviewer: 'u2',
    comment: '浅部结构反演结果合理，批准',
    createdAt: ts(18),
    updatedAt: ts(17),
  },
  {
    id: 'ap5',
    taskId: 't2',
    stage: 'data_verifier',
    status: 'approved',
    reviewer: 'u1',
    comment: '数据预处理完成，质量达标',
    createdAt: ts(7),
    updatedAt: ts(6),
  },
  {
    id: 'ap6',
    taskId: 't2',
    stage: 'chief_engineer',
    status: 'pending',
    reviewer: 'u2',
    createdAt: ts(6),
    updatedAt: ts(6),
  },
]

const algorithmSwitches: AlgorithmSwitch[] = [
  {
    id: 's1',
    taskId: 't8',
    fromAlgorithm: 'Occam反演',
    toAlgorithm: 'NLCG反演',
    reason: 'Occam反演在华北克拉通北部数据上持续发散，切换至NLCG算法',
    switchedBy: 'u2',
    switchedAt: ts(2),
  },
  {
    id: 's2',
    taskId: 't3',
    fromAlgorithm: 'NLCG反演',
    toAlgorithm: 'Occam反演',
    reason: 'NLCG收敛过慢，切换Occam以改善收敛性',
    switchedBy: 'u2',
    switchedAt: ts(4),
  },
]

const regAdjustments: RegularizationAdjustment[] = [
  {
    id: 'r1',
    taskId: 't2',
    fromValue: 2.8,
    toValue: 3.5,
    reason: '反演发散趋势，增大正则化参数以增强模型光滑度',
    adjustedBy: 'u2',
    adjustedAt: ts(0, 4),
  },
  {
    id: 'r2',
    taskId: 't3',
    fromValue: 4.2,
    toValue: 5.0,
    reason: '检测到假异常，增大正则化以压制虚假结构',
    adjustedBy: 'u2',
    adjustedAt: ts(0, 7),
  },
  {
    id: 'r3',
    taskId: 't2',
    fromValue: 3.5,
    toValue: 3.0,
    reason: '正则化过大导致模型过度光滑，适当降低',
    adjustedBy: 'u1',
    adjustedAt: ts(0, 2),
  },
]

const historyModels: HistoryModel[] = [
  {
    id: 'hm1',
    surveyArea: '青藏高原东缘测区',
    modelName: 'L1测线Occam光滑模型',
    algorithm: 'Occam反演',
    regularization: 3.5,
    finalMisfit: 1.12,
    roughness: 3.45,
    stationCount: 32,
    frequencyRange: '0.001-1000Hz',
    completedAt: ts(5),
  },
  {
    id: 'hm2',
    surveyArea: '青藏高原东缘测区',
    modelName: 'L1测线NLCG锐化模型',
    algorithm: 'NLCG反演',
    regularization: 2.8,
    finalMisfit: 1.08,
    roughness: 4.12,
    stationCount: 32,
    frequencyRange: '0.001-1000Hz',
    completedAt: ts(30),
  },
  {
    id: 'hm3',
    surveyArea: '青藏高原东缘测区',
    modelName: 'L0测线Occam模型',
    algorithm: 'Occam反演',
    regularization: 4.0,
    finalMisfit: 1.25,
    roughness: 2.98,
    stationCount: 30,
    frequencyRange: '0.001-1000Hz',
    completedAt: ts(60),
  },
  {
    id: 'hm4',
    surveyArea: '华北克拉通测区',
    modelName: 'A剖面NLCG模型',
    algorithm: 'NLCG反演',
    regularization: 3.0,
    finalMisfit: 1.35,
    roughness: 5.21,
    stationCount: 45,
    frequencyRange: '0.01-1000Hz',
    completedAt: ts(45),
  },
  {
    id: 'hm5',
    surveyArea: '华北克拉通测区',
    modelName: 'A剖面Occam模型',
    algorithm: 'Occam反演',
    regularization: 4.5,
    finalMisfit: 1.48,
    roughness: 3.15,
    stationCount: 45,
    frequencyRange: '0.01-1000Hz',
    completedAt: ts(50),
  },
  {
    id: 'hm6',
    surveyArea: '南海北部陆缘测区',
    modelName: 'F测线RRI模型',
    algorithm: 'RRI反演',
    regularization: 4.5,
    finalMisfit: 1.05,
    roughness: 2.85,
    stationCount: 20,
    frequencyRange: '1-1000Hz',
    completedAt: ts(10),
  },
  {
    id: 'hm7',
    surveyArea: '南海北部陆缘测区',
    modelName: 'G测线Occam模型',
    algorithm: 'Occam反演',
    regularization: 5.2,
    finalMisfit: 1.22,
    roughness: 3.67,
    stationCount: 22,
    frequencyRange: '0.01-500Hz',
    completedAt: ts(90),
  },
]

const results: TaskResult[] = [
  {
    id: 'res1',
    taskId: 't1',
    modelUrl: '/results/t1/model.dat',
    crossSectionUrl: '/results/t1/cross_section.png',
    misfitUrl: '/results/t1/misfit_curve.png',
    finalMisfit: 1.12,
    finalRoughness: 3.45,
    totalIterations: 25,
    completedAt: ts(5),
    pushedToInterpreter: true,
  },
  {
    id: 'res2',
    taskId: 't9',
    modelUrl: '/results/t9/model.dat',
    crossSectionUrl: '/results/t9/cross_section.png',
    misfitUrl: '/results/t9/misfit_curve.png',
    finalMisfit: 1.05,
    finalRoughness: 2.85,
    totalIterations: 18,
    completedAt: ts(10),
    pushedToInterpreter: true,
  },
]

export const db = {
  users,
  surveyAreas,
  algorithms,
  surveyAreaPauseStatus: {
    '青藏高原东缘测区': { paused: false, falseAnomalyCount: 0 },
    '华北克拉通测区': { paused: false, falseAnomalyCount: 0 },
    '南海北部陆缘测区': { paused: false, falseAnomalyCount: 0 },
  },

  getTasks(): Task[] {
    return tasks
  },

  getTaskById(id: string): Task | undefined {
    return tasks.find((t) => t.id === id)
  },

  createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const task: Task = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    tasks.push(task)
    return task
  },

  updateTaskStatus(id: string, status: TaskStatus): Task | undefined {
    const task = tasks.find((t) => t.id === id)
    if (!task) return undefined
    task.previousStatus = task.status
    task.status = status
    task.updatedAt = new Date().toISOString()
    return task
  },

  canTransition(current: TaskStatus, target: TaskStatus): boolean {
    return VALID_TRANSITIONS[current]?.includes(target) ?? false
  },

  getIterationsByTaskId(taskId: string): InversionIteration[] {
    return iterations.filter((i) => i.taskId === taskId)
  },

  addIteration(data: Omit<InversionIteration, 'id'>): InversionIteration {
    const iter: InversionIteration = { ...data, id: uuidv4() }
    iterations.push(iter)
    return iter
  },

  getAlerts(): Alert[] {
    return alerts
  },

  getAlertById(id: string): Alert | undefined {
    return alerts.find((a) => a.id === id)
  },

  getAlertsBySurveyArea(surveyArea: string): Alert[] {
    return alerts.filter((a) => a.surveyArea === surveyArea)
  },

  updateAlertStatus(id: string, status: Alert['status'], processedBy?: string): Alert | undefined {
    const alert = alerts.find((a) => a.id === id)
    if (!alert) return undefined
    alert.status = status
    if (processedBy) {
      alert.processedBy = processedBy
      alert.processedAt = new Date().toISOString()
    }
    return alert
  },

  addAlert(data: Omit<Alert, 'id' | 'createdAt'>): Alert {
    const alert: Alert = { ...data, id: uuidv4(), createdAt: new Date().toISOString() }
    alerts.push(alert)
    return alert
  },

  getApprovals(): Approval[] {
    return approvals
  },

  getApprovalsByTaskId(taskId: string): Approval[] {
    return approvals.filter((a) => a.taskId === taskId)
  },

  getApprovalById(id: string): Approval | undefined {
    return approvals.find((a) => a.id === id)
  },

  addApproval(data: Omit<Approval, 'id' | 'createdAt' | 'updatedAt'>): Approval {
    const approval: Approval = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    approvals.push(approval)
    return approval
  },

  updateApprovalStatus(id: string, status: Approval['status'], comment?: string): Approval | undefined {
    const approval = approvals.find((a) => a.id === id)
    if (!approval) return undefined
    approval.status = status
    if (comment) approval.comment = comment
    approval.updatedAt = new Date().toISOString()
    return approval
  },

  getAlgorithmSwitchesByTaskId(taskId: string): AlgorithmSwitch[] {
    return algorithmSwitches.filter((s) => s.taskId === taskId)
  },

  addAlgorithmSwitch(data: Omit<AlgorithmSwitch, 'id'>): AlgorithmSwitch {
    const sw: AlgorithmSwitch = { ...data, id: uuidv4() }
    algorithmSwitches.push(sw)
    return sw
  },

  getRegAdjustmentsByTaskId(taskId: string): RegularizationAdjustment[] {
    return regAdjustments.filter((r) => r.taskId === taskId)
  },

  addRegAdjustment(data: Omit<RegularizationAdjustment, 'id'>): RegularizationAdjustment {
    const adj: RegularizationAdjustment = { ...data, id: uuidv4() }
    regAdjustments.push(adj)
    return adj
  },

  getHistoryModelsBySurveyArea(surveyArea: string): HistoryModel[] {
    return historyModels.filter((m) => m.surveyArea === surveyArea)
  },

  getResultByTaskId(taskId: string): TaskResult | undefined {
    return results.find((r) => r.taskId === taskId)
  },

  addResult(data: Omit<TaskResult, 'id'>): TaskResult {
    const result: TaskResult = { ...data, id: uuidv4() }
    results.push(result)
    return result
  },

  getUserById(id: string): User | undefined {
    return users.find((u) => u.id === id)
  },

  isSurveyAreaPaused(area: string): boolean {
    return this.surveyAreaPauseStatus[area]?.paused ?? false
  },

  pauseSurveyArea(area: string, reason: string): void {
    if (this.surveyAreaPauseStatus[area]) {
      this.surveyAreaPauseStatus[area].paused = true
      this.surveyAreaPauseStatus[area].pausedAt = new Date().toISOString()
      this.surveyAreaPauseStatus[area].pausedReason = reason
    } else {
      this.surveyAreaPauseStatus[area] = { paused: true, falseAnomalyCount: 0, pausedAt: new Date().toISOString(), pausedReason: reason }
    }
    this.addAlert({
      taskId: '',
      surveyArea: area,
      type: 'system',
      severity: 'critical',
      message: `测区"${area}"已暂停: ${reason}`,
      status: 'active',
    })
  },

  resumeSurveyArea(area: string): void {
    if (this.surveyAreaPauseStatus[area]) {
      this.surveyAreaPauseStatus[area].paused = false
      this.surveyAreaPauseStatus[area].pausedAt = undefined
      this.surveyAreaPauseStatus[area].pausedReason = undefined
    }
  },

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = tasks.find((t) => t.id === id)
    if (!task) return undefined
    Object.assign(task, updates, { updatedAt: new Date().toISOString() })
    return task
  },

  getHistoryModels(): HistoryModel[] {
    return historyModels
  },

  getResults(): TaskResult[] {
    return results
  },

  addApprovalAndProgress(taskId: string, stage: Approval['stage'], status: Approval['status'], reviewer: string, comment?: string): Approval {
    const approval = this.addApproval({ taskId, stage, status, reviewer, comment })
    if (stage === 'data_verifier' && status === 'approved') {
      const existing = this.getApprovalsByTaskId(taskId)
      const hasPendingChief = existing.some((a) => a.stage === 'chief_engineer' && a.status === 'pending')
      if (!hasPendingChief) {
        this.addApproval({ taskId, stage: 'chief_engineer', status: 'pending', reviewer: 'u2' })
      }
    }
    if (stage === 'chief_engineer' && status === 'approved') {
      let result = this.getResultByTaskId(taskId)
      if (result) {
        result.pushedToInterpreter = true
      } else {
        const task = this.getTaskById(taskId)
        if (task) {
          const iters = this.getIterationsByTaskId(taskId)
          const lastIter = iters[iters.length - 1]
          this.addResult({
            taskId,
            modelUrl: `/results/${taskId}/model.dat`,
            crossSectionUrl: `/results/${taskId}/cross_section.png`,
            misfitUrl: `/results/${taskId}/misfit_curve.png`,
            finalMisfit: lastIter ? lastIter.misfit : 1.0,
            finalRoughness: lastIter ? lastIter.roughness : 3.0,
            totalIterations: iters.length,
            completedAt: new Date().toISOString(),
            pushedToInterpreter: true,
          })
        }
      }
    }
    return approval
  },

  incrementFalseAnomaly(surveyArea: string): number {
    if (!this.surveyAreaPauseStatus[surveyArea]) {
      this.surveyAreaPauseStatus[surveyArea] = { paused: false, falseAnomalyCount: 0 }
    }
    this.surveyAreaPauseStatus[surveyArea].falseAnomalyCount++
    return this.surveyAreaPauseStatus[surveyArea].falseAnomalyCount
  },

  updateTaskRegularization(id: string, value: number): Task | undefined {
    return this.updateTask(id, { regularization: value })
  },

  updateTaskAlgorithm(id: string, algorithm: string): Task | undefined {
    return this.updateTask(id, { algorithm })
  },

  getAllHistoryModels(): HistoryModel[] {
    return historyModels
  },

  getTaskNameById(id: string): string {
    const task = tasks.find((t) => t.id === id)
    return task ? task.name : ''
  },
}
