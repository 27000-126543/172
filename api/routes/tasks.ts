import { Router, type Request, type Response } from 'express'
import { db, type TaskStatus } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { page = '1', pageSize = '10', status, survey_area } = req.query

  let filtered = db.getTasks()

  if (status) {
    filtered = filtered.filter((t) => t.status === status)
  }
  if (survey_area) {
    filtered = filtered.filter((t) => t.surveyArea === survey_area)
  }

  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const p = parseInt(page as string, 10)
  const ps = parseInt(pageSize as string, 10)
  const total = filtered.length
  const start = (p - 1) * ps
  const data = filtered.slice(start, start + ps)

  res.json({
    success: true,
    data: {
      items: data,
      total,
      page: p,
      pageSize: ps,
      totalPages: Math.ceil(total / ps),
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.id)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const iterations = db.getIterationsByTaskId(task.id)
  const approvals = db.getApprovalsByTaskId(task.id)
  const switches = db.getAlgorithmSwitchesByTaskId(task.id)
  const adjustments = db.getRegAdjustmentsByTaskId(task.id)
  const result = db.getResultByTaskId(task.id)

  res.json({
    success: true,
    data: {
      ...task,
      iterations,
      approvals,
      algorithmSwitches: switches,
      regAdjustments: adjustments,
      result: result || null,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, surveyArea, algorithm, regularization, createdBy, description, stationCount, frequencyRange, lineName, files } = req.body

  if (!name || !surveyArea) {
    res.status(400).json({ success: false, error: '任务名称和测区为必填项' })
    return
  }

  if (db.isSurveyAreaPaused(surveyArea)) {
    res.status(403).json({ success: false, error: '该测区已暂停，无法创建新任务，请联系首席科学家' })
    return
  }

  const task = db.createTask({
    name,
    surveyArea,
    status: 'pending_check',
    algorithm: algorithm || 'Occam反演',
    regularization: regularization || 3.5,
    createdBy: createdBy || 'u1',
    description: description || '',
    stationCount: stationCount || 0,
    frequencyRange: frequencyRange || '',
    lineName: lineName || '',
    files: Array.isArray(files) ? files : [],
  })

  res.status(201).json({ success: true, data: task })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const { status } = req.body as { status: TaskStatus }
  const task = db.getTaskById(req.params.id)

  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  if (!status) {
    res.status(400).json({ success: false, error: '必须指定目标状态' })
    return
  }

  if (!db.canTransition(task.status, status)) {
    res.status(400).json({
      success: false,
      error: `不允许从 ${task.status} 转换到 ${status}`,
    })
    return
  }

  const updated = db.updateTaskStatus(task.id, status)
  res.json({ success: true, data: updated })
})

router.post('/:id/rollback', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.id)

  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  if (task.status === 'rollback' || task.status === 'pending_check') {
    res.status(400).json({ success: false, error: `当前状态 ${task.status} 不允许回退操作` })
    return
  }

  const updated = db.updateTaskStatus(task.id, 'rollback')
  res.json({ success: true, data: updated })
})

export default router
