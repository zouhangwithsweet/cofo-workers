import { Hono } from 'hono'
// `shiki/core` entry does not include any themes or languages or the wasm binary.
import { getHighlighterCore, loadWasm } from 'shiki/core'
// directly import the theme and language modules, only the ones you imported will be bundled.
import nord from 'shiki/themes/nord.mjs'

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

    const code = highlighter.codeToHtml(`.text {
  width: 414px;
  height: 896px;
  border-radius: 32px;
  background: #F9F9F9;
}`, {
      lang: 'css',
      theme: 'vitesse-light',
    })
    return c.html(code)
  } catch (error: any) {
    return c.text(JSON.stringify(error.message))
  }
})

export default app
