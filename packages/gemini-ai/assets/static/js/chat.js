import { fetchEventSource } from 'https://esm.sh/@microsoft/fetch-event-source@2.0.1'

const sendHandler = async () => {
  const ctrl = new AbortController()
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
      document.querySelector('.content').textContent = document.querySelector('.content').textContent + '\n' + ev.data
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
