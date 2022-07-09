(function() {
  let doNotTrack = (
    navigator.doNotTrack === '1' ||
    window.location.hostname === 'localhost'
  )
  
  if (doNotTrack) {
    return
  }

  let plausible = document.createElement('script')
  plausible.setAttribute('src', '/_/p/js/script.js')
  plausible.setAttribute('data-api', '/_/p/api/event')
  plausible.setAttribute('data-domain', 'auth.vulpo.dev')
  plausible.setAttribute('defer', '')
  plausible.setAttribute('type', 'text/javascript')

  window.document.head.appendChild(plausible)
}());
