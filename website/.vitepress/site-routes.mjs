// Shared by navigation, language switching, metadata and build verification.
export const landingPages = ['download', 'community', 'project', 'tour', 'brand', 'brand-review']
export const homePath = locale => locale === 'en' ? '/en/' : '/'
export const sitePath = (locale, name) => name === 'home' ? homePath(locale) : `${locale === 'en' ? '/en' : ''}/${name}.html`
export function pageRoute(relativePath) {
  if (relativePath === 'index.md') return '/'
  if (relativePath === 'en/index.md') return '/en/'
  return '/' + relativePath.replace(/\.md$/, '.html')
}
export function pairedRoute(route, locale, documentRoutes = []) {
  if (route === '/' || route === '/en/' || route === '/en/index.html' || route === '/index.html') return homePath(locale)
  const name = route.replace(/^\/en\//, '/').match(/^\/([^/]+)\.html$/)?.[1]
  if (landingPages.includes(name)) return sitePath(locale, name)
  const candidate = route.replace(/^\/docs\/(zh|en)\//, `/docs/${locale}/`)
  return documentRoutes.includes(candidate) ? candidate : null
}
