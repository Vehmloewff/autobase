import { http } from '../deps.ts'
import { rootRequestHandler } from '../lib/mod.ts'
import { PORT } from './globals.ts'

import './register-controllers.ts'
import './connection.ts'
import './bypass/mod.ts'

// Handle requests
{
	const handler = async (request: Request): Promise<Response> => {
		const response = (await rootRequestHandler(request)) || new Response('route not found', { status: http.Status.NotFound })

		response.headers.append('Access-Control-Allow-Origin', '*')

		return response
	}

	console.log(`Starting server at http://localhost:${PORT}`)

	http.serve(handler, {
		port: PORT,
		// deno-lint-ignore no-explicit-any
		onError(error: any) {
			if (error.isUserError) return new Response(error.message, { status: 406 })

			console.log('internal server error:\n', error.message ? error.message : error)
			console.log(error.stack)
			return new Response('internal server error', { status: 500 })
		},
	})
}
