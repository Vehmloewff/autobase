import { http } from '../deps.ts'
import { rootRequestHandler } from '../lib/mod.ts'
import { PORT } from './globals.ts'

import './register-controllers.ts'
import './connection.ts'
import './bypass/mod.ts'

// Handle requests
{
	const handler = async (request: Request): Promise<Response> => {
		const response =
			(await rootRequestHandler(request)) ||
			(request.method === 'OPTIONS' ? new Response('ok') : new Response('route not found', { status: http.Status.NotFound }))

		if (new URL(request.url).pathname === '/connection') return response

		const headers = new Headers({
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Methods': '*',
		})
		for (const [key, value] of response.headers.entries()) headers.set(key, value)

		return new Response(await response.blob(), { headers, status: response.status, statusText: response.statusText })
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
