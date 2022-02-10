import { getSettings } from './settings.ts'
import { registerRequestHandler } from './request-handler.ts'

interface Listener {
	fn: () => Promise<Response>
}

const listeners: Record<string, Listener> = {}

registerRequestHandler(async request => {
	const pattern = new URLPattern({ pathname: '/links/:id' })
	const match = pattern.exec(request.url)
	if (!match) return null

	const { id } = match.pathname.groups
	const listener = listeners[id]

	if (!listener) return new Response('Link has expired')

	return await listener.fn()
})

export interface LinkResponderParams {
	/**
	 * The amount of milliseconds after which the link expires
	 *
	 * @default 600000 // ten minutes
	 */
	expire?: number
	/**
	 * The number of times to allow visits to this link
	 *
	 * @default 1
	 */
	allowVisits?: number
	/**
	 * Called when the link is visited.
	 *
	 * The server will respond to the link request with with response returned from this function.
	 */
	listener(): Promise<Response> | Response
}

export function linkResponder(params: LinkResponderParams) {
	const id = crypto.randomUUID()
	const link = `${getSettings().publishedUrl}/links/${id}`

	const maxVisits = params.allowVisits ?? 1
	let visits = 0

	listeners[id] = {
		async fn() {
			visits++

			if (visits >= maxVisits) delete listeners[id]

			return await params.listener()
		},
	}

	setInterval(() => delete listeners[id], params.expire ?? 600000)

	return link
}
