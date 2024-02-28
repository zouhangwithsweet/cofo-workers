import { Hono } from 'hono'
// `shiki/core` entry does not include any themes or languages or the wasm binary.
import { getHighlighterCore, loadWasm } from 'shiki/core'
// directly import the theme and language modules, only the ones you imported will be bundled.
import nord from 'shiki/themes/nord.mjs'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const res = import('shiki/onig.wasm')
    console.log(res)
    await loadWasm(res)

    const highlighter = await getHighlighterCore({
      themes: [
        // instead of strings, you need to pass the imported module
        nord,
        // or a dynamic import if you want to do chunk splitting
        import('shiki/themes/material-theme-ocean.mjs'),
      ],
      langs: [
        import('shiki/langs/javascript.mjs'),
        // shiki will try to interop the module with the default export
        () => import('shiki/langs/css.mjs'),
      ],
    })

    // optionally, load themes and languages after creation
    await highlighter.loadTheme(import('shiki/themes/vitesse-light.mjs'))

    const code = highlighter.codeToHtml('const a = 1', {
      lang: 'javascript',
      theme: 'material-theme-ocean',
    })
    return c.text('Hello Hono!')
  } catch (error: any) {
    return c.text(JSON.stringify(error.message))
  }
})

export default app
