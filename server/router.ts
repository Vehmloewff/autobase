import { registerRequestHandler } from '../lib/request-handler.ts'
import { getSettings } from '../lib/settings.ts'

export type RouteHandler = (groups: Record<string, string>, request: Request) => Promise<unknown | null> | null | unknown

interface Route {
	pattern: string
	handler: RouteHandler
	isBypass: boolean
}

const routes: Route[] = []

registerRequestHandler(async request => {
	for (const route of routes) {
		const groups = matchPattern(route, request)
		if (!groups) continue

		if (route.isBypass) {
			const auth = request.headers.get('Authentication')
			if (auth !== getSettings().bypassPassword) {
				console.log('blocked an attempt on /bypass without required authentication')
				continue
			}
		}

		const data = await route.handler(groups, request)
		if (!data) return new Response('ok')
		if (typeof data === 'string') return new Response(data)

		return new Response(JSON.stringify(data))
	}

	return null
})

function matchPattern(route: Route, request: Request) {
	const [method, pathname] = route.pattern.split(/\s+/)

	if (method.toUpperCase() !== request.method) return null

	const patternMatcher = new URLPattern({ pathname: extendPath(pathname, route) })
	const match = patternMatcher.exec(request.url)

	if (!match) return null

	return match.pathname.groups
}

function extendPath(pathname: string, route: Route) {
	if (route.isBypass) return `/bypass${pathname}`

	return pathname
}

export function route(pattern: string, handler: RouteHandler) {
	routes.push({ pattern, handler, isBypass: false })
}

export function bypassRoute(pattern: string, handler: RouteHandler) {
	routes.push({ pattern, handler, isBypass: true })
}
