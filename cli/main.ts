import { generate } from './generate/mod.ts'
import { setup } from './setup.ts'
import { getVersion, getUrls } from './utils/urls.ts'
import { spawn } from './utils/spawn.ts'
import { runIfWatch } from './utils/run-if-watch.ts'
import { sade, colors } from './deps.ts'

// deno-lint-ignore no-explicit-any
type Any = any

const simplifyPath = (path: string) => (path.endsWith('/') ? path.slice(-1) : path)
const watchLog = (message: string) => console.log(colors.blue('Watcher'), message)
const autobaseLog = (message: string) => console.log(colors.cyan('Autobase'), message)

const parseRestArgs = (args: string[]): { deno: string[]; app: string[] } => {
	const defaultDenoArgs = ['-A', '--unstable']

	const dividerIndex = args.indexOf('--')
	if (dividerIndex === -1) return { deno: defaultDenoArgs, app: [] }

	const actualDeno = args.slice(0, dividerIndex)
	const actualApp = args.slice(dividerIndex + 1)

	const originalOmitsDeno = Deno.args.indexOf('--') === -1

	return {
		deno: originalOmitsDeno ? defaultDenoArgs : actualDeno,
		app: actualApp,
	}
}

const program = sade('autobase')

program.version(getVersion() || 'dev [un-versioned]')

program
	.command('run <dir>', 'Build and run server defined in <dir>')
	.option('--watch', 'If passed, server will be rebuilt and restarted when content files change')
	.option('--generate-dir', 'Directory to stash generated files in.  Defaults to `.autobase`.')
	.option('--glue <path>', 'If specified, Autobase will generate client glue code and write it to this file')
	.action(async (rawDir: string, options: Any) => {
		const watch = !!options.watch
		const dir = simplifyPath(rawDir)
		const generateDir = simplifyPath(options.generateDir || '.autobase')
		const gluePath = options.glue ? simplifyPath(options.glue) : null
		const { app, deno } = parseRestArgs(options._)

		await setup({ generateDir })

		await runIfWatch({
			path: dir,
			watch,
			async fn({ abortSignal, eventType }) {
				if (eventType === 'change') autobaseLog('File change detected!  Recompiling...')
				else autobaseLog('Compiling server...')

				await generate({ generateDir, dir, gluePath })

				if (eventType === 'change') watchLog('Restarting server...')
				else watchLog('Starting server...')

				spawn({
					cmd: ['deno', 'run', '--importmap', `${generateDir}/importmap.json`, ...deno, getUrls().server, ...app],
					abortSignal,
				}).then(({ code }) => {
					if (abortSignal.aborted) return

					if (code) watchLog('Process failed!  Restarting on file change...')
					else watchLog('Process finished.  Restarting on file change...')
				})
			},
		})
	})

await program.parse(Deno.args)
