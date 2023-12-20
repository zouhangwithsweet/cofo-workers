import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import type { FC } from 'hono/jsx'

let images: Map<string, string[]> = new Map()
const getImageUrl = (hash: string) => {
  return `https://ci.xiaohongshu.com/${hash}?imageView2/2/w/format/png`
}

const app = new Hono<{
  Bindings: {}
}>()

app.get('/static/*', serveStatic({ root: './' }))

const Layout: FC = (props) => {
  return (
    <html>
      <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1"></meta>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css"></link>
      <link rel="stylesheet" href="/static/css/uno.css" />

      <body class="pb-10 px-4 bg-#121212 antialiased">{props.children}</body>
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
            class="flex min-h-[80px] w-full rounded-md border px-3 py-2 bg-#222 resize-none text-white border-#383838 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="小红书分享链接"
          ></textarea>
          <button class="flex ml-auto items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-gradient-linear bg-gradient-[90deg,#25AE6A_0%,#68D94B_100%] text-white h-9 px-4 py-1 w-auto flex-shrink-0 w-auto flex-shrink-0">
            想连接了
          </button>
        </div>
        <div class="text-sm font-500 text-#a2a2a2">选择你喜欢的峰哥名言</div>
        <div class="flex flex-wrap gap-2 gap-y-3">
          {[
            '/static/images/slogan.svg',
            '/static/images/slogan_two.svg',
            '/static/images/slogan_three.svg',
            '/static/images/slogan_four.svg',
            '/static/images/slogan_five.svg',
          ].map((src) => (
            <div
              key={src}
              class="slogan relative before:absolute before:z-2 before:h-1/5 before:bottom-0 before:left-0 before:right-0 before:bg-green-600 after:content-['_'] hover:after:opacity-60 after:opacity-20 after:blur-sm after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0 after:bg-yellow-300"
            >
              <img src={src} alt="" class="relative z-10 cursor-pointer" />
            </div>
          ))}
        </div>
        <div class="grid grid-cols-2 gap-2"></div>
      </div>
    </Layout>
  )
})

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
      JSON.parse(html || '{}')
        ?.note.noteDetailMap[key!].note.imageList.map((item: { urlDefault: string }) => item.urlDefault)
        .map((url: string) => getImageUrl(new URL(url).pathname.split('/').pop()?.split('!')[0]!))
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
