import { TsTypeDef, doc } from '../deps.ts'
import { TypeDef, parseTypeDef } from './shared.ts'

export type MethodDef = ConventionalMethodDef | ConnectionMethodDef

export interface ConventionalMethodDef {
	name: string
	type: 'conventional'
	params: TypeDef | null
	returnType: TypeDef | null
}

export interface ConnectionMethodDef {
	name: string
	type: 'connection'
	tense: 'singular' | 'plural'
	emitModel: string
}

export async function getMethods(url: string): Promise<MethodDef[]> {
	const methods: MethodDef[] = []
	const entries = await doc(url)

	for (const entry of entries) {
		if (entry.kind !== 'function') continue

		const type = entry.name.startsWith('$') ? 'connection' : 'conventional'
		const loc = `method "${entry.name}" @ ${url}`
		let params: null | TypeDef = null

		let argumentNumber = 0
		for (const param of entry.functionDef.params) {
			if (argumentNumber === 0) argumentNumber++
			else if (argumentNumber === 1) argumentNumber++
			else if (argumentNumber === 2) throw new Error(`you are not allowed to pass more than two arguments into a method (${loc})`)

			if (param.kind === 'rest')
				throw new Error(
					`rest params (...) are not allowed in methods.  Conventional methods can not have more than two parameters and connection methods can only have one parameter (${loc}`
				)
			if (param.kind === 'assign')
				throw new Error(`assign params are not supported because it is very difficult to infer their type (${loc}`)

			const { tsType } = param
			if (!tsType) throw new Error(`all params to methods must be typed (${loc})`)

			if (argumentNumber === 1) {
				if (type === 'conventional')
					if (tsType.kind !== 'typeRef' || tsType.typeRef.typeName !== 'Context')
						throw new Error(`the first argument to a conventional method must be of type Context (${loc})`)

				if (type === 'connection')
					if (tsType.kind !== 'typeRef' || tsType.typeRef.typeName !== 'Connection')
						throw new Error(`the first argument to a connection method must be of type Connection (${loc}`)
			} else if (argumentNumber === 2) {
				if (type === 'connection') throw new Error(`it is illegal to specify a second argument in a connection method (${loc})`)

				params = parseTypeDef(tsType)
			}
		}

		const returnType = entry.functionDef.returnType

		if (type === 'connection') {
			if (!returnType) throw new Error(`all connection methods must have a return type (${loc})`)

			const inferTenseAndEmitModel = (type: TsTypeDef): Pick<ConnectionMethodDef, 'emitModel' | 'tense'> => {
				if (type.kind === 'typeRef' && type.typeRef.typeName === 'Promise') {
					const typeParams = type.typeRef.typeParams
					if (!typeParams?.length) throw new Error(`expected Promise to have a type parameter (${loc})`)

					return inferTenseAndEmitModel(typeParams[0])
				}

				if (type.kind === 'typeRef' && type.typeRef.typeName === 'SingularConnection') {
					const typeParams = type.typeRef.typeParams
					if (!typeParams?.length) throw new Error(`expected Promise to have a type parameter (${loc})`)

					const childType = typeParams[0]
					if (childType.kind !== 'typeRef') throw new Error(`expected SingularConnection's type parameter to be a Model (${loc})`)

					return {
						tense: 'singular',
						emitModel: childType.typeRef.typeName,
					}
				}

				if (type.kind === 'typeRef' && type.typeRef.typeName === 'PluralConnection') {
					const typeParams = type.typeRef.typeParams
					if (!typeParams?.length) throw new Error(`expected Promise to have a type parameter (${loc})`)

					const childType = typeParams[0]
					if (childType.kind !== 'typeRef') throw new Error(`expected PluralConnection's type parameter to be a Model (${loc})`)

					return {
						tense: 'singular',
						emitModel: childType.typeRef.typeName,
					}
				}

				throw new Error(`invalid type returned.  Method must return a singularConnection or a pluralConnection (${loc})`)
			}

			methods.push({ type: 'connection', name: entry.name, ...inferTenseAndEmitModel(returnType) })
		}

		if (type === 'conventional') {
			const getReturnType = (type?: TsTypeDef): TypeDef | null => {
				if (!type) return null

				if (type.kind === 'typeRef' && type.typeRef.typeName === 'Promise') {
					const typeParams = type.typeRef.typeParams
					if (!typeParams?.length) throw new Error(`expected Promise to have a type parameter (${loc})`)

					return getReturnType(typeParams[0])
				}

				if (type.kind === 'keyword' && type.keyword === 'void') return null

				return parseTypeDef(type)
			}

			methods.push({ type: 'conventional', name: entry.name, params, returnType: getReturnType(returnType) })
		}
	}

	return methods
}
