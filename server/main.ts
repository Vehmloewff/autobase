import { http } from '../deps.ts'
import { rootRequestHandler } from '../lib/mod.ts'
import { PORT } from './globals.ts'

import './register-controllers.ts'
import './connection.ts'
import './bypass/mod.ts'

const defaultHeaders = new Headers({
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': '*',
})

// Handle requests
{
	const handler = async (request: Request): Promise<Response> => {
		const response = await rootRequestHandler(request)

		// handle 404s but always return ok to preflight requests
		if (!response) {
			if (request.method === 'OPTIONS') return new Response('ok', { headers: defaultHeaders })

			return new Response('route not found', { status: http.Status.NotFound, headers: defaultHeaders })
		}

		// Don't try to add CORS to ws connections
		if (new URL(request.url).pathname === '/connection') return response

		// Add CORS to all other responses
		{
			for (const [key, value] of response.headers.entries()) defaultHeaders.set(key, value)

			return new Response(await response.blob(), {
				headers: defaultHeaders,
				status: response.status,
				statusText: response.statusText,
			})
		}
	}

	console.log(`Starting server at http://localhost:${PORT}`)

	http.serve(handler, {
		port: PORT,
		// deno-lint-ignore no-explicit-any
		onError(error: any) {
			if (error.isUserError) return new Response(error.message, { status: 406, headers: defaultHeaders })

			console.log('internal server error:\n', error.message ? error.message : error)
			console.log(error.stack)

			return new Response('internal server error', { status: 500, headers: defaultHeaders })
		},
	})
}
