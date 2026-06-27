const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const rootPath = '/'
const heroVideoSources = {
  desktop: '/img/WeChat_20260627004804.mp4',
  mobile: '/img/WeChat_20260627004804.mp4',
  fallback: '/img/WeChat_20260627004804.mp4'
}
let viewsMap = null

const normalizePath = href => {
  try {
    const url = new URL(href, window.location.origin)
    let path = url.pathname.replace(/\/index\.html$/, '/')
    if (!path.endsWith('/')) path += '/'
    return path
  } catch (error) {
    return href
  }
}

const formatViews = value => {
  if (value === undefined || value === null || value === '') return '--'
  const number = Number(value)
  return Number.isFinite(number) ? new Intl.NumberFormat('zh-CN').format(number) : String(value)
}

const hydrateHeroAvatar = () => {
  const siteInfo = document.querySelector('#page-header #site-info')
  if (!siteInfo || siteInfo.querySelector('.site-hero-avatar')) return

  const avatar = document.createElement('img')
  avatar.className = 'site-hero-avatar'
  avatar.src = '/img/avtor.jpg'
  avatar.alt = 'site avatar'
  avatar.loading = 'eager'
  siteInfo.prepend(avatar)
}

const isMobileHero = () => window.matchMedia('(max-width: 768px)').matches

const getHeroVideoSrc = () => {
  return isMobileHero() ? heroVideoSources.mobile : heroVideoSources.desktop
}

const playHeroVideo = video => {
  const playPromise = video.play()
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {})
  }
}

const applyHeroVideoSource = video => {
  const nextSrc = getHeroVideoSrc()
  if (video.dataset.currentSrc === nextSrc) return

  video.dataset.currentSrc = nextSrc
  video.src = nextSrc
  video.load()
  playHeroVideo(video)
}

const hydrateHeroVideo = () => {
  const header = document.querySelector('#page-header.full_page')
  if (!header) return

  const existingVideo = header.querySelector('.site-hero-video')
  if (isMobileHero()) {
    header.classList.remove('has-hero-video')
    header.classList.add('has-mobile-hero-image')
    if (existingVideo) {
      existingVideo.pause()
      existingVideo.remove()
    }
    return
  }

  header.classList.remove('has-mobile-hero-image')
  if (existingVideo) {
    applyHeroVideoSource(existingVideo)
    return
  }

  const video = document.createElement('video')
  video.className = 'site-hero-video'
  video.autoplay = true
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  video.setAttribute('aria-hidden', 'true')
  video.setAttribute('playsinline', '')
  video.addEventListener('error', () => {
    if (video.dataset.currentSrc === heroVideoSources.fallback) return
    video.dataset.currentSrc = heroVideoSources.fallback
    video.src = heroVideoSources.fallback
    video.load()
    playHeroVideo(video)
  })

  header.classList.add('has-hero-video')
  header.prepend(video)
  applyHeroVideoSource(video)
}

const ensureLoader = () => {
  let loader = document.querySelector('.anime-page-loader')
  if (loader) return loader

  loader = document.createElement('div')
  loader.className = 'anime-page-loader'
  loader.setAttribute('aria-hidden', 'true')
  loader.innerHTML = '<div class="anime-loader-mark"></div>'
  document.body.appendChild(loader)
  return loader
}

const showLoader = () => {
  if (isReducedMotion) return
  ensureLoader().classList.add('is-active')
}

const hideLoader = () => {
  const loader = document.querySelector('.anime-page-loader')
  if (loader) loader.classList.remove('is-active')
}

const createClickParticles = event => {
  if (isReducedMotion || event.target.closest('input, textarea, select')) return

  const count = window.innerWidth < 768 ? 4 : 7
  const baseX = event.clientX
  const baseY = event.clientY
  const shapes = ['star', 'bubble', 'shard']

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span')
    const angle = (Math.PI * 2 * index) / count
    const distance = 34 + Math.random() * 34

    particle.className = 'anime-click-particle'
    particle.dataset.shape = shapes[index % shapes.length]
    particle.style.setProperty('--x', `${baseX}px`)
    particle.style.setProperty('--y', `${baseY}px`)
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`)
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`)
    particle.style.setProperty('--particle-rotate', `${45 + index * 18}deg`)
    particle.style.setProperty('--particle-radius', index % 2 === 0 ? '42% 58% 48% 52%' : '50%')

    document.body.appendChild(particle)
    window.setTimeout(() => particle.remove(), 760)
  }
}

const shouldShowNavigationLoader = link => {
  if (!link || link.target || link.hasAttribute('download')) return false
  const href = link.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false

  try {
    const url = new URL(link.href)
    if (url.origin !== window.location.origin) return false
    return url.pathname !== window.location.pathname || url.search !== window.location.search
  } catch (error) {
    return false
  }
}

const loadViewsMap = async () => {
  if (viewsMap) return viewsMap

  try {
    const response = await fetch(`${rootPath}project-views.json`, { cache: 'no-store' })
    const items = await response.json()
    viewsMap = new Map(items.map(item => [normalizePath(item.path), item.views]))
  } catch (error) {
    viewsMap = new Map()
  }

  return viewsMap
}

const hydrateCardViews = async () => {
  const map = await loadViewsMap()

  document.querySelectorAll('#recent-posts .recent-post-item').forEach(card => {
    const titleLink = card.querySelector('.article-title[href]')
    const meta = card.querySelector('.article-meta-wrap')
    if (!titleLink || !meta || meta.querySelector('.anime-card-views')) return

    const path = normalizePath(titleLink.href)
    const views = formatViews(map.get(path))
    const badge = document.createElement('span')
    badge.className = `anime-card-views${views === '--' ? ' is-empty' : ''}`
    badge.textContent = `\u9605\u8bfb\u91cf ${views}`
    meta.appendChild(badge)
  })
}

const returnToPreviousPage = () => {
  if (window.history.length > 1) {
    window.history.back()
    return
  }

  try {
    const referrer = new URL(document.referrer)
    if (referrer.origin === window.location.origin) {
      window.location.href = referrer.href
      return
    }
  } catch (error) {
    // Ignore invalid or empty referrer and use the site root fallback.
  }

  window.location.href = rootPath
}

const hydratePostReturnButton = () => {
  const post = document.querySelector('#body-wrap.post #post')
  document.querySelectorAll('.post-return-button').forEach(button => {
    if (!post || !post.contains(button)) button.remove()
  })

  if (!post || post.querySelector('.post-return-button')) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'post-return-button'
  button.title = '返回上一页'
  button.setAttribute('aria-label', '返回上一页')
  button.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    returnToPreviousPage()
  })

  post.classList.add('has-post-return-button')
  post.prepend(button)
}

const bindAnimeEffects = () => {
  document.addEventListener('click', event => {
    createClickParticles(event)

    const link = event.target.closest('a[href]')
    if (shouldShowNavigationLoader(link)) showLoader()
  })

  window.addEventListener('beforeunload', showLoader)
  window.addEventListener('resize', hydrateHeroVideo)
  window.addEventListener('load', () => {
    hideLoader()
    hydrateHeroVideo()
    hydrateHeroAvatar()
    hydrateCardViews()
    hydratePostReturnButton()
  })

  window.addEventListener('pjax:send', showLoader)
  window.addEventListener('pjax:complete', () => {
    hideLoader()
    hydrateHeroVideo()
    hydrateHeroAvatar()
    hydrateCardViews()
    hydratePostReturnButton()
  })
}

bindAnimeEffects()
hydrateHeroVideo()
hydrateHeroAvatar()
hydrateCardViews()
hydratePostReturnButton()
