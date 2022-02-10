export async function check(file: string) {
	const proc = Deno.run({
		cmd: ['deno', 'cache', '--unstable', file],
	})

	const status = await proc.status()

	if (status.code) throw new Error('type check failed')
}
