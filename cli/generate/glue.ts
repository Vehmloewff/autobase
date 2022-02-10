import { ControllerObject } from './controllers.ts'
import { ClusterObject } from './clusters.ts'
import { indent } from './shared.ts'
import { getUrls } from '../utils/urls.ts'
import { TypeDef } from '../parse/shared.ts'

function getDataDisplayType(type: TypeDef | null) {
	if (!type) return 'void'

	return 'json'
}

function stringifyType(type: TypeDef, currentDepth: number): string {
	if (type.$ === 'null') return 'null'
	else if (type.$ === 'array') return `${stringifyType(type.type, currentDepth)}[]`
	else if (type.$ === 'boolean') return type.literal === true ? 'true' : type.literal === false ? 'false' : 'boolean'
	else if (type.$ === 'binary') return 'Uint8Array'
	else if (type.$ === 'number') {
		if (type.literal !== null) return type.literal.toString()

		return 'number'
	} else if (type.$ === 'string') {
		if (type.literal !== null) return `'${type.literal}'`

		return 'string'
	} else if (type.$ === 'union') return type.options.map(option => stringifyType(option, currentDepth)).join(' | ')
	else if (type.$ === 'object') {
		if (!type.properties.length) return '{}'

		const lines: string[] = []
		const newDepth = currentDepth + 1

		for (const prop of type.properties) {
			lines.push(`${'\t'.repeat(newDepth)}${prop.name}: ${stringifyType(prop.type, newDepth)}`)
		}

		return `{\n${lines.join('\n')}\n${'\t'.repeat(currentDepth)}}`
	}

	throw new Error(`unexpected type encountered`)
}

const conventionalMethodTemplate = (
	methodName: string,
	paramsDef: string,
	returnType: string,
	paramsRef: string,
	controllerName: string,
	returnTypeDef: TypeDef | null
) => `\
async ${methodName}(${paramsDef}): ${returnType} {
	return await conventionalMethod({
		controllerName: '${controllerName}',
		methodName: '${methodName}',
		params: ${paramsRef},
		returnType: '${getDataDisplayType(returnTypeDef)}',
	})
},`

export interface GenerateGlueParams {
	controllers: ControllerObject[]
	clusters: ClusterObject[]
}

export async function generateGlue(params: GenerateGlueParams) {
	let template = await fetch(getUrls().glueTemplate).then(res => res.text())
	const DEFINE_CUSTOM_STORABLES = '// DEFINE_CUSTOM_STORABLES'
	const INSERT_CUSTOM_STORABLES = '// INSERT_CUSTOM_STORABLES'
	const EXPORT_AND_DEFINE_CONTROLLERS = '// EXPORT_AND_DEFINE_CONTROLLERS'
	const EXPORT_AND_DEFINE_MODELS = '// EXPORT_AND_DEFINE_MODELS'

	// add all the custom storable definitions
	{
		const customStorables: string[] = []

		for (const object of params.controllers) {
			for (const method of object.methods) {
				if (method.type === 'conventional') continue

				const methodPath = `${object.name}/${method.name}`
				const transferType = method.tense === 'singular' ? `${method.emitModel} | null` : `${method.emitModel}[]`
				const initialValue = method.tense === 'singular' ? 'null' : '[]'

				customStorables.push(
					`const store_${object.name}_${method.name} = makeCustomStorable<${transferType}>('${methodPath}', ${initialValue})`
				)
			}
		}

		template = template.replace(DEFINE_CUSTOM_STORABLES, customStorables.join('\n'))
	}

	// add all the custom storable inserts into the bareConnect function
	{
		const inserts: string[] = []

		for (const object of params.controllers) {
			for (const method of object.methods) {
				if (method.type === 'conventional') continue

				const methodPath = `${object.name}/${method.name}`

				inserts.push(`'${methodPath}': store_${object.name}_${method.name},`)
			}
		}

		template = template.replace(
			INSERT_CUSTOM_STORABLES,
			indent(inserts.join('\n'), {
				depth: 2,
				preventFirstTab: true,
			})
		)
	}

	// add all controllers definitions and export them
	{
		const controllers: string[] = []

		for (const object of params.controllers) {
			const methods: string[] = []

			for (const method of object.methods) {
				if (method.type === 'connection') {
					methods.push(`${method.name}: store_${object.name}_${method.name}.readable,`)
				} else {
					const paramsDef = method.params ? `params: ${stringifyType(method.params, 2)}` : ''
					const returnType = `Promise<${method.returnType ? stringifyType(method.returnType, 2) : 'void'}>`
					const paramsRef = method.params ? 'params' : 'null'

					methods.push(conventionalMethodTemplate(method.name, paramsDef, returnType, paramsRef, object.name, method.returnType))
				}
			}

			const insides = indent(methods.join('\n'))
			controllers.push(`${object.name}: {\n${insides}\n},`)
		}

		const text = `export const controllers = {\n${indent(controllers.join('\n'))}\n}`
		template = template.replace(EXPORT_AND_DEFINE_CONTROLLERS, text)
	}

	// add all model definitions and export them
	{
		const models: string[] = []

		for (const object of params.clusters) {
			for (const model of object.defs) {
				models.push(`export interface ${model.name} ${stringifyType({ $: 'object', properties: model.properties }, 0)}`)
			}
		}

		template = template.replace(EXPORT_AND_DEFINE_MODELS, models.join('\n\n'))
	}

	return template
}
