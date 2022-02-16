export interface SetupOptions {
	generateDir: string
}

export async function setup({ generateDir }: SetupOptions) {
	const generateDirExists = await exists(generateDir)
	if (!generateDirExists) await Deno.mkdir(generateDir, { recursive: true })

	await Deno.writeTextFile(
		`${generateDir}/importmap.json`,
		JSON.stringify(
			{
				imports: {
					'clusters.mock.ts': `file://${Deno.cwd()}/${generateDir}/clusters.generated.ts`,
					'controllers.mock.ts': `file://${Deno.cwd()}/${generateDir}/controllers.generated.ts`,
					'models.mock.ts': `file://${Deno.cwd()}/${generateDir}/models.generated.ts`,
				},
			},
			null,
			'\t'
		)
	)
}

async function exists(path: string) {
	try {
		await Deno.stat(path)
		return true
	} catch (_) {
		return false
	}
}
