import { pathUtils } from '../deps.ts'

export interface RunIfWatchFnParams {
	eventType: 'start' | 'change'
	abortSignal: AbortSignal
}

export interface RunIfWatchParams {
	watch: boolean
	path: string
	fn(params: RunIfWatchFnParams): Promise<unknown>
	ignorePaths: string[]
}

export async function runIfWatch(params: RunIfWatchParams) {
	let abortController = new AbortController()

	await params.fn({ abortSignal: abortController.signal, eventType: 'start' })

	if (params.watch) {
		let timeout = 0
		for await (const event of Deno.watchFs(params.path)) {
			if (event.kind !== 'create' && event.kind !== 'modify' && event.kind !== 'remove') continue

			let pathsContainsWatchedFiles = false
			for (const changedPath of event.paths) {
				let ignored = false

				for (const ignorePath of params.ignorePaths) {
					const fullIgnorePath = pathUtils.join(Deno.cwd(), ignorePath)

					if (changedPath.startsWith(fullIgnorePath)) {
						ignored = true
						break
					}
				}

				// If this path is not ignored, the event contains files that should trigger a run
				if (!ignored) pathsContainsWatchedFiles = true
			}

			if (!pathsContainsWatchedFiles) continue

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
