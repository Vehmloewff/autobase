import { registerRequestHandler } from '../lib/request-handler.ts'
import { controllers } from './mock/mod.ts'
import { UserError, Connection, inferUserFromClient, Model } from '../lib/mod.ts'

/** Record to store destroy functions { 'methodPath': { 'clientId': fn } } */
const observationsDestroyers: Record<string, Record<string, () => void>> = {}

registerRequestHandler(request => {
	const url = new URL(request.url)
	if (url.pathname !== '/connection') return null

	const clientId = url.searchParams.get('clientId')
	if (!clientId) return new Response('connections must come with clientId as a queryParam')

	const { response, socket } = Deno.upgradeWebSocket(request)

	let timeout: number
	let oldUserDescription = 'guest'

	socket.onmessage = ({ data }) => {
		const message = JSON.parse(data)

		if (message.$ === 'add-observation') addObservation(socket, message.methodPath, clientId)
		else if (message.$ === 'remove-observation') removeObservation(message.methodPath, clientId)
		else if (message.$ === 'heartbeat') {
			const user = inferUserFromClient(clientId)
			const newUserDescription = user.isAdmin ? 'admin' : user.isReal ? 'real' : 'guest'

			if (oldUserDescription !== newUserDescription) socket.send(JSON.stringify({ $: 'auth-change', changeTo: newUserDescription }))

			oldUserDescription = newUserDescription

			// Close socket if we don't receive another heartbeat for 20 seconds
			{
				clearTimeout(timeout)
				timeout = setTimeout(() => {
					socket.close()
				}, 20 * 1000)
			}
		}
	}

	socket.onclose = () => {
		for (const methodPath in observationsDestroyers) {
			removeObservation(methodPath, clientId)
		}
	}

	return response
})

async function addObservation(socket: WebSocket, methodPath: string, clientId: string) {
	const [controllerName, methodName] = methodPath.split('/')
	if (!methodName) throw new UserError(`invalid method path: ${methodPath}`)

	const method = controllers[controllerName]?.methods[methodName]
	if (!method) throw new UserError(`Method path "${methodPath}" does not point to an actual method`)

	if (method.type === 'conventional') throw new UserError('Only connection methods can be observed')

	let stashedDestroyFns: (() => void)[] = []

	if (!observationsDestroyers[methodPath]) observationsDestroyers[methodPath] = {}
	observationsDestroyers[methodPath][clientId] = () => {
		stashedDestroyFns.forEach(fn => fn())
		stashedDestroyFns = []
	}

	let model: Model<unknown> | null = null

	const connection: Connection = {
		onDestroy(fn) {
			stashedDestroyFns.push(fn)
		},
		getUser() {
			return Promise.resolve(inferUserFromClient(clientId))
		},
		set(document) {
			socket.send(JSON.stringify({ $: 'set', methodPath, data: document }))
		},
		insert(document) {
			socket.send(JSON.stringify({ $: 'item-insert', methodPath, data: document }))
		},
		update(document) {
			if (!model) throw new Error('connection.update can only be called after method has returned')

			socket.send(JSON.stringify({ $: 'item-update', methodPath, data: document, index: model.index }))
		},
		remove(documentId) {
			if (!model) throw new Error('connection.remove can only be called after method has returned')

			socket.send(JSON.stringify({ $: 'item-remove', methodPath, id: documentId, index: model.index }))
		},
	}

	const res = await method.fn(connection)
	model = res.model
}

function removeObservation(methodPath: string, clientId: string) {
	const destroyer = observationsDestroyers[methodPath]?.[clientId]
	if (destroyer) destroyer()
}
