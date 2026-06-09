import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { taskId, stage, status } = req.query

  let filtered = db.getApprovals()

  if (taskId) {
    filtered = filtered.filter((a) => a.taskId === taskId)
  }
  if (stage) {
    filtered = filtered.filter((a) => a.stage === stage)
  }
  if (status) {
    filtered = filtered.filter((a) => a.status === status)
  }

  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  res.json({ success: true, data: filtered })
})

router.post('/:taskId/approve', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const { stage, reviewer, comment } = req.body
  if (!stage || !reviewer) {
    res.status(400).json({ success: false, error: '审批阶段和审批人为必填项' })
    return
  }

  const existingApprovals = db.getApprovalsByTaskId(task.id)
  const pendingApproval = existingApprovals.find(
    (a) => a.stage === stage && a.status === 'pending',
  )

  let approval
  let newApproval = null

  if (pendingApproval) {
    approval = db.updateApprovalStatus(pendingApproval.id, 'approved', comment)

    if (stage === 'data_verifier') {
      const hasPendingChief = existingApprovals.some((a) => a.stage === 'chief_engineer' && a.status === 'pending')
      if (!hasPendingChief) {
        newApproval = db.addApproval({ taskId: task.id, stage: 'chief_engineer', status: 'pending', reviewer: 'u2' })
      }
    }

    if (stage === 'chief_engineer') {
      db.updateApprovalStatus(pendingApproval.id, 'approved', (comment ? comment + '；' : '') + '已推送至地质解释组')

      let result = db.getResultByTaskId(task.id)
      if (result) {
        result.pushedToInterpreter = true
      } else {
        const iters = db.getIterationsByTaskId(task.id)
        const lastIter = iters[iters.length - 1]
        db.addResult({
          taskId: task.id,
          modelUrl: `/results/${task.id}/model.dat`,
          crossSectionUrl: `/results/${task.id}/cross_section.png`,
          misfitUrl: `/results/${task.id}/misfit_curve.png`,
          finalMisfit: lastIter ? lastIter.misfit : 1.0,
          finalRoughness: lastIter ? lastIter.roughness : 3.0,
          totalIterations: iters.length,
          completedAt: new Date().toISOString(),
          pushedToInterpreter: true,
        })
      }
    }
  } else {
    approval = db.addApprovalAndProgress(task.id, stage, 'approved', reviewer, comment)
    if (stage === 'data_verifier') {
      const allApprovals = db.getApprovalsByTaskId(task.id)
      const chiefPending = allApprovals.find((a) => a.stage === 'chief_engineer' && a.status === 'pending')
      if (chiefPending) {
        newApproval = chiefPending
      } else {
        newApproval = db.addApproval({ taskId: task.id, stage: 'chief_engineer', status: 'pending', reviewer: 'u2' })
      }
    }
    if (stage === 'chief_engineer') {
      const chiefApprovals = db.getApprovalsByTaskId(task.id).filter(
        (a) => a.stage === 'chief_engineer' && a.status === 'approved',
      )
      if (chiefApprovals.length > 0) {
        const last = chiefApprovals[chiefApprovals.length - 1]
        db.updateApprovalStatus(last.id, 'approved', (last.comment ? last.comment + '；' : '') + '已推送至地质解释组')
      }
    }
  }

  res.json({ success: true, data: { approval, newApproval } })
})

router.post('/:taskId/reject', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const { stage, reviewer, comment } = req.body
  if (!stage || !reviewer) {
    res.status(400).json({ success: false, error: '审批阶段和审批人为必填项' })
    return
  }

  if (!comment) {
    res.status(400).json({ success: false, error: '驳回时必须填写意见' })
    return
  }

  const existingApprovals = db.getApprovalsByTaskId(task.id)
  const pendingApproval = existingApprovals.find(
    (a) => a.stage === stage && a.status === 'pending',
  )

  let approval
  let newApproval = null

  if (pendingApproval) {
    approval = db.updateApprovalStatus(pendingApproval.id, 'rejected', comment)
  } else {
    approval = db.addApproval({
      taskId: task.id,
      stage,
      status: 'rejected',
      reviewer,
      comment,
    })
  }

  res.json({ success: true, data: { approval, newApproval } })
})

router.get('/:taskId/history', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const history = db.getApprovalsByTaskId(task.id)
  history.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  res.json({ success: true, data: history })
})

export default router
