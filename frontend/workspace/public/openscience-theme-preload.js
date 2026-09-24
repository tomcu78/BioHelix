;(function () {
  // Clear any stale cached theme CSS from previous runs
  var currentVersion = "biohelix-v3"
  if (localStorage.getItem("biohelix-theme-version") !== currentVersion) {
    localStorage.removeItem("openscience-theme-css-openscience-light")
    localStorage.removeItem("openscience-theme-css-openscience-dark")
    localStorage.removeItem("openscience-theme-css-light")
    localStorage.removeItem("openscience-theme-css-dark")
    localStorage.setItem("openscience-color-scheme", "light")
    localStorage.setItem("openscience-theme-id", "openscience")
    localStorage.setItem("biohelix-theme-version", currentVersion)
  }

  var themeId = "openscience"
  var mode = "light"

  document.documentElement.dataset.theme = themeId
  document.documentElement.dataset.colorScheme = mode
  document.documentElement.style.backgroundColor = "#ffffff"

  var style = document.createElement("style")
  style.id = "openscience-theme-preload"
  style.textContent =
    ":root{color-scheme:light;--background-base:#ffffff;--background-weak:#f8faff;--surface-brand-base:#6366f1;--surface-brand-hover:#4f46e5;--color-primary:#6366f1;--color-accent:#6366f1;--color-brand:#6366f1;}"
  document.head.appendChild(style)
})()
