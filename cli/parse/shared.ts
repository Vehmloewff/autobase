import {
	InterfacePropertyDef as TsInterfacePropertyDef,
	LiteralPropertyDef as TsLiteralPropertyDef,
	TsTypeDef,
	DocNode,
} from 'https://deno.land/x/deno_doc@v0.29.0/lib/types.d.ts'

export interface NullDef {
	$: 'null'
}

export interface ArrayDef {
	$: 'array'
	type: TypeDef
}

export interface ObjectDef {
	$: 'object'
	properties: PropertyDef[]
}

export interface StringDef {
	$: 'string'
	literal: string | null
}

export interface NumberDef {
	$: 'number'
	literal: number | null
}

export interface BooleanDef {
	$: 'boolean'
	literal: boolean | null
}

export interface UnionDef {
	$: 'union'
	options: TypeDef[]
}

export interface BinaryDef {
	$: 'binary'
}

export interface ModelRef {
	$: 'model-ref'
	name: string
	path: string[]
}

export type TypeDef = NullDef | ArrayDef | ObjectDef | StringDef | NumberDef | BooleanDef | UnionDef | BinaryDef | ModelRef

export interface PropertyDef {
	name: string
	type: TypeDef
}

export function parseTypeDef(def: TsTypeDef, all: DocNode[]): TypeDef {
	if (def.kind === 'keyword') {
		if (def.keyword === 'string') return { $: 'string', literal: null }
		if (def.keyword === 'null') return { $: 'null' }
		if (def.keyword === 'boolean') return { $: 'boolean', literal: null }
		if (def.keyword === 'number') return { $: 'number', literal: null }
	}
	if (def.kind === 'array') return { $: 'array', type: parseTypeDef(def.array, all) }
	if (def.kind === 'union') return { $: 'union', options: def.union.map(type => parseTypeDef(type, all)) }
	if (def.kind === 'literal') {
		if (def.literal.kind === 'string') return { $: 'string', literal: def.literal.string }
		if (def.literal.kind === 'number') return { $: 'number', literal: def.literal.number }
		if (def.literal.kind === 'boolean') return { $: 'boolean', literal: def.literal.boolean }
	}
	if (def.kind === 'typeLiteral') return parseObjectDef(def.typeLiteral.properties, all)
	if (def.kind === 'typeRef') {
		if (def.typeRef.typeName === 'Uint8Array') return { $: 'binary' }

		return resolveTypeRef(def.typeRef.typeName, all)
	}
	if (def.kind === 'indexedAccess') {
		if (def.indexedAccess.indexType.kind === 'literal' && def.indexedAccess.indexType.literal.kind === 'string') {
			const path = def.indexedAccess.indexType.literal.string
			const obj = parseTypeDef(def.indexedAccess.objType, all)

			if (obj.$ === 'model-ref') {
				obj.path.push(path)
				return obj
			}
			if (obj.$ !== 'object') throw new Error('indexed access was used on a structure other than an object')

			const indexedValue = obj.properties.find(prop => prop.name === path)
			if (!indexedValue) throw new Error(`index path "${path}" used by indexed access does not exist`)

			return indexedValue.type
		}
	}

	console.log('unsupported type:', def)
	throw new Error('found an unsupported type')
}

function resolveTypeRef(name: string, all: DocNode[]): TypeDef {
	for (const entry of all) {
		if (entry.kind !== 'typeAlias') continue

		if (entry.name === name) return parseTypeDef(entry.typeAliasDef.tsType, all)
	}

	return { $: 'model-ref', name, path: [] }
}

export function parseObjectDef(propertiesDef: TsInterfacePropertyDef[] | TsLiteralPropertyDef[], all: DocNode[]): ObjectDef {
	const properties: PropertyDef[] = []

	for (const property of propertiesDef) {
		if (property.optional) throw new Error('Models cannot have optional properties')

		const { tsType } = property
		if (!tsType) throw new Error(`Every interface property must specify a type, but property ${property.name} has no type`)

		properties.push({ name: property.name, type: parseTypeDef(tsType, all) })
	}

	return {
		$: 'object',
		properties,
	}
}
