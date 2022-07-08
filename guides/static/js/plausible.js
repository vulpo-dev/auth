(function() {
  let doNotTrack = (
    navigator.doNotTrack === '1' ||
    window.location.hostname === 'localhost'
  )
  
  if (doNotTrack) {
    return
  }

  let plausible = document.createElement('script')
  plausible.src = 'https://plausible.io/js/plausible.js'
  plausible.setAttribute('data-domain', 'auth.vulpo.dev')
  plausible.setAttribute('defer', '')

  window.document.head.appendChild(plausible)
}());
