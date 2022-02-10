import { FS_ROOT } from '../server/globals.ts'

export function severLog(message: string) {
	Deno.writeTextFile(`${FS_ROOT}/log.txt`, `${message}\n`, {
		append: true,
	})
}
