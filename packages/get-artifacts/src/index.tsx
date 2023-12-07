import { Hono } from 'hono'
import { Octokit } from 'octokit'
import type { FC } from 'hono/jsx'

const app = new Hono<{
  Bindings: {
    GITHUB_TOKEN: string
    OWNER: string
    REPO: string
  }
}>()

const Layout: FC = (props) => {
  return (
    <html>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css"></link>
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""></link>
      <link href="https://fonts.googleapis.com/css2?family=Varela+Round&amp;display=swap" rel="stylesheet"></link>
      <script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"></script>
      <body class="pb-10 px-4 bg-#f7f7f7 font-[Varela_Round]">{props.children}</body>
    </html>
  )
}

const ReleaseItem = (props: { item: ArtifactList['data']['artifacts'][0]; index: number; isNew?: boolean }) => {
  const bgs = ['bg-#E8FFFF', 'bg-#fffaf0', 'bg-#fff8dc', 'bg-#F0F0F0', 'bg-#f0f8ff']

  return (
    <div
      class={`relative flex items-center justify-between p-4 dark:bg-gray-800 shadow rounded-md bg-opacity-90 ${
        bgs[props.index]
      }`}
    >
      {props.isNew && (
        <span class="absolute block top-0 right-0 px-2 py-.5 rounded-tr-md text-#d14e00 text-xs bg-[rgba(240,0,71,0.08)]">
          New
        </span>
      )}
      <div class="font-semibold">{props.item.name}.zip</div>
      <div class="text-gray-500 dark:text-gray-300">
        <span class="mr-2 text-sm">v.{props.item.id}</span>
        <span class="mr-2 text-sm">{new Date(props.item.created_at).toLocaleString()}</span>
        <a class="text-blue-500" href={`/download/${props.item.id}`}>
          Download
        </a>
      </div>
    </div>
  )
}

const Top: FC<{ items: ArtifactList['data']['artifacts'] }> = (props: { items: ArtifactList['data']['artifacts'] }) => {
  return (
    <Layout>
      <img
        class="fixed w-100vw h-100vh top-0 left-0 right-0 bottom-0 pointer-events-none -z-1 object-cover"
        src="https://github.com/zouhangwithsweet/zouhangwithsweet/blob/master/bg.png?raw=true"
      />
      <h1 class="max-w-xl mx-auto py-4 text-2xl font-bold underline underline-current">uno-ext releases</h1>
      <ul class="max-w-xl mx-auto flex flex-col gap-5">
        {props.items.map((item, index) => (
          <ReleaseItem item={item} index={index % 5} isNew={index === 0} />
        ))}
      </ul>
      {/* <div class='max-w-xl mx-auto mt-4 flex justify-between hidden'>
        <span class='px-4 py-2 rounded-md shadow cursor-pointer'>{'<'}</span>
        <span class='px-4 py-2 rounded-md shadow cursor-pointer'>{'>'}</span>
      </div> */}
    </Layout>
  )
}

app.get('/', async (c) => {
  const { per_page, page } = c.req.query()
  const octokit = new Octokit({
    auth: c.env.GITHUB_TOKEN,
  })
  const res = (await octokit.request(`GET /repos/${c.env.OWNER}/${c.env.REPO}/actions/artifacts`, {
    owner: c.env.OWNER,
    repo: c.env.REPO,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
    per_page: per_page ? +per_page : 10,
    page: Math.max(page ? +page : 1, 1),
  })) as ArtifactList

  return c.html(<Top items={res.data.artifacts} />)
})

app.get('/download/:id', async (c) => {
  const octokit = new Octokit({
    auth: c.env.GITHUB_TOKEN,
  })
  const res = await octokit.request(
    `GET /repos/${c.env.OWNER}/${c.env.REPO}/actions/artifacts/${c.req.param('id')}/zip`,
    {
      owner: c.env.OWNER,
      repo: c.env.REPO,
      artifact_id: c.req.param('id'),
      archive_format: 'zip',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  c.res.headers.append('Content-Disposition', `attachment; filename=uno-ext.v${c.req.param('id')}.zip`)

  return c.stream(async (stream) => {
    await stream.write(res.data)
  })
})

export default app
