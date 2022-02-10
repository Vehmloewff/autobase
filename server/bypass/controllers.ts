import { bypassRoute } from '../router.ts'
import { controllers } from '../mock/mod.ts'
import { UserError } from '../lib/mod.ts'

bypassRoute('get /controllers', () => {
	return Object.keys(controllers)
})

bypassRoute('get /controllers/:controllerName/methods', ({ controllerName }) => {
	const controller = controllers[controllerName]
	if (!controller) throw new UserError(`Controller ${controllerName} does not exist`)

	return Object.keys(controller.methods)
})
