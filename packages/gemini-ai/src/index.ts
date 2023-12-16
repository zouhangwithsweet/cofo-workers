import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = new Hono<{
  Bindings: {
    GEMINI_KEY: string
  }
}>()

let genAI: GoogleGenerativeAI | null = null

app.get('/', (c) => c.text('Hello Hono!'))

app.get('/chat', async (c) => {
  if (!genAI) genAI = new GoogleGenerativeAI(c.env.GEMINI_KEY)

  if (!c.req.query('q')) {
    return c.text('Hello world')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 100,
    },
  })
  const result = await chat.sendMessageStream(c.req.query('q')!)


  return streamSSE(c, async (stream) => {
    c.header('Content-Type', 'text/event-stream; charset=utf-8')
  
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      await stream.writeSSE({ data: chunkText, event: 'time-update', id: '' + Date.now() })
    }
  })
})

export default app
