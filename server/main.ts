import { http, flags } from '../deps.ts'
import { rootRequestHandler } from '../lib/mod.ts'
import { setFsRoot, setPort } from './globals.ts'

import './register-controllers.ts'
import './connection.ts'
import './bypass/mod.ts'

const options = flags.parse(Deno.args)

const port: number = options.port || parseInt(Deno.env.get('PORT') || '8080')
const dataDir: string = options.dataDir || 'data'

// Create the dataDir if it does not exist
{
	try {
		await Deno.stat(dataDir)
	} catch (_) {
		await Deno.mkdir(dataDir, { recursive: true })
	}
}

// Remember the globals
setFsRoot(dataDir)
setPort(port)

// Handle requests
{
	const handler = async (request: Request): Promise<Response> => {
		const response = await rootRequestHandler(request)

		if (!response) return new Response('route not found', { status: http.Status.NotFound })

		return response
	}

	console.log(`Starting server at http://localhost:${port}`)

	http.serve(handler, {
		port,
		// deno-lint-ignore no-explicit-any
		onError(error: any) {
			if (error.isUserError) return new Response(error.message, { status: 406 })

			console.log('internal server error:\n', error.message ? error.message : error)
			console.log(error.stack)
			return new Response('internal server error', { status: 500 })
		},
	})
}
