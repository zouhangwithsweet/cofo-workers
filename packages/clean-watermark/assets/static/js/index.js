const HREF_REG = /http(s?)\:\/\/\w+\.\w+\/\w+/g
const slogan = new Image()
window.sloganIndex = 0
const sloganMap = ['/static/images/slogan.svg', '/static/images/slogan_two.svg', '/static/images/slogan_three.svg']
slogan.src = window.location.origin + sloganMap[window.sloganIndex]

window.onload = () => {
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
