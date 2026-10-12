// Google Analytics plumbing. index.html only loads the tag on
// picksandshovels.org; anywhere else these calls just queue into dataLayer.

export function track(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

export function setUserProps(props) {
  if (typeof window.gtag === 'function') window.gtag('set', 'user_properties', props);
}
