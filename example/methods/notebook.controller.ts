import { Notebook } from '../db.cluster.ts'
import { Connection, pluralConnection, PluralConnection } from '../../mod.ts'

export function $myNotebooks(connection: Connection): PluralConnection<Notebook> {
	return pluralConnection({
		connection,
		model: Notebook,
		async onChange() {
			const user = await connection.getUser()
			if (!user.isReal) return []

			const notebooks: Notebook[] = []

			for await (const notebook of Notebook.all()) {
				if (notebook.ownerUserId === user.userId) notebooks.push(notebook)
			}

			return notebooks
		},
	})
}
