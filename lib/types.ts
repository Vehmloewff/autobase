export interface Connection {
	getUser(): Promise<User>
	set(document: unknown): void
	insert(document: unknown): void
	update(document: unknown): void
	remove(documentId: string): void
	onDestroy(fn: () => void): void
}

export interface Context {
	getUser(): Promise<User>
	request: Request
	responseHeaders: Headers
}

export type User = RealUser | GuestUser | AdminUser

export interface RealUser {
	isReal: true
	isGuest: false
	isAdmin: false
	userId: string
	clientId: string
}

export interface GuestUser {
	isReal: false
	isGuest: true
	isAdmin: false
	clientId: string
}

export interface AdminUser {
	isReal: false
	isGuest: false
	isAdmin: true
	clientId: string
}
