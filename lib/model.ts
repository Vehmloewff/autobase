import { FS_ROOT } from '../server/globals.ts'
import { event } from '../deps.ts'
import { UserError } from './utils.ts'

export interface Model<T> {
	name: string
	index: string
	all: () => { [Symbol.asyncIterator](): AsyncGenerator<Awaited<T>, void, unknown> }
	getAllIds: () => Promise<string[]>
	insert: (document: T) => Promise<void>
	remove: (id: string) => Promise<void>
	get: (id: string) => Promise<T | null>
	has: (id: string) => Promise<boolean>
	update: (document: T) => Promise<void>
	emitter: event.EventEmitter<{ insert: [string]; remove: [string]; update: [string] }>
	inferId: (document: T) => string
}

export interface RegisterModelParams {
	index?: string
}

export async function registerModel<T>(name: string, params: RegisterModelParams = {}): Promise<Model<T>> {
	const base = `${FS_ROOT}/collections/${name}`
	const index = params.index || 'id'

	try {
		await Deno.stat(base)
	} catch (_) {
		await Deno.mkdir(base, { recursive: true })
	}

	type Events = {
		insert: [string]
		remove: [string]
		update: [string]
	}

	const emitter = new event.EventEmitter<Events>()

	function inferId(document: T) {
		const id = document[index as keyof T]
		if (!id) throw new Error(`cannot infer id from document: ${JSON.stringify(document, null, '\t')}`)

		return String(id)
	}

	function all(): { [Symbol.asyncIterator](): AsyncGenerator<Awaited<T>, void, unknown> } {
		return {
			async *[Symbol.asyncIterator]() {
				for await (const entry of Deno.readDir(base)) {
					yield JSON.parse(await Deno.readTextFile(`${base}/${entry.name}`)) as T
				}
			},
		}
	}

	async function getAllIds() {
		const ids: string[] = []

		for await (const entry of Deno.readDir(base)) {
			// add the id without the '.json' extension
			ids.push(entry.name.slice(-5))
		}

		return ids
	}

	async function insert(document: T) {
		const id = inferId(document)

		if (await has(id)) throw new UserError('cannot insert document because it already exists')
		await Deno.writeTextFile(`${base}/${id}.json`, JSON.stringify(document))
		await emitter.emit('insert', id)
	}

	async function remove(id: string) {
		try {
			await Deno.remove(`${base}/${id}.json`)
		} catch (_) {
			// do nothing if the file is not found
		}

		await emitter.emit('remove', id)
	}

	async function get(id: string) {
		try {
			return JSON.parse(await Deno.readTextFile(`${base}/${id}.json`)) as T
		} catch (e) {
			if (/JSON/.test(e.message)) throw new Error(`failed to parse document: ${name}.${id}`)

			return null
		}
	}

	async function has(id: string) {
		try {
			await Deno.stat(`${base}/${id}.json`)
			return true
		} catch (_) {
			return false
		}
	}

	async function update(document: T) {
		const id = inferId(document)

		await Deno.writeTextFile(`${base}/${id}.json`, JSON.stringify(document), { create: false })
		await emitter.emit('update', id)
	}

	return { name, index, all, getAllIds, insert, remove, get, has, update, emitter, inferId }
}
