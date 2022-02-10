export class UserError extends Error {
	isUserError = true

	constructor(message: string) {
		super()
		this.message = message
	}
}
