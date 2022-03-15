export async function getLatestVersion() {
	const url = 'https://github.com/Vehmloewff/autobase/releases/latest'
	const res = await fetch(url)

	const newLocation = res.url
	if (newLocation === url) throw new Error('expected github to redirect to the latest release')

	const newTag = newLocation.split('/').pop()
	if (!newTag) throw new Error('Unexpected location header received from github')

	return newTag
}

export async function install(version: string) {
	await Deno.run({
		cmd: [
			'deno',
			'install',
			'-A',
			'--unstable',
			'--name',
			'autobase',
			'-f',
			`https://denopkg.com/Vehmloewff/autobase@${version}/cli/main.ts`,
		],
	}).status()
}
