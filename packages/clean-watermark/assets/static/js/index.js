const HREF_REG = /http(s?)\:\/\/\w+\.\w+\/\w+/g
const slogan = new Image()
slogan.src = window.location.origin + '/static/images/slogan.svg'

window.onload = () => {
  document.querySelector('button').addEventListener('click', async () => {
    const btn = document.querySelector('button')
    const val = document.querySelector('textarea').value
    const link = val.match(HREF_REG)?.[0]

    btn.textContent = '加载中'
    btn.disabled = true

    const res = await fetch(`/rewriter/${encodeURIComponent(link)}`)
    const data = await res.json()

    btn.textContent = '去水印'
    btn.disabled = false

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
        grid.appendChild(i)
      }
    })
  })
}
