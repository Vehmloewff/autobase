export interface SetupOptions {
	generateDir: string
}

export async function setup({ generateDir }: SetupOptions) {
	const generateDirExists = await exists(generateDir)
	if (!generateDirExists) await Deno.mkdir(generateDir, { recursive: true })

	// todo write importmap
}

async function exists(path: string) {
	try {
		await Deno.stat(path)
		return true
	} catch (_) {
		return false
	}
}
