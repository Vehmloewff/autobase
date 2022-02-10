import { Connection } from './types.ts'
import { Model } from './model.ts'

export interface SingularConnectionParams<T> {
	connection: Connection
	model: Model<T>
	onChange(): Promise<T | null> | T | null
}

export interface SingularConnection<T> {
	connectionType: 'singular'
	model: Model<T>
}

export interface PluralConnectionParams<T> {
	connection: Connection
	model: Model<T>
	onChange(): Promise<T[]> | T[]
}

export interface PluralConnection<T> {
	connectionType: 'plural'
	model: Model<T>
}

export function singularConnection<T>(params: SingularConnectionParams<T>): SingularConnection<T> {
	async function start() {
		// run our listener an initial time to get the initial document for the client
		const startValue = await params.onChange()

		let currentId: string | null = null
		let idOfNodeChanged: string | null = null

		// if the initial document is not already null, send it to the client.
		// (we don't need to send anything to the client if it is null because the client is already at null)
		if (startValue) {
			params.connection.set(startValue)
			params.model.inferId(startValue)
		}

		// handle all three events: remove, insert, update
		async function handleChange() {
			// run our onChange hook to see which document is to be on the client
			const newValue = await params.onChange()

			// If the new value is null, we need to make sure that the client portrays that
			if (newValue === null) {
				// ... and set the client to null if it is not already null
				if (currentId !== null) params.connection.set(null)

				// Don't do anything else here because there is no newValue
				return
			}

			// infer the id of the new value (which we expect to be a document)
			const idOfNewValue = params.model.inferId(newValue)

			// if the document to be sent to the client is not the document already on the client...
			if (idOfNewValue !== currentId) {
				// replace whatever was on the client with the new document
				params.connection.set(newValue)

				// remember this new value
				currentId = idOfNewValue

				// don't do anythings else
				return
			}

			// we don't need to set the client to a different document, but the current document could have changed...
			if (idOfNewValue === idOfNodeChanged) {
				// replace the content of the document on the client with this new document
				params.connection.set(newValue)

				// don't do anything else
				return
			}

			// the same document is to continue on the client and it was not updated... so we don't need to do anything
		}

		const listener = async (id: string) => {
			idOfNodeChanged = id
			await handleChange()
		}

		params.model.emitter.on('insert', listener)
		params.model.emitter.on('remove', listener)
		params.model.emitter.on('update', listener)

		params.connection.onDestroy(() => {
			params.model.emitter.off('insert', listener)
			params.model.emitter.off('remove', listener)
			params.model.emitter.off('update', listener)
		})
	}

	start()

	return {
		connectionType: 'singular',
		model: params.model,
	}
}

export function pluralConnection<T>(params: PluralConnectionParams<T>): PluralConnection<T> {
	async function start() {
		// run our listener an initial time to get all of the documents that are to be originally persisted to the client
		const startValues = await params.onChange()

		let currentIds: string[] = []
		let idOfNodeChanged: string | null = null

		// send each initial document to the client and remember it's id
		for (const doc of startValues) {
			params.connection.insert(doc)
			currentIds.push(params.model.inferId(doc))
		}

		// handle all changes to the collection of documents that this connection is connected to
		async function handleChange() {
			// run our change hook to get all the new documents to be persisted to the client
			const newValues = await params.onChange()

			// find any updated documents that are in our newValues and are on the client
			if (idOfNodeChanged) {
				const aClientDocWasChanged = currentIds.indexOf(idOfNodeChanged) !== -1

				if (aClientDocWasChanged) {
					// if the changed client doc is in the newValues, update it on the client
					{
						const matchingNewValue = newValues.find(document => params.model.inferId(document) === idOfNodeChanged)
						if (matchingNewValue) params.connection.update(matchingNewValue)
					}
				}
			}

			// find any documents that are present on the client, but not present in the list of new values...
			currentIds = currentIds.filter(currentId => {
				const matchingNewValue = newValues.find(document => {
					const documentId = params.model.inferId(document)

					return documentId === currentId
				})

				if (!matchingNewValue) {
					// ... and remove it from the client
					params.connection.remove(currentId)

					// remove it from the list of currentIds too
					return false
				}
			})

			// find and documents that are not present on the client, but are present in the list of new values...
			for (const document of newValues) {
				const documentId = params.model.inferId(document)

				if (currentIds.indexOf(documentId) === -1) {
					// and insert it into the client
					params.connection.insert(document)

					// also insert it into the list of currentIds
					currentIds.push(documentId)
				}
			}

			// ok, so now we've synced the client so that it portrays the same documents as were returned from the onChange param
			// and we've updated any changed documents that were already present on the client that are still to be present there
			// so it looks like we're good!
		}

		const listener = async (id: string) => {
			idOfNodeChanged = id
			await handleChange()
		}

		params.model.emitter.on('insert', listener)
		params.model.emitter.on('remove', listener)
		params.model.emitter.on('update', listener)

		params.connection.onDestroy(() => {
			params.model.emitter.off('insert', listener)
			params.model.emitter.off('remove', listener)
			params.model.emitter.off('update', listener)
		})
	}

	start()

	return {
		connectionType: 'plural',
		model: params.model,
	}
}
