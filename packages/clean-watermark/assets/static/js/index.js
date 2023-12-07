const HREF_REG = /http(s?)\:\/\/\w+\.\w+\/\w+/g

window.onload = () => {
  document.querySelector('button').addEventListener('click', async () => {
    const btn = document.querySelector('button')
    const val = document.querySelector('textarea').value
    const link = val.match(HREF_REG)?.[0]
    btn.textContent = '加载中'
    btn.disabled = true
    const res = await fetch(`/${encodeURIComponent(link)}`)
    const data = await res.json()
    btn.textContent = '去水印'
    btn.disabled = false
    const grid = document.querySelector('.grid')
    grid.innerHTML = ''
    data?.slide.forEach(s => {
      const img = new Image()
      img.src = s
      grid.appendChild(img)
    })
  })
}
