import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { streamSSE } from 'hono/streaming'
import { GoogleGenerativeAI, InputContent } from '@google/generative-ai'

const app = new Hono<{
  Bindings: {
    GEMINI_KEY: string
  }
}>()

app.get('/static/*', serveStatic({ root: './' }))

let genAI: GoogleGenerativeAI | null = null

app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <title>Test Site</title>
        <script type="module" src="/static/js/chat.js" />
      </head>
      <body>Hello!</body>
    </html>
  )
})

app.post('/chat', async (c) => {
  if (!genAI) genAI = new GoogleGenerativeAI(c.env.GEMINI_KEY)

  const body = await c.req.json<{
    q?: string,
    history?: InputContent[]
  }>()
  if (!body.q) {
    return c.text('Hello world')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const chat = model.startChat({
    history: body.history || [],
    generationConfig: {},
  })
  const result = await chat.sendMessageStream(body.q!)

  return streamSSE(c, async (stream) => {
    c.header('Content-Type', 'text/event-stream; charset=utf-8')

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      await stream.writeSSE({ data: chunkText, event: 'time-update', id: '' + Date.now() })
    }
  })
})

export default app
