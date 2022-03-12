import { Notebook } from '../db.cluster.ts'
import { Connection, pluralConnection, PluralConnection, Context } from '../../mod.ts'

export function getNotebook(_: Context, id: string): Promise<Notebook | null> {
	return Notebook.get(id)
}

export type AddNotebookParams = Notebook['settings']['permissions']

export async function addNotebook(_: Context, params: AddNotebookParams) {
	await Notebook.insert({
		id: crypto.randomUUID(),
		name: 'Notebook insert',
		notes: [],
		ownerUserId: '',
		settings: { access: [], permissions: params, public: true },
	})
}

export function $myNotebooks(connection: Connection): PluralConnection<Notebook> {
	return pluralConnection({
		connection,
		model: Notebook,
		async onChange() {
			// const user = await connection.getUser()
			// if (!user.isReal) return []

			const notebooks: Notebook[] = []

			for await (const notebook of Notebook.all()) {
				notebooks.push(notebook)
			}

			return notebooks
		},
	})
}
