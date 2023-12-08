import { Hono } from 'hono'
// import puppeteer, { BrowserWorker } from '@cloudflare/puppeteer'
import { serveStatic } from 'hono/cloudflare-workers'
import type { FC } from 'hono/jsx'

// const IMAGE_URL = /url\(\"(https?:\/\/[\w\-!\_]*\.\w+\.\w+\/\w+\/\w+\/\w+!?[\w\-!\_]*)\"\)/
let images: Map<string, string[]> = new Map()
const getImageUrl = (hash: string) => {
  return `https://ci.xiaohongshu.com/${hash}?imageView2/2/w/format/png`
}

const app = new Hono<{
  Bindings: {
    // MYBROWSER: BrowserWorker
  }
}>()

app.get('/static/*', serveStatic({ root: './' }))

const Layout: FC = (props) => {
  return (
    <html>
      <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1"></meta>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css"></link>
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""></link>
      <link href="https://fonts.googleapis.com/css2?family=Varela+Round&amp;display=swap" rel="stylesheet"></link>

      <body class="pb-10 px-4 bg-#f7f7f7 font-[Varela_Round]">{props.children}</body>

      <script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"></script>
      <script src="/static/js/index.js" />
    </html>
  )
}

app.get('/', async (c) => {
  return c.html(
    <Layout>
      <div class="mx-auto sm:w-90% sm:max-w-xl pt-4 sm:pt-8 sm:px-4 space-y-3 [&_*]:box-border">
        <div class="flex gap-2 flex-wrap">
          <textarea
            class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="小红书分享链接"
          ></textarea>
          <button class="inline-flex ml-auto items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-sky-400 text-white hover:bg-secondary/80 h-10 px-4 py-2 w-auto flex-shrink-0 w-auto flex-shrink-0">
            去水印
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2"></div>
      </div>
    </Layout>
  )
})

/**
 * @deprecated
 */
// app.get('/:href', async (c) => {
//   try {
//     images = []
//     const browser = await puppeteer.launch(c.env.MYBROWSER)
//     const page = await browser.newPage()
//     await page.goto(c.req.param('href'))
//     const slide = await page.$$eval('.swiper-slide', (els) => els.map((el) => el.getAttribute('style')))
//     await browser.close()

//     images = slide.map((s) => IMAGE_URL.exec(s)?.[1] || '')
//     return c.json({ slide: slide.map((_, index) => `/image/${index}`) })
//   } catch (error: any) {
//     return c.text(`error: ${c.req.param('href')} ${error}`)
//   }
// })

app.get('/rewriter/:href', async (c) => {
  try {
    const res = await fetch(c.req.param('href'))
    const key = new URL(res.url).pathname.split('/').pop()
    const html = /<script>window.__INITIAL_STATE__=({.*})<\/script>/
      .exec((await fetch(res.url).then((res) => res.text())).trim())?.[1]
      .replace(/undefined/g, 'null')
    images.clear()
    images.set(
      key!,
      JSON.parse(html || '{}')?.note.noteDetailMap[key!].note.imageList.map(
        (item: { urlDefault: string }) => item.urlDefault
      ).map((url: string) => getImageUrl(new URL(url).pathname.split('/').pop()?.split('!')[0]!))
    )
    return c.json({ slide: images.get(key!)?.map((_, index) => `/image/${key}/${index}`) })
  } catch (error) {
    return c.text(`error: ${c.req.param('href')} ${error}`)
  }
})

app.get('/image/:key/:id', async (c) => {
  try {
    const cache = images.get(c.req.param('key')!)!
    const img = await fetch(cache[+c.req.param('id')!])
    const buffer = await img.arrayBuffer()

    c.res.headers.append('Content-Type', `image/png`)

    return c.stream(async (stream) => {
      await stream.write(new Uint8Array(buffer))
    })
  } catch (error) {}
})

export default app
