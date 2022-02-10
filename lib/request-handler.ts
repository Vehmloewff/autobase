export type RequestHandler = (request: Request) => Promise<Response | null> | null | Response

const requestHandlers: RequestHandler[] = []

export function registerRequestHandler(handler: RequestHandler) {
	requestHandlers.push(handler)
}

export const rootRequestHandler: RequestHandler = async request => {
	for (const handler of requestHandlers) {
		const response = await handler(request)

		if (response) return response
	}

	return null
}
