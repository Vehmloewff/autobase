import { http } from '../deps.ts'
import { rootRequestHandler } from '../lib/mod.ts'

import './register-controllers.ts'
import './bypass/mod.ts'

// TODO settings instead of globals
// CLI with support for BYPASS_PASSWORD and DATA_DIR
// PORT and --port support
// Get clusters, collections, and documents

const handler = async (request: Request): Promise<Response> => {
	const response = await rootRequestHandler(request)

	if (!response) return new Response('route not found', { status: http.Status.NotFound })

	return response
}

console.log('Starting server at http://localhost:3000')

http.serve(handler, {
	port: 3000,
	// deno-lint-ignore no-explicit-any
	onError(error: any) {
		if (error.isUserError) return new Response(error.message, { status: 406 })

		console.log('internal server error:\n', error.message ? error.message : error)
		console.log(error.stack)
		return new Response('internal server error', { status: 500 })
	},
})
