import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/area-status', (req: Request, res: Response): void => {
  const areaStatuses = db.surveyAreas.map((name) => {
    const areaAlerts = db.getAlertsBySurveyArea(name)
    const pauseInfo = db.surveyAreaPauseStatus[name]
    return {
      name,
      paused: db.isSurveyAreaPaused(name),
      activeAlerts: areaAlerts.filter((a) => a.status === 'active').length,
      criticalAlerts: areaAlerts.filter((a) => a.status === 'active' && a.severity === 'critical').length,
      falseAnomalyCount: pauseInfo?.falseAnomalyCount ?? 0,
      pausedAt: pauseInfo?.pausedAt,
      pausedReason: pauseInfo?.pausedReason,
    }
  })
  res.json({ success: true, data: areaStatuses })
})

router.get('/', (req: Request, res: Response): void => {
  const { type, severity, status, surveyArea } = req.query

  let filtered = db.getAlerts()

  if (type) {
    filtered = filtered.filter((a) => a.type === type)
  }
  if (severity) {
    filtered = filtered.filter((a) => a.severity === severity)
  }
  if (status) {
    filtered = filtered.filter((a) => a.status === status)
  }
  if (surveyArea) {
    filtered = filtered.filter((a) => a.surveyArea === surveyArea)
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({ success: true, data: filtered })
})

router.put('/:id/process', (req: Request, res: Response): void => {
  const alert = db.getAlertById(req.params.id)
  if (!alert) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  if (alert.status !== 'active') {
    res.status(400).json({ success: false, error: '只能处理活跃状态的告警' })
    return
  }

  const { processedBy } = req.body
  const updated = db.updateAlertStatus(alert.id, 'processed', processedBy)

  let areaPaused = false
  if (alert.type === 'false_anomaly') {
    const newCount = db.incrementFalseAnomaly(alert.surveyArea)
    if (newCount >= 3 && !db.isSurveyAreaPaused(alert.surveyArea)) {
      db.pauseSurveyArea(alert.surveyArea, `该测区已累计${newCount}个假异常告警，自动暂停`)
      areaPaused = true
    }
  }

  res.json({ success: true, data: { alert: updated, areaPaused } })
})

router.put('/:id/dismiss', (req: Request, res: Response): void => {
  const alert = db.getAlertById(req.params.id)
  if (!alert) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  if (alert.status !== 'active') {
    res.status(400).json({ success: false, error: '只能忽略活跃状态的告警' })
    return
  }

  const { processedBy } = req.body
  const updated = db.updateAlertStatus(alert.id, 'dismissed', processedBy)

  let areaPaused = false
  if (alert.type === 'false_anomaly') {
    const newCount = db.incrementFalseAnomaly(alert.surveyArea)
    if (newCount >= 3 && !db.isSurveyAreaPaused(alert.surveyArea)) {
      db.pauseSurveyArea(alert.surveyArea, `该测区已累计${newCount}个假异常告警，自动暂停`)
      areaPaused = true
    }
  }

  res.json({ success: true, data: { alert: updated, areaPaused } })
})

router.get('/survey-area/:id/status', (req: Request, res: Response): void => {
  const surveyAreaId = req.params.id
  const surveyArea = db.surveyAreas[parseInt(surveyAreaId, 10)]

  if (!surveyArea) {
    res.status(404).json({ success: false, error: '测区不存在' })
    return
  }

  const areaAlerts = db.getAlertsBySurveyArea(surveyArea)
  const activeCritical = areaAlerts.filter(
    (a) => a.status === 'active' && a.severity === 'critical',
  )
  const activeWarnings = areaAlerts.filter(
    (a) => a.status === 'active' && a.severity === 'warning',
  )

  const paused = activeCritical.length > 0
  const pauseReason = paused
    ? activeCritical.map((a) => a.message).join('; ')
    : null

  res.json({
    success: true,
    data: {
      surveyArea,
      paused,
      pauseReason,
      activeAlerts: areaAlerts.filter((a) => a.status === 'active'),
      criticalCount: activeCritical.length,
      warningCount: activeWarnings.length,
    },
  })
})

export default router
