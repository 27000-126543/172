import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import inversionRoutes from './routes/inversion.js'
import approvalRoutes from './routes/approval.js'
import alertRoutes from './routes/alerts.js'
import recommendRoutes from './routes/recommend.js'
import dashboardRoutes from './routes/dashboard.js'
import resultsRoutes from './routes/results.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/inversion', inversionRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/recommend', recommendRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/results', resultsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
