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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>Agent. Hang</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/css/uno.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.0/github-markdown.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.0/github-markdown-dark.css" />
      </head>
      <body class="dark flex items-center justify-center bg-#101010 font-[Figtree]">
        <div class="relative flex flex-col gap-4 mx-auto md:w-180 lt-md:w-90% h-140 py-4 px-6 border-1 border-solid border-[#383838] bg-[#252525] rounded-4 overflow-hidden">
          <div class="text-xl font-500 text-white">Agent. Hang</div>
          <div class="markdown-body content relative p-4 flex-1 overflow-y-auto scroll-smooth rounded-2 scrollbar scrollbar-rounded scrollbar-w-0"></div>
          <div class="flex p-2 justify-center items-end gap-4 self-stretch rounded-2 border-1 border-solid border-[#383838] bg-[#222]">
            <textarea
              id="q"
              class="resize-none p-0 min-h-8 lh-8 flex-1 bg-transparent border-none outline-none text-sm text-[#A2A2A2]"
              rows={1}
              autoComplete="off"
              placeholder=""
            />
            <button class="h-8 flex px-4 justify-center items-center rounded-1.5 text-3.5 font-500 cursor-pointer border-none outline-none bg-gradient-linear bg-gradient-[90deg,rgba(37,174,106,0.60)_0%,rgba(104,217,75,0.60)_100%] bg-transparent text-white">
              send
            </button>
          </div>
        </div>
      </body>
      <script type="module" src="/static/js/chat.js" />
    </html>
  )
})

app.post('/chat', async (c) => {
  if (!genAI) genAI = new GoogleGenerativeAI(c.env.GEMINI_KEY)

  try {
    const body = await c.req.json<{
      q?: string
      history?: InputContent[]
    }>()
    if (!body.q) {
      return c.text('No question provided')
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
  } catch (error: any) {
    c.status(500)
    return c.json({ error: error?.message || 'Unknown error' })
  }
})

export default app
