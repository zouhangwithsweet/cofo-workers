import { Hono } from 'hono'
// `shiki/core` entry does not include any themes or languages or the wasm binary.
import { getHighlighterCore, loadWasm } from 'shiki/core'

await loadWasm(import('shiki/onig.wasm'))

const app = new Hono()

app.get('/', async (c) => {
  try {
    const highlighter = await getHighlighterCore({
      themes: [],
      langs: [
        import('shiki/langs/javascript.mjs'),
        // shiki will try to interop the module with the default export
        () => import('shiki/langs/css.mjs'),
      ],
    })

    // optionally, load themes and languages after creation
    await highlighter.loadTheme(import('shiki/themes/vitesse-light.mjs'))

    const queryCode = c.req.query('code')

    if (!queryCode) {
      return c.text('Please provide a code query param')
    }

    const code = highlighter.codeToHtml(queryCode, {
      lang: 'css',
      theme: 'vitesse-light',
    })
    return c.html(code)
  } catch (error: any) {
    return c.text(JSON.stringify(error.message))
  }
})

export default app
