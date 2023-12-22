import { fetchEventSource } from 'https://esm.sh/@microsoft/fetch-event-source@2.0.1'
import { parse } from 'https://esm.sh/marked'

const sendHandler = async () => {
  const ctrl = new AbortController()
  let chunk = ''

  await fetchEventSource('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: document.querySelector('#q').value,
    }),
    signal: ctrl.signal,

    async onopen() {},
    onmessage(ev) {
      chunk += ev.data
      document.querySelector('.content').innerHTML = parse(chunk)
    },
    onclose() {},
    onerror(error) {
      throw new Error('Network error')
    },
  })
}

document.querySelector('button').addEventListener('click', async () => {
  if (!document.querySelector('#q').value) return
  await sendHandler()
})
