import { getSettings } from './settings.ts'
import { severLog } from './server-log.ts'

export interface SendEmailParams {
	to: string
	from: string
	subject: string
	text: string
	html?: string
}

export async function sendEmail(params: SendEmailParams) {
	const { sendGridApiKey } = getSettings()
	if (!sendGridApiKey) return severLog(`Cannot send email because no SendGrid API Key setting has been specified`)

	const content = [{ type: 'text/plain', value: params.text }]
	if (params.html) content.push({ type: 'text/html', value: params.html })

	const body = {
		personalizations: [{ to: [{ email: params.to }] }],
		from: { email: params.from },
		subject: params.subject,
		content,
	}

	const headers = new Headers({ Authorization: `Bearer $${sendGridApiKey}` })

	await fetch('https://api.sendgrid.com/v3/mail/send', {
		method: 'POST',
		body: JSON.stringify(body),
		headers,
	}).then(async res => {
		if (!res.ok) severLog(`Failed to send an email.  Received response status ${res.status}.  Body: ${await res.text()}`)
	})
}
