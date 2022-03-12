import { doc } from 'https://deno.land/x/deno_doc@v0.29.0/mod.ts'
import { PropertyDef, parseObjectDef } from './shared.ts'

export interface ModelDef {
	name: string
	properties: PropertyDef[]
}

export async function getModels(url: string) {
	const models: ModelDef[] = []
	const entries = await doc(url)

	for (const entry of entries) {
		if (entry.kind !== 'interface') continue

		if (entry.interfaceDef.extends.length)
			throw new Error(
				`Models cannot extend anything, but interface ${entry.name} extends ${entry.interfaceDef.extends.length} interface(s)`
			)

		const { properties } = parseObjectDef(entry.interfaceDef.properties, entries)

		models.push({ name: entry.name, properties })
	}

	return models
}
