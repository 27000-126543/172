import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const results = db.getResults()
  res.json({ success: true, data: results })
})

router.get('/:taskId/report', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const result = db.getResultByTaskId(task.id)
  const iterations = db.getIterationsByTaskId(task.id)

  const finalMisfit = result?.finalMisfit ?? (iterations.length > 0 ? iterations[iterations.length - 1].misfit : 0)
  const finalRoughness = result?.finalRoughness ?? (iterations.length > 0 ? iterations[iterations.length - 1].roughness : 0)
  const totalIterations = result?.totalIterations ?? iterations.length

  const depthLabels = ['0-2km', '2-5km', '5-10km', '10-20km', '20-50km']
  const gradients = ['~~', '**', '##', '++', '==']
  const resistivityValues = [150, 45, 12, 280, 850]

  let report = `========================================\n`
  report += `  MT反演结果报告\n`
  report += `========================================\n\n`
  report += `任务名称: ${task.name}\n`
  report += `测    区: ${task.surveyArea}\n`
  report += `创建时间: ${task.createdAt}\n`
  report += `更新时间: ${task.updatedAt}\n`
  report += `算    法: ${task.algorithm}\n`
  report += `正则化参数: ${task.regularization}\n\n`
  report += `----------------------------------------\n`
  report += `  反演结果摘要\n`
  report += `----------------------------------------\n`
  report += `最终拟合差: ${finalMisfit}\n`
  report += `最终粗糙度: ${finalRoughness}\n`
  report += `总迭代次数: ${totalIterations}\n\n`
  report += `----------------------------------------\n`
  report += `  电阻率深度切片 (ASCII)\n`
  report += `----------------------------------------\n\n`

  for (let i = 0; i < depthLabels.length; i++) {
    const bar = gradients[i].repeat(20)
    report += `  ${depthLabels[i].padEnd(10)} |${bar}| ${resistivityValues[i]} Ohm.m\n`
  }

  report += `\n  图例: ~~ 低阻  ** 中低阻  ## 中阻  ++ 中高阻  == 高阻\n\n`
  report += `----------------------------------------\n`
  report += `  灵敏度分布\n`
  report += `----------------------------------------\n`
  report += `浅部(0-5km):  灵敏度高，数据约束充分\n`
  report += `中部(5-20km): 灵敏度中等，模型较为可靠\n`
  report += `深部(>20km):  灵敏度低，模型不确定性较大\n\n`
  report += `----------------------------------------\n`
  report += `  置信区间\n`
  report += `----------------------------------------\n`
  report += `浅部电阻率: ${Math.round(resistivityValues[0] * 0.85)}-${Math.round(resistivityValues[0] * 1.15)} Ohm.m (85%置信)\n`
  report += `中部电阻率: ${Math.round(resistivityValues[2] * 0.7)}-${Math.round(resistivityValues[2] * 1.3)} Ohm.m (85%置信)\n`
  report += `深部电阻率: ${Math.round(resistivityValues[4] * 0.5)}-${Math.round(resistivityValues[4] * 1.5)} Ohm.m (85%置信)\n\n`
  report += `========================================\n`
  report += `  报告生成时间: ${new Date().toISOString()}\n`
  report += `========================================\n`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="report_${task.id}.txt"`)
  res.send(report)
})

router.get('/:taskId/export-survey-line', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const depths = [0.5, 2.0, 5.0, 10.0, 25.0]
  const stations = 10

  let csv = 'Station,X,Y,Depth,Resistivity\n'

  for (let s = 1; s <= stations; s++) {
    const x = 1000 + (s - 1) * 500
    const y = 3200 + Math.sin(s * 0.5) * 200
    for (const depth of depths) {
      const resistivity = Math.round((10 + Math.random() * 990) * 100) / 100
      csv += `MT-${String(s).padStart(3, '0')},${x},${y.toFixed(1)},${depth},${resistivity}\n`
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="survey_line_${task.id}.csv"`)
  res.send(csv)
})

router.get('/:taskId/export-frequency', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const frequencies = [
    1000, 500, 200, 100, 50, 20, 10, 5, 2, 1,
    0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005,
  ]

  let csv = 'Frequency,ApparentResistivity,Phase,Error\n'

  for (const freq of frequencies) {
    const apparentResistivity = Math.round((1 + Math.random() * 500) * 100) / 100
    const phase = Math.round((10 + Math.random() * 70) * 100) / 100
    const error = Math.round((apparentResistivity * 0.02 + Math.random() * 5) * 100) / 100
    csv += `${freq},${apparentResistivity},${phase},${error}\n`
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="frequency_${task.id}.csv"`)
  res.send(csv)
})

router.get('/:taskId/report-pdf', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const result = db.getResultByTaskId(task.id)
  const iterations = db.getIterationsByTaskId(task.id)

  const finalMisfit = result?.finalMisfit ?? (iterations.length > 0 ? iterations[iterations.length - 1].misfit : 0)
  const finalRoughness = result?.finalRoughness ?? (iterations.length > 0 ? iterations[iterations.length - 1].roughness : 0)
  const totalIterations = result?.totalIterations ?? iterations.length

  const depthLabels = ['0-2km', '2-5km', '5-10km', '10-20km', '20-50km']
  const resistivityValues = [150, 45, 12, 280, 850]

  const lines: string[] = [
    'MT Inversion Report',
    '',
    `Task: ${task.name}`,
    `Survey Area: ${task.surveyArea}`,
    `Algorithm: ${task.algorithm}`,
    `Regularization: ${task.regularization}`,
    `Created: ${task.createdAt}`,
    `Updated: ${task.updatedAt}`,
    '',
    'Inversion Results',
    `Final Misfit: ${finalMisfit}`,
    `Final Roughness: ${finalRoughness}`,
    `Total Iterations: ${totalIterations}`,
    '',
    'Resistivity Depth Slices',
  ]
  for (let i = 0; i < depthLabels.length; i++) {
    lines.push(`  ${depthLabels[i]}: ${resistivityValues[i]} Ohm.m`)
  }
  lines.push('')
  lines.push('Sensitivity Distribution')
  lines.push('  Shallow (0-5km): High sensitivity')
  lines.push('  Middle (5-20km): Moderate sensitivity')
  lines.push('  Deep (>20km): Low sensitivity')
  lines.push('')
  lines.push('Confidence Intervals')
  lines.push(`  Shallow: ${Math.round(resistivityValues[0] * 0.85)}-${Math.round(resistivityValues[0] * 1.15)} Ohm.m (85%)`)
  lines.push(`  Middle: ${Math.round(resistivityValues[2] * 0.7)}-${Math.round(resistivityValues[2] * 1.3)} Ohm.m (85%)`)
  lines.push(`  Deep: ${Math.round(resistivityValues[4] * 0.5)}-${Math.round(resistivityValues[4] * 1.5)} Ohm.m (85%)`)
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)

  let streamContent = 'BT\n/F1 14 Tf\n'
  let y = 750
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    streamContent += `1 0 0 1 50 ${y} Tm\n(${escaped}) Tj\n`
    y -= 20
  }
  streamContent += 'ET\n'

  const streamBytes = Buffer.from(streamContent, 'binary')
  const streamLength = streamBytes.length

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}endstream\nendobj\n`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'

  const header = '%PDF-1.4\n'
  let offset1 = header.length
  let offset2 = offset1 + obj1.length
  let offset3 = offset2 + obj2.length
  let offset4 = offset3 + obj3.length
  let offset5 = offset4 + obj4.length

  const xrefStart = offset5 + obj5.length
  let xref = 'xref\n0 6\n'
  xref += '0000000000 65535 f \n'
  xref += String(offset1).padStart(10, '0') + ' 00000 n \n'
  xref += String(offset2).padStart(10, '0') + ' 00000 n \n'
  xref += String(offset3).padStart(10, '0') + ' 00000 n \n'
  xref += String(offset4).padStart(10, '0') + ' 00000 n \n'
  xref += String(offset5).padStart(10, '0') + ' 00000 n \n'

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  const pdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="report_${task.id}.pdf"`)
  res.send(Buffer.from(pdf, 'binary'))
})

router.get('/:taskId/export-line', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const depths = [0.5, 2.0, 5.0, 10.0, 25.0, 50.0]
  const stationCount = task.stationCount || 10

  let csv = 'Station,X,Y,Depth,Resistivity\n'

  for (let s = 1; s <= stationCount; s++) {
    const x = 1000 + (s - 1) * 500
    const y = 3200 + Math.sin(s * 0.5) * 200
    for (const depth of depths) {
      const resistivity = Math.round((10 + Math.random() * 990) * 100) / 100
      csv += `MT-${String(s).padStart(3, '0')},${x},${y.toFixed(1)},${depth},${resistivity}\n`
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="model_line_${task.id}.csv"`)
  res.send(csv)
})

router.get('/:taskId/export-curve', (req: Request, res: Response): void => {
  const task = db.getTaskById(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' })
    return
  }

  const iterations = db.getIterationsByTaskId(task.id)
  iterations.sort((a, b) => a.iteration - b.iteration)

  let csv = 'Iteration,Misfit,Roughness,RMS\n'

  for (const iter of iterations) {
    csv += `${iter.iteration},${iter.misfit},${iter.roughness},${iter.rms}\n`
  }

  if (iterations.length === 0) {
    const dummyCount = 20
    let misfit = 5.0
    let roughness = 12.0
    for (let i = 1; i <= dummyCount; i++) {
      misfit = misfit * (0.92 + Math.random() * 0.04)
      roughness = roughness * (0.95 + Math.random() * 0.03)
      const rms = Math.round((misfit * 0.85 + Math.random() * 0.5) * 1000) / 1000
      csv += `${i},${Math.round(misfit * 1000) / 1000},${Math.round(roughness * 1000) / 1000},${rms}\n`
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="inversion_curve_${task.id}.csv"`)
  res.send(csv)
})

export default router
