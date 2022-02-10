export interface RunIfWatchFnParams {
	eventType: 'start' | 'change'
	abortSignal: AbortSignal
}

export interface RunIfWatchParams {
	watch: boolean
	path: string
	fn(params: RunIfWatchFnParams): Promise<unknown>
}

export async function runIfWatch(params: RunIfWatchParams) {
	let abortController = new AbortController()

	await params.fn({ abortSignal: abortController.signal, eventType: 'start' })

	if (params.watch) {
		let timeout = 0
		for await (const event of Deno.watchFs(params.path)) {
			if (event.kind === 'create' || event.kind === 'modify' || event.kind === 'remove') {
				clearTimeout(timeout)
				timeout = setTimeout(() => {
					abortController.abort()
					abortController = new AbortController()

					params.fn({
						abortSignal: abortController.signal,
						eventType: 'change',
					})
				}, 300)
			}
		}
	}
}
