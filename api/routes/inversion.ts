import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/:taskId/iterations', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const iters = db.getIterationsByTaskId(task.id)
  iters.sort((a, b) => a.iteration - b.iteration)

  res.json({ success: true, data: iters })
})

router.get('/:taskId/adjustments', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const adjustments = db.getRegAdjustmentsByTaskId(task.id)
  adjustments.sort((a, b) => new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime())

  res.json({ success: true, data: adjustments })
})

router.get('/:taskId/switches', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const switches = db.getAlgorithmSwitchesByTaskId(task.id)
  switches.sort((a, b) => new Date(b.switchedAt).getTime() - new Date(a.switchedAt).getTime())

  res.json({ success: true, data: switches })
})

router.post('/:taskId/adjust', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const { toValue, reason, adjustedBy } = req.body
  if (toValue === undefined || !reason) {
    res.status(400).json({ success: false, error: '调整值和原因为必填项' })
    return
  }

  const fromValue = task.regularization
  const adjustment = db.addRegAdjustment({
    taskId: task.id,
    fromValue,
    toValue,
    reason,
    adjustedBy: adjustedBy || 'u1',
    adjustedAt: new Date().toISOString(),
  })

  const updatedTask = db.updateTaskRegularization(task.id, toValue)

  res.status(201).json({ success: true, data: { adjustment, task: updatedTask } })
})

router.post('/:taskId/switch-algorithm', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const { toAlgorithm, reason, switchedBy } = req.body
  if (!toAlgorithm || !reason) {
    res.status(400).json({ success: false, error: '目标算法和原因为必填项' })
    return
  }

  const fromAlgorithm = task.algorithm
  const sw = db.addAlgorithmSwitch({
    taskId: task.id,
    fromAlgorithm,
    toAlgorithm,
    reason,
    switchedBy: switchedBy || 'u1',
    switchedAt: new Date().toISOString(),
  })

  const updatedTask = db.updateTaskAlgorithm(task.id, toAlgorithm)

  res.status(201).json({ success: true, data: { switch: sw, task: updatedTask } })
})

router.put('/:taskId/regularization', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  if (task.status !== 'inversion_iter') {
    res.status(400).json({ success: false, error: '只能对反演迭代中的任务调整正则化参数' })
    return
  }

  const { value, reason, adjustedBy } = req.body
  if (value === undefined || !reason) {
    res.status(400).json({ success: false, error: '调整值和原因为必填项' })
    return
  }

  const fromValue = task.regularization
  const adjustment = db.addRegAdjustment({
    taskId: task.id,
    fromValue,
    toValue: value,
    reason,
    adjustedBy: adjustedBy || 'u1',
    adjustedAt: new Date().toISOString(),
  })

  const updated = db.updateTask(task.id, { regularization: value })

  res.json({ success: true, data: { task: updated, adjustment } })
})

router.put('/:taskId/algorithm', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  if (task.status !== 'inversion_iter') {
    res.status(400).json({ success: false, error: '只能对反演迭代中的任务切换算法' })
    return
  }

  const { algorithm, reason, switchedBy } = req.body
  if (!algorithm || !reason) {
    res.status(400).json({ success: false, error: '目标算法和原因为必填项' })
    return
  }

  const fromAlgorithm = task.algorithm
  const sw = db.addAlgorithmSwitch({
    taskId: task.id,
    fromAlgorithm,
    toAlgorithm: algorithm,
    reason,
    switchedBy: switchedBy || 'u1',
    switchedAt: new Date().toISOString(),
  })

  const updated = db.updateTask(task.id, { algorithm })

  res.json({ success: true, data: { task: updated, switch: sw } })
})

router.post('/:taskId/pause', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const updated = db.updateTaskStatus(task.id, 'rollback')
  res.json({ success: true, data: updated })
})

router.post('/:taskId/resume', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const updated = db.updateTaskStatus(task.id, 'inversion_iter')
  res.json({ success: true, data: updated })
})

export default router
