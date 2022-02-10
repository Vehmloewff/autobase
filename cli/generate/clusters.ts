import { indent } from './shared.ts'
import { ModelDef } from '../parse/cluster.ts'

export interface ClusterObject {
	name: string
	url: string
	defs: ModelDef[]
}

export function generateClusters(clusters: ClusterObject[]) {
	const body = indent(
		clusters
			.map(cluster => {
				const models = cluster.defs.map(def => def.name)
				const insides = `name: '${cluster.name}',\nmodels: [\n${indent(models.map(model => `'${model}',`).join('\n'))}\n]`

				return `${cluster.name}: {\n${indent(insides)}\n}`
			})
			.join('\n')
	)

	return { body }
}
