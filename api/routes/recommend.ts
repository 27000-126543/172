import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/models', (req: Request, res: Response): void => {
  const { surveyArea } = req.query

  if (!surveyArea) {
    const allModels = db.getHistoryModels()

    const areaGroups: Record<string, typeof allModels> = {}
    for (const m of allModels) {
      if (!areaGroups[m.surveyArea]) areaGroups[m.surveyArea] = []
      areaGroups[m.surveyArea].push(m)
    }

    const recommendations = Object.entries(areaGroups).map(([area, models]) => {
      const algorithmCounts: Record<string, number> = {}
      const regValues: number[] = []

      for (const m of models) {
        algorithmCounts[m.algorithm] = (algorithmCounts[m.algorithm] || 0) + 1
        regValues.push(m.regularization)
      }

      let recommendedAlgorithm = 'Occam反演'
      let maxCount = 0
      for (const [algo, count] of Object.entries(algorithmCounts)) {
        if (count > maxCount) {
          maxCount = count
          recommendedAlgorithm = algo
        }
      }

      const recommendedRegularization = regValues.length > 0
        ? Math.round((regValues.reduce((s, v) => s + v, 0) / regValues.length) * 100) / 100
        : 3.5

      return {
        surveyArea: area,
        recommendedAlgorithm,
        recommendedRegularization,
        confidence: models.length > 0 ? Math.min(models.length * 15, 95) : 0,
        reason: models.length > 0
          ? `基于${models.length}个历史模型分析，${recommendedAlgorithm}在该测区表现最优，平均正则化参数${recommendedRegularization}`
          : '该测区暂无历史模型数据',
        models,
      }
    })

    res.json({
      success: true,
      data: { allModels, recommendations },
    })
    return
  }

  const models = db.getHistoryModelsBySurveyArea(surveyArea as string)

  const algorithmCounts: Record<string, number> = {}
  const regValues: number[] = []

  for (const m of models) {
    algorithmCounts[m.algorithm] = (algorithmCounts[m.algorithm] || 0) + 1
    regValues.push(m.regularization)
  }

  let recommendedAlgorithm = 'Occam反演'
  let maxCount = 0
  for (const [algo, count] of Object.entries(algorithmCounts)) {
    if (count > maxCount) {
      maxCount = count
      recommendedAlgorithm = algo
    }
  }

  const avgReg = regValues.length > 0
    ? Math.round((regValues.reduce((s, v) => s + v, 0) / regValues.length) * 100) / 100
    : 3.5

  res.json({
    success: true,
    data: {
      surveyArea,
      historyModels: models,
      recommendation: {
        algorithm: recommendedAlgorithm,
        regularization: avgReg,
        confidence: models.length > 0 ? Math.min(models.length * 15, 95) : 0,
        reason: models.length > 0
          ? `基于${models.length}个历史模型分析，${recommendedAlgorithm}在该测区表现最优，平均正则化参数${avgReg}`
          : '该测区暂无历史模型数据',
      },
    },
  })
})

router.get('/weights', (req: Request, res: Response): void => {
  const { surveyArea } = req.query

  const weightPresets: Record<string, { misfit: number; roughness: number; name: string; description: string }> = {
    '青藏高原东缘测区': {
      misfit: 0.6,
      roughness: 0.4,
      name: '深部结构优先',
      description: '青藏高原东缘深部结构复杂，优先保证拟合精度以揭示深部电性特征',
    },
    '华北克拉通测区': {
      misfit: 0.5,
      roughness: 0.5,
      name: '均衡模式',
      description: '华北克拉通结构相对稳定，拟合精度与模型光滑度均衡考虑',
    },
    '南海北部陆缘测区': {
      misfit: 0.7,
      roughness: 0.3,
      name: '浅部精度优先',
      description: '南海北部陆缘浅部结构对资源评价重要，优先提高浅部拟合精度',
    },
  }

  const allPresets = Object.entries(weightPresets).map(([key, val]) => ({
    surveyArea: key,
    ...val,
  }))

  if (!surveyArea) {
    res.json({
      success: true,
      data: {
        allPresets,
      },
    })
    return
  }

  const area = surveyArea as string
  const preset = weightPresets[area] || weightPresets['青藏高原东缘测区']

  res.json({
    success: true,
    data: {
      surveyArea: area,
      weights: preset,
      availablePresets: allPresets,
    },
  })
})

export default router
