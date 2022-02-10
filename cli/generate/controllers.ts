import { MethodDef } from '../parse/controller.ts'
import { indent } from './shared.ts'

export interface ControllerObject {
	name: string
	url: string
	methods: MethodDef[]
}

export function generateControllers(controllers: ControllerObject[]) {
	const inserts: string[] = []

	for (const controller of controllers) {
		const methodsInserts: string[] = []

		for (const method of controller.methods) {
			const methodInsidesLines = [`name: '${method.name}',`, `type: '${method.type}',`, `fn: ${controller.name}.${method.name},`]

			if (method.type === 'conventional') methodInsidesLines.push(`requiresParams: ${method.params !== null},`)

			const methodInsides = indent(methodInsidesLines.join('\n'))

			methodsInserts.push(`${method.name}: {\n${methodInsides}\n},`)
		}

		const methodsText = methodsInserts.join('\n')
		const controllerInsidesText = `name: '${controller.name}',\nmethods: {\n${indent(methodsText)}\n},`

		inserts.push(`${controller.name}: {\n${indent(controllerInsidesText)}\n},`)
	}

	const imports = controllers.map(controller => `import * as ${controller.name} from '${controller.url}'`).join('\n')

	return {
		imports,
		body: indent(inserts.join('\n')),
	}
}
