import {
	InterfacePropertyDef as TsInterfacePropertyDef,
	LiteralPropertyDef as TsLiteralPropertyDef,
	TsTypeDef,
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

export type TypeDef = NullDef | ArrayDef | ObjectDef | StringDef | NumberDef | BooleanDef | UnionDef | BinaryDef

export interface PropertyDef {
	name: string
	type: TypeDef
}

export function parseTypeDef(def: TsTypeDef): TypeDef {
	if (def.kind === 'keyword') {
		if (def.keyword === 'string') return { $: 'string', literal: null }
		if (def.keyword === 'null') return { $: 'null' }
		if (def.keyword === 'boolean') return { $: 'boolean', literal: null }
		if (def.keyword === 'number') return { $: 'number', literal: null }
	}
	if (def.kind === 'array') return { $: 'array', type: parseTypeDef(def.array) }
	if (def.kind === 'union') return { $: 'union', options: def.union.map(type => parseTypeDef(type)) }
	if (def.kind === 'literal') {
		if (def.literal.kind === 'string') return { $: 'string', literal: def.literal.string }
		if (def.literal.kind === 'number') return { $: 'number', literal: def.literal.number }
		if (def.literal.kind === 'boolean') return { $: 'boolean', literal: def.literal.boolean }
	}
	if (def.kind === 'typeLiteral') return parseObjectDef(def.typeLiteral.properties)
	if (def.kind === 'typeRef') {
		if (def.typeRef.typeName === 'Uint8Array') return { $: 'binary' }
	}

	console.log('unsupported type:', def)
	throw new Error('found an unsupported type')
}

export function parseObjectDef(propertiesDef: TsInterfacePropertyDef[] | TsLiteralPropertyDef[]): ObjectDef {
	const properties: PropertyDef[] = []

	for (const property of propertiesDef) {
		if (property.optional) throw new Error('Models cannot have optional properties')

		const { tsType } = property
		if (!tsType) throw new Error(`Every interface property must specify a type, but property ${property.name} has no type`)

		properties.push({ name: property.name, type: parseTypeDef(tsType) })
	}

	return {
		$: 'object',
		properties,
	}
}
