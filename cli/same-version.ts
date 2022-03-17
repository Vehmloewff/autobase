import { version } from './utils/urls.ts'

export async function getProjectDepsVersion(dir: string) {
	const depsTs = await Deno.readTextFile(`${dir}/deps.ts`).catch(() => null)
	if (!depsTs) return null

	const match = depsTs.match(/autobase@(\d+\.\d+\.\d+)/)
	if (!match) return null

	const version = match[1]
	if (!version) return null

	return version
}

export async function warnIfProjectIsNotOnDepsVersion(dir: string) {
	const projectVersion = await getProjectDepsVersion(dir)
	if (!projectVersion) return

	if (projectVersion === version) return

	console.warn(`This project is using autobase version ${projectVersion}, but the CLI is running version ${version}.`)
	console.warn(`Due to the way that autobase works internally, you must always be using the same CLI version as project version.`)
	console.warn(`Failure to do this can cause many things to go wrong.`)
}
