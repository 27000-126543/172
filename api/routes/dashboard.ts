import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/stats', (_req: Request, res: Response): void => {
  const tasks = db.getTasks()
  const alerts = db.getAlerts()

  const statusCounts: Record<string, number> = {}
  for (const t of tasks) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
  }

  const activeTasks = tasks.filter(
    (t) => !['completed', 'rollback'].includes(t.status),
  ).length

  const activeAlerts = alerts.filter((a) => a.status === 'active').length
  const criticalAlerts = alerts.filter(
    (a) => a.status === 'active' && a.severity === 'critical',
  ).length

  const surveyAreaStats = db.surveyAreas.map((area) => {
    const areaTasks = tasks.filter((t) => t.surveyArea === area)
    const areaAlerts = alerts.filter(
      (a) => a.surveyArea === area && a.status === 'active',
    )
    return {
      surveyArea: area,
      totalTasks: areaTasks.length,
      activeTasks: areaTasks.filter(
        (t) => !['completed', 'rollback'].includes(t.status),
      ).length,
      completedTasks: areaTasks.filter((t) => t.status === 'completed').length,
      activeAlerts: areaAlerts.length,
      paused: areaAlerts.some((a) => a.severity === 'critical'),
    }
  })

  const algorithmUsage: Record<string, number> = {}
  for (const t of tasks) {
    algorithmUsage[t.algorithm] = (algorithmUsage[t.algorithm] || 0) + 1
  }

  const avgRegularization =
    tasks.length > 0
      ? Math.round(
          (tasks.reduce((s, t) => s + t.regularization, 0) / tasks.length) * 100,
        ) / 100
      : 0

  res.json({
    success: true,
    data: {
      totalTasks: tasks.length,
      activeTasks,
      completedTasks: statusCounts['completed'] || 0,
      rollbackTasks: statusCounts['rollback'] || 0,
      statusCounts,
      activeAlerts,
      criticalAlerts,
      surveyAreaStats,
      algorithmUsage,
      avgRegularization,
    },
  })
})

router.get('/trend', (req: Request, res: Response): void => {
  const days = parseInt(req.query.days as string, 10) || 30

  const tasks = db.getTasks()
  const now = new Date()

  const trend = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000)
    const dateStr = date.toISOString().split('T')[0]

    const created = tasks.filter(
      (t) => t.createdAt.split('T')[0] === dateStr,
    ).length

    const completed = tasks.filter(
      (t) => t.status === 'completed' && t.updatedAt.split('T')[0] === dateStr,
    ).length

    const baseActive = Math.floor(Math.random() * 3) + 2
    const baseAlerts = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0

    trend.push({
      date: dateStr,
      created,
      completed,
      activeTasks: baseActive + created - completed,
      alerts: baseAlerts,
    })
  }

  res.json({ success: true, data: trend })
})

export default router
