(() => {
  const config = {
    enabled: true,
    type: 2,
    id: '32069326',
    auto: 0,
    height: 66,
    title: '网易云音乐',
    storageKey: 'netease-music-player-open'
  }

  const buildPlayerUrl = () => {
    const params = new URLSearchParams({
      type: String(config.type),
      id: String(config.id),
      auto: String(config.auto),
      height: String(config.height)
    })

    return `https://music.163.com/outchain/player?${params.toString()}`
  }

  const getInitialOpenState = () => {
    try {
      const saved = window.localStorage.getItem(config.storageKey)
      if (saved) return saved === 'open'
    } catch (error) {
      // localStorage may be unavailable in privacy mode.
    }

    return window.innerWidth > 768
  }

  const saveOpenState = isOpen => {
    try {
      window.localStorage.setItem(config.storageKey, isOpen ? 'open' : 'closed')
    } catch (error) {
      // Ignore storage failures; the player still works for the current page.
    }
  }

  const hydrateMusicPlayer = () => {
    if (!config.enabled || !config.id || document.querySelector('.netease-music-dock')) return

    const iframeHeight = Number(config.height) + 20
    const dock = document.createElement('aside')
    dock.className = 'netease-music-dock'
    dock.setAttribute('aria-label', config.title)

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'netease-music-toggle'
    toggle.setAttribute('aria-label', '展开或收起网易云音乐播放器')
    toggle.innerHTML = '<span aria-hidden="true">♪</span>'

    const panel = document.createElement('div')
    panel.className = 'netease-music-panel'

    const iframe = document.createElement('iframe')
    iframe.className = 'netease-music-frame'
    iframe.title = config.title
    iframe.width = '330'
    iframe.height = String(iframeHeight)
    iframe.setAttribute('frameborder', 'no')
    iframe.setAttribute('border', '0')
    iframe.setAttribute('marginwidth', '0')
    iframe.setAttribute('marginheight', '0')
    iframe.setAttribute('allow', 'autoplay')
    iframe.loading = 'lazy'

    const ensureIframeLoaded = () => {
      if (!iframe.src) iframe.src = buildPlayerUrl()
    }

    const setOpen = isOpen => {
      dock.classList.toggle('is-open', isOpen)
      toggle.setAttribute('aria-expanded', String(isOpen))
      if (isOpen) ensureIframeLoaded()
      saveOpenState(isOpen)
    }

    panel.appendChild(iframe)
    dock.append(toggle, panel)
    document.body.appendChild(dock)

    toggle.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      setOpen(!dock.classList.contains('is-open'))
    })

    setOpen(getInitialOpenState())
  }

  window.addEventListener('load', hydrateMusicPlayer)
  window.addEventListener('pjax:complete', hydrateMusicPlayer)
  hydrateMusicPlayer()
})()
