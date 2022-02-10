import { UserError } from './utils.ts'
import { User } from './types.ts'

interface ClientInfo {
	userId: string
	title: string | null
	userAgent: string | null
	location: string | null
	expirationDate: number
}

const clientIds: Record<string, ClientInfo> = {}

/** Remember a particular client as belonging to `userId`.
 * Only call this method when the client has authenticated itself as `userId` */
export function assignClientToUser(clientId: string, userId: string, expiresIn?: number) {
	clientIds[clientId] = {
		userId,
		location: null,
		title: null,
		userAgent: null,
		expirationDate: Date.now() + (expiresIn || 2592000000),
	}
}

export function getClientsOfUser(userId: string) {
	const clients: string[] = []

	for (const clientId in clientIds) {
		const info = clientIds[clientId]

		if (info.userId === userId) clients.push(clientId)
	}

	return clients
}

export function unAssociateClient(clientId: string) {
	delete clientIds[clientId]
}

export function editClientInfo(clientId: string, info: Omit<ClientInfo, 'userId'>) {
	if (!clientIds[clientId]) throw new UserError('sent client id does not exist')

	clientIds[clientId].expirationDate = info.expirationDate
	clientIds[clientId].location = info.location
	clientIds[clientId].title = info.title
	clientIds[clientId].userAgent = info.userAgent
}

export function inferUserFromClient(clientId: string): User {
	const info = clientIds[clientId]
	if (!info) return { clientId, isAdmin: false, isGuest: true, isReal: false }

	// todo add test case for admin

	return {
		clientId,
		isAdmin: false,
		isGuest: false,
		isReal: true,
		userId: info.userId,
	}
}

// Check for expired sessions every hour
setInterval(() => {
	for (const clientId of Object.keys(clientIds)) {
		if (clientIds[clientId].expirationDate <= Date.now()) delete clientIds[clientId]
	}
}, 1000 * 60 * 60)
