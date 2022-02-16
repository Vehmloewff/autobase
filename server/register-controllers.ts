import { registerRequestHandler, inferUserFromClient, UserError } from '../lib/mod.ts'
import { controllers } from './mock/mod.ts'
import type { Context, User } from '../mod.ts'

registerRequestHandler(async request => {
	if (request.method !== 'POST') return null

	const pattern = new URLPattern({ pathname: '/call/:controllerName/:methodName' })

	const match = pattern.exec(request.url)
	if (!match) return null

	const { controllerName, methodName } = match.pathname.groups

	const controller = controllers[controllerName]
	if (!controller) throw new UserError(`Controller "${controllerName}" does not exist`)

	const method = controller.methods[methodName]
	if (!method) throw new UserError('Method does not exist')

	if (method.type === 'connection') throw new UserError('Cannot call a connection.  Connections must be connected to over a websocket')

	function getUser(): Promise<User> {
		const clientId = request.headers.get('Client-Id')
		if (!clientId) throw new Error('The Client-Id header must be sent up with this request')

		return Promise.resolve(inferUserFromClient(clientId))
	}

	const headers = new Headers()

	const context: Context = {
		getUser,
		request,
		responseHeaders: headers,
	}

	const { params } = await request.json()

	const data = await method.fn(context, params)

	return new Response(JSON.stringify({ data }), { headers })
})
