const HREF_REG = /http(s?)\:\/\/\w+\.\w+\/\w+/g
const slogan = new Image()
window.sloganIndex = 0
const sloganMap = [
  '/static/images/slogan.svg',
  '/static/images/slogan_two.svg',
  '/static/images/slogan_three.svg',
  '/static/images/slogan_four.svg',
  '/static/images/slogan_five.svg',
]
slogan.src = window.location.origin + sloganMap[window.sloganIndex]

async function renderImage(link) {
  const res = await fetch(`/rewriter/${encodeURIComponent(link)}`)
  const data = await res.json()

  const grid = document.querySelector('.grid')
  grid.innerHTML = ''

  data?.slide.forEach((s) => {
    const img = new Image()
    img.src = s
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, img.width, img.height)
      ctx.drawImage(
        slogan,
        img.width - slogan.width * 3 - 60,
        img.height - slogan.height * 3 - 60,
        slogan.width * 3,
        slogan.height * 3
      )
      const i = new Image()
      i.src = canvas.toDataURL('image/png')

      const wrapper = document.createElement('div')

      const download = document.createElement('a')
      download.textContent = '拿下'
      download.classList.add(
        'py-.5',
        'px-1.5',
        'bg-white/80',
        'text-xs',
        'text-#999',
        'rounded-md',
        'absolute',
        'top-2',
        'right-2',
        'cursor-pointer'
      )
      download.target = '_blank'
      download.href = i.src
      download.download = s.replace('/', '_') + '.png'

      wrapper.classList.add('relative')
      wrapper.appendChild(i)
      wrapper.appendChild(download)
      grid.appendChild(wrapper)
    }
  })
}

window.onload = () => {
  const query = new URLSearchParams(window.location.search)
  document.querySelector('textarea').value = query.get('share_link') || ''

  if (query.get('share_link')) {
    const link = decodeURIComponent(query.get('share_link')).match(HREF_REG)?.[0]
    renderImage(link)
  }

  document.querySelector('.slogan').classList.add('after:opacity-60', "before:content-['_']")
  document.querySelectorAll('.slogan').forEach((s, index) => {
    s.addEventListener('click', () => {
      window.sloganIndex = index
      slogan.src = window.location.origin + sloganMap[window.sloganIndex]
      document.querySelectorAll('.slogan').forEach((s) => {
        s.classList.remove('after:opacity-60', "before:content-['_']")
      })
      s.classList.add('after:opacity-60', "before:content-['_']")
    })
  })

  document.querySelector('button').addEventListener('click', async () => {
    const btn = document.querySelector('button')
    const val = document.querySelector('textarea').value
    const link = val.match(HREF_REG)?.[0]

    history.replaceState(null, null, `?share_link=${encodeURIComponent(val)}`)
    if (!link) return
    btn.textContent = '压抑了...'
    btn.disabled = true

    await renderImage(link)

    btn.textContent = '想连接了'
    btn.disabled = false
  })
}
