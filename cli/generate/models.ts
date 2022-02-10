import { ClusterObject } from './clusters.ts'
import { indent } from './shared.ts'

export function generateModels(clusters: ClusterObject[]) {
	const modelInserts: string[] = []

	for (const cluster of clusters) {
		for (const model of cluster.defs) {
			modelInserts.push(`${model.name}: ${cluster.name}.${model.name} as Model<unknown>,`)
		}
	}

	const imports = clusters.map(cluster => `import * as ${cluster.name} from '${cluster.url}'`).join('\n')

	return {
		body: indent(modelInserts.join('\n')),
		imports,
	}
}
