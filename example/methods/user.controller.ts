import { Context, UserError, linkResponder, sendEmail, assignClientToUser } from '../../mod.ts'
import { UserInfo } from '../db.cluster.ts'

export async function login(context: Context, email: string) {
	const user = await context.getUser()
	if (!user.isGuest) throw new UserError('Only guest users can login')

	const info = await findUserInfoByEmail(email)
	if (!info) throw new UserError('A user with this email does not exist')

	const magicLink = linkResponder({
		listener() {
			const response = selfClosingResponse()

			assignClientToUser(user.clientId, info.id)

			return response
		},
	})

	await sendEmail({
		to: email,
		from: 'no-reply@example.com',
		subject: 'Login Link',
		text: `Click this link to login:\n\n${magicLink}\n`,
	})
}

export async function createAccount(context: Context, email: string): Promise<void> {
	const user = await context.getUser()
	if (!user.isGuest) throw new UserError('Only guest users can login')

	const info = await findUserInfoByEmail(email)
	if (info) throw new UserError('A user with this email already exists')

	const magicLink = linkResponder({
		async listener() {
			const info: UserInfo = {
				id: crypto.randomUUID(),
				email,
				firstName: null,
				lastName: null,
				notebooks: {},
				username: null,
				avatar: new Uint8Array(),
			}

			await UserInfo.insert(info)
			const response = selfClosingResponse()

			assignClientToUser(user.clientId, info.id)

			return response
		},
	})

	await sendEmail({
		to: email,
		from: 'no-reply@example.com',
		subject: 'Confirm Your Email',
		text: `Click this link to create your account:\n\n${magicLink}\n`,
	})
}

function selfClosingResponse() {
	return new Response(`<script>window.close()</script>`)
}

async function findUserInfoByEmail(email: string) {
	for await (const info of UserInfo.all()) {
		if (info.email == email) return info
	}

	return null
}
