import { bypassRoute } from '../router.ts'
import { models } from '../mock/mod.ts'
import { UserError } from '../../lib/mod.ts'

bypassRoute('get /model/:modelName', async ({ modelName }) => {
	const model = models[modelName]
	if (!model) throw new UserError(`Mode ${modelName} does not exist`)

	return await model.getAllIds()
})

bypassRoute('get /model/:modelName/documents/:documentId', async ({ modelName, documentId }) => {
	const model = models[modelName]
	if (!model) throw new UserError(`Mode ${modelName} does not exist`)

	const document = await model.get(documentId)
	if (!document) throw new UserError(`Document ${documentId} does not exist on model ${modelName}`)

	return document
})

bypassRoute('get /model/:modelName/documents/:documentId', async ({ modelName, documentId }) => {
	const model = models[modelName]
	if (!model) throw new UserError(`Mode ${modelName} does not exist`)

	await model.remove(documentId)
})

bypassRoute('put /model/:modelName/documents', async ({ modelName }, request) => {
	const model = models[modelName]
	if (!model) throw new UserError(`Mode ${modelName} does not exist`)

	const document = await request.json()
	await model.update(document)
})

bypassRoute('post /model/:modelName/documents', async ({ modelName }, request) => {
	const model = models[modelName]
	if (!model) throw new UserError(`Mode ${modelName} does not exist`)

	const document = await request.json()
	await model.insert(document)
})

bypassRoute('get /model/:modelName/download.json', async ({ modelName }) => {
	const model = models[modelName]
	if (!model) throw new UserError(`Mode ${modelName} does not exist`)

	const startTime = Date.now()

	const documents: unknown[] = []
	for await (const document of model.all()) documents.push(document)

	console.log(`WARNING: a bypass user downloaded all documents in model ${modelName} (operation took ${Date.now() - startTime}ms)`)

	return documents
})
