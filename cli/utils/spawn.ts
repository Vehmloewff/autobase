export interface SpawnParams {
	abortSignal?: AbortSignal
	cmd: string[]
	cwd?: string
	env?: Record<string, string>
	clearEnv?: boolean
}

export async function spawn(params: SpawnParams): Promise<Deno.ProcessStatus> {
	const process = Deno.run({
		cmd: params.cmd,
		cwd: params.cwd,
		env: params.env,
		clearEnv: params.clearEnv,
	})

	const abortSignal = params.abortSignal
	const abortListener = () => {
		process.kill('SIGTERM')
		process.close()
	}

	if (abortSignal) abortSignal.addEventListener('abort', abortListener)

	const status = await process.status()

	if (abortSignal) abortSignal.removeEventListener('abort', abortListener)

	return status
}
