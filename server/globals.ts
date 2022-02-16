import { flags } from '../deps.ts'

const options = flags.parse(Deno.args)

export const PORT: number = options.port || parseInt(Deno.env.get('PORT') || '8080')
export const FS_ROOT: string = options.dataDir || 'data'
