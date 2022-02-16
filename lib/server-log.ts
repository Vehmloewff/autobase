import { FS_ROOT } from '../server/globals.ts'

export function severLog(message: string) {
	console.log('[server log]', message)

	Deno.writeTextFile(`${FS_ROOT}/log.txt`, `${Date.now()} ${message}\n`, {
		append: true,
	})
}
