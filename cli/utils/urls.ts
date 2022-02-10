export function getVersion() {
	const pattern = new URLPattern({ pathname: '/Vehmloewff/autobase/:tag/cli/utils/urls.ts' })
	const url = import.meta.url

	const match = pattern.exec(url)
	console.log(match)
	if (!match) {
		console.log(url)
		if (url.startsWith('http:') || url.startsWith('https:'))
			throw new Error('Autobase must be installed at a specific version in order for it to work correctly')

		return null
	}

	const { tag } = match.pathname.groups
	if (!tag.startsWith('@')) return null

	return tag.slice(1)
}

export function getUrls() {
	const version = getVersion()
	const base = version ? `https://denopkg.com/Vehmloewff/autobase/@${version}` : `file://${Deno.cwd()}`

	return {
		server: `${base}/server/main.ts`,
		lib: `${base}/mod.ts`,
		glueTemplate: `${base}/cli/generate/templates/glue.ts`,
		mockTemplates: {
			controllers: `${base}/server/mock/controllers.mock.ts`,
			clusters: `${base}/server/mock/clusters.mock.ts`,
			models: `${base}/server/mock/models.mock.ts`,
		},
	}
}

export function getBasename(path: string) {
	const file = path.split('/').pop() as string
	return file.split('.').shift() as string
}
