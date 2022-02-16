// deno-lint-ignore-file
// This is a generated file.  Do not edit.

export function uuid() {
	let d = Date.now()
	return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, c => {
		const r = (d + Math.random() * 16) % 16 | 0
		d = Math.floor(d / 16)
		return (c == `x` ? r : (r & 0x3) | 0x8).toString(16)
	})
}

export function generateClientId(prefix = 'client-id-') {
	return `${prefix}${uuid()}`
}

export interface Storable<T> {
	get(): T
	set(v: T): void
	subscribe(listener: Subscriber<T>): () => void
	getNumberOfSubscribers(): number
}

export type Subscriber<T> = (newVal: T, initialCall: boolean) => void

function makeStorable<T>(value: T): Storable<T> {
	const subscribers: Subscriber<T>[] = []

	function get(): T {
		return value
	}

	function set(newVal: T) {
		if (value === newVal) return

		value = newVal

		subscribers.forEach(listener => listener(value, false))
	}

	function subscribe(listener: Subscriber<T>) {
		listener(value, true)

		subscribers.push(listener)

		return () => {
			const index = subscribers.indexOf(listener)
			if (index === -1) return // already unsubscribed

			subscribers.splice(index, 1)
		}
	}

	function getNumberOfSubscribers() {
		return subscribers.length
	}

	return {
		get,
		set,
		subscribe,
		getNumberOfSubscribers,
	}
}

let onSubscription: (methodPath: string, subscriptionCount: number) => void = () => {}

export interface ReadableStore<T> {
	get(): T
	subscribe(listener: Subscriber<T>): () => void
}

interface CustomStorable<T> {
	readable: ReadableStore<T>
	set: Storable<T>['set']
	getNumberOfSubscribers: Storable<T>['getNumberOfSubscribers']
}

function makeCustomStorable<T>(methodPath: string, value: T): CustomStorable<T> {
	const { get, getNumberOfSubscribers, set, subscribe } = makeStorable(value)

	return {
		readable: {
			get,
			subscribe(fn) {
				const unsubscribe = subscribe(fn)
				onSubscription(methodPath, getNumberOfSubscribers())

				return () => {
					unsubscribe()
					onSubscription(methodPath, getNumberOfSubscribers())
				}
			},
		},
		set,
		getNumberOfSubscribers,
	}
}

let apiUrl: string | null = null
let wsUrl: string | null = null
let clientId: string | null = null

export type User = RealUser | GuestUser | AdminUser

export interface RealUser {
	isReal: true
	isGuest: false
	isAdmin: false
	userId: string
	clientId: string
}

export interface GuestUser {
	isReal: false
	isGuest: true
	isAdmin: false
	clientId: string
}

export interface AdminUser {
	isReal: false
	isGuest: false
	isAdmin: true
	clientId: string
}

export const user = makeStorable<User>({
	clientId: 'not-yet-allocated',
	isAdmin: false,
	isGuest: true,
	isReal: false,
})

export const online = makeStorable(false)

/** Bare connect takes in the stores to be synced as an object { 'controllerName/methodName': storable } */
function bareConnect(storables: Record<string, CustomStorable<any>>) {
	return new Promise<void>(resolve => {
		if (!clientId || !wsUrl) throw new Error('invalid params passed to connect')

		const unsubscribers: (() => void)[] = []
		const methodIsObserving: Record<string, boolean> = {}

		for (const methodPath in storables) methodIsObserving[methodPath] = false

		const url = `${wsUrl}/connection`
		console.log(`[socket] connecting to ${url}...`)

		let didConnect = false
		const websocket = new WebSocket(`${url}?clientId=${clientId}`)

		websocket.onclose = () => {
			unsubscribers.forEach(fn => fn())
			online.set(false)

			console.log('[socket] disconnected, waiting for three seconds before reconnecting...')
			setTimeout(() => {
				bareConnect(storables).then(() => {
					if (!didConnect) resolve()
				})
			}, 3000)
		}

		websocket.onopen = () => {
			console.log('[socket] connected')
			online.set(true)

			didConnect = true
			resolve()

			onSubscription = (methodPath, numberOfSubscribers) => {
				const isObserving = methodIsObserving[methodPath]
				const shouldObserve = numberOfSubscribers > 0

				if (isObserving && shouldObserve) return
				if (!isObserving && !shouldObserve) return

				if (isObserving && !shouldObserve) return websocket.send(JSON.stringify({ $: 'remove-observation', methodPath }))
				if (!isObserving && shouldObserve) return websocket.send(JSON.stringify({ $: 'add-observation', methodPath }))
			}
		}

		websocket.onmessage = ({ data }) => {
			const message = JSON.parse(data)

			// if .set(document) was called on the model
			if (message.$ === 'item-set') {
				const methodPath = message.methodPath as string
				const storable = storables[methodPath]

				storable.set(message.data)
			}
			// if .insert(document) was called on the model
			else if (message.$ === 'item-insert') {
				const methodPath = message.methodPath as string
				const storable = storables[methodPath]

				const currentValue = storable.readable.get() as any[]
				if (!Array.isArray(currentValue)) throw new Error('cannot perform an insert on a value that is not an array')

				currentValue.push(message.data)
				storable.set(currentValue)
			}
			// if .update(document) was called on the model
			else if (message.$ === 'item-update') {
				const methodPath = message.methodPath as string
				const storable = storables[methodPath]

				const currentValue = storable.readable.get() as any[]
				if (!Array.isArray(currentValue)) throw new Error('cannot perform an insert on a value that is not an array')

				const indexOfItemToUpdate = currentValue.findIndex(item => item[message.index] === message.id)
				if (indexOfItemToUpdate === -1) throw new Error('cannot find item that was supposed to be updated')

				currentValue[indexOfItemToUpdate] = message.data

				storable.set(currentValue)
			}
			// if .remove(documentId) was called on the model
			else if (message.$ === 'item-remove') {
				const methodPath = message.methodPath as string
				const storable = storables[methodPath]

				const currentValue = storable.readable.get() as any[]
				if (!Array.isArray(currentValue)) throw new Error('cannot perform an insert on a value that is not an array')

				const indexOfItemToRemove = currentValue.findIndex(item => item[message.index] === message.id)
				if (indexOfItemToRemove === -1) throw new Error('cannot find item that was supposed to be updated')

				currentValue.splice(indexOfItemToRemove, 1)

				storable.set(currentValue)
			} else if (message.$ === 'auth-change') {
				if (!clientId) throw new Error('unexpected outcome in generated glue code')

				if (message.changeTo === 'guest') user.set({ clientId, isAdmin: false, isGuest: true, isReal: false })
				else if (message.changeTo === 'real')
					user.set({ clientId, isAdmin: false, isGuest: false, isReal: true, userId: message.userId })
				else if (message.changeTo === 'admin') user.set({ clientId, isAdmin: true, isGuest: false, isReal: false })
			}
		}
	})
}

interface ConventionalMethodParams {
	controllerName: string
	methodName: string
	params: any
	returnType?: 'string' | 'binary' | 'json' | 'void'
}

async function conventionalMethod(params: ConventionalMethodParams) {
	if (!apiUrl || !clientId) throw new Error('connect must be called before any methods are called')

	const returnType = params.returnType || 'string'
	const headers = new Headers()

	headers.append('Client-Id', clientId)

	return await fetch(`${apiUrl}/call/${params.controllerName}/${params.methodName}`, {
		body: params.params,
		headers,
	}).then(async res => {
		if (!res.ok) throw new Error(await res.text())

		if (returnType === 'binary') return new Uint8Array(await res.arrayBuffer())
		if (returnType === 'json') return (await res.json()).data

		// do nothing for returnType === 'void'
	})
}

// DEFINE_CUSTOM_STORABLES

export interface ConnectParams {
	clientId: string
	host: string
	forceSecure: boolean
}

export async function connect(params: ConnectParams) {
	const secure = params.forceSecure || location.host === 'https:'

	clientId = params.clientId
	apiUrl = `${secure ? 'https' : 'http'}://${params.host}`
	wsUrl = `${secure ? 'wss' : 'ws'}://${params.host}`

	user.set({ clientId, isAdmin: false, isGuest: true, isReal: false })

	await bareConnect({
		// INSERT_CUSTOM_STORABLES
	})
}

// EXPORT_AND_DEFINE_CONTROLLERS

// EXPORT_AND_DEFINE_MODELS
