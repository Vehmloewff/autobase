import { recursiveReaddir } from 'https://deno.land/x/recursive_readdir@v2.0.0/mod.ts'

export interface ExploreDirectoryResult {
	controllers: string[]
	clusters: string[]
}

/**
 * Recursively loops through directory and returns the url of all files matched as controllers and clusters
 */
export async function exploreDirectory(dir: string) {
	const files = await recursiveReaddir(dir)

	const controllers: string[] = []
	const clusters: string[] = []

	const fileToUrl = (file: string) => {
		if (file.startsWith('/')) return `file://${file}`
		if (file.startsWith('file://')) return file

		return `file://${Deno.cwd()}/${file}`
	}

	for (const file of files) {
		if (file.endsWith('.controller.ts')) controllers.push(fileToUrl(file))
		if (file.endsWith('.cluster.ts')) clusters.push(fileToUrl(file))
	}

	return {
		controllers,
		clusters,
	}
}
