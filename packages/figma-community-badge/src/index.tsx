import { Hono } from 'hono'

const app = new Hono()

async function readStream(stream: Response['body']) {
  const reader = stream!.getReader()
  const chunks: any[] = []

  async function read() {
    const { done, value } = await reader.read()
    if (done) {
      return chunks
    }
    chunks.push(value)
    return read()
  }

  return read()
}

app.get('/figma/:id', async (c) => {
  const id = c.req.param('id')
  const decoder = new TextDecoder()
  const response = await fetch(`https://www.figma.com/api/plugins/${id}/versions`)
  const stream = response.body

  try {
    const dataChunks = await readStream(stream)
    const final = new Uint8Array(
      dataChunks.reduce((acc, curr) => {
        acc.push(...curr)
        return acc
      }, [])
    )
    const result = decoder.decode(final)
    const count = JSON.parse(result).meta.plugin.unique_run_count

    c.header('Content-Type', 'image/svg+xml;charset=utf-8')
    c.header('Cache-Control', `max-age=${2 * 24 * 60 * 60},public`)

    return c.body(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="20" role="img" aria-label="figma user: ${count}"><title>figma user: ${count}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="100" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="69" height="20" fill="#555"/><rect x="69" width="31" height="20" fill="#04cb81"/><rect width="100" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="355" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="590">figma user</text><text x="355" y="140" transform="scale(.1)" fill="#fff" textLength="590">figma user</text><text aria-hidden="true" x="835" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="210">${count}</text><text x="835" y="140" transform="scale(.1)" fill="#fff" textLength="210">${count}</text></g></svg>`
    )
  } catch (error) {
    console.error('Error reading stream:', error)
  }
})

export default app
