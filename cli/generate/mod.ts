import { generateClusters, ClusterObject } from './clusters.ts'
import { generateControllers, ControllerObject } from './controllers.ts'
import { generateModels } from './models.ts'
import { getModels } from '../parse/cluster.ts'
import { getMethods } from '../parse/controller.ts'
import { insertInTemplate } from './shared.ts'
import { getUrls, getBasename } from '../utils/urls.ts'
import { exploreDirectory } from '../utils/explore.ts'
import { check } from './check.ts'
import { generateGlue } from './glue.ts'

export interface GenerateParams {
	dir: string
	generateDir: string
	gluePath: string | null
}

export async function generate(params: GenerateParams) {
	const urls = getUrls()
	const exploration = await exploreDirectory(params.dir)

	const clusterObjects = await Promise.all(
		exploration.clusters.map(async url => {
			await check(url)
			const parsed = await getModels(url)

			const object: ClusterObject = {
				defs: parsed,
				name: getBasename(url),
				url,
			}

			return object
		})
	)

	const controllerObjects = await Promise.all(
		exploration.controllers.map(async url => {
			await check(url)
			const parsed = await getMethods(url)

			const object: ControllerObject = {
				methods: parsed,
				name: getBasename(url),
				url,
			}

			return object
		})
	)

	// throw some helpful messages if objects are empty
	if (!clusterObjects.length)
		console.log(`no clusters were found in "${params.dir}" - try adding a *.cluster.ts file somewhere in the project`)
	if (!controllerObjects.length)
		console.log(`no controllers were found in "${params.dir}" - try adding a *.controller.ts file somewhere in the project`)

	const write = async (file: string, content: string) => await Deno.writeTextFile(`${params.generateDir}/${file}`, content)

	// write the clusters mock replacement
	await write('clusters.generated.ts', await insertInTemplate(urls.mockTemplates.clusters, generateClusters(clusterObjects)))

	// write the controllers mock replacement
	await write('controllers.generated.ts', await insertInTemplate(urls.mockTemplates.controllers, generateControllers(controllerObjects)))

	// write the models mock replacement
	await write('models.mock.ts', await insertInTemplate(urls.mockTemplates.models, generateModels(clusterObjects)))

	// write the glue
	if (params.gluePath) {
		await Deno.writeTextFile(params.gluePath, await generateGlue({ clusters: clusterObjects, controllers: controllerObjects }))
	}
}
