import { getSettings } from './settings.ts'
import { severLog } from './server-log.ts'

export interface SendEmailParams {
	to: string
	subject: string
	content: string
	contentIsHtml?: boolean
}

export async function sendEmail(params: SendEmailParams) {
	const { sendEmailWebhook, sendEmailWebhookPassword } = getSettings()
	if (!sendEmailWebhook) return severLog(`Cannot send email because no send email webhook has been provided`)

	const headers = new Headers()

	if (sendEmailWebhookPassword) headers.append('Authentication', sendEmailWebhookPassword)
	else severLog('It is unsafe to send emails without authentication because theoretically anyone can impersonate your company')

	const searchParams = new URLSearchParams()

	searchParams.append('to', params.to)
	searchParams.append('subject', params.subject)
	if (params.contentIsHtml) searchParams.append('content-is-html', 'true')

	await fetch(sendEmailWebhook, { body: params.content, headers }).then(async res => {
		if (!res.ok) severLog(`Failed to send an email.  Received response status ${res.status}.  Body: ${await res.text()}`)
	})
}
