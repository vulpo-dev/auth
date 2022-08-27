(function() {
  let doNotTrack = (
    navigator.doNotTrack === '1' ||
    window.location.hostname === 'localhost'
  )
  
  if (doNotTrack) {
    return
  }

  let pirsch = document.createElement('script')
  pirsch.setAttribute('src', 'https://api.pirsch.io/pirsch.js')
  pirsch.setAttribute('data-code', 'Sm6vcDWFZdo3UVgWd9FpRmkfh3SgLgEG')
  pirsch.setAttribute('id', 'pirschjs')
  pirsch.setAttribute('defer', '')
  pirsch.setAttribute('type', 'text/javascript')

  window.document.head.appendChild(pirsch)
}());
