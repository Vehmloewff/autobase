import { FS_ROOT } from '../server/globals.ts'

export interface Settings {
	rootPassword: string
	publishedUrl: string
	bypassPassword: string | null
	sendEmailWebhook: string | null
	sendEmailWebhookPassword: string | null
}

const stashedSettings = await inferSettings()

export async function setSettings(settings: Partial<Settings>) {
	Object.assign(stashedSettings, settings)
	await saveSettings()
}

export function getSettings() {
	return stashedSettings
}

async function getSavedSettings() {
	try {
		return JSON.parse(await Deno.readTextFile(`${FS_ROOT}/settings.json`))
	} catch (_) {
		return null
	}
}

async function saveSettings() {
	await Deno.writeTextFile(`${FS_ROOT}/settings.json`, JSON.stringify(stashedSettings))
}

async function inferSettings(): Promise<Settings> {
	const savedSettings = await getSavedSettings()
	if (savedSettings) return savedSettings

	return {
		publishedUrl: 'http://localhost:3000',
		rootPassword: crypto.randomUUID().replaceAll('-', '').slice(10),
		bypassPassword: null,
		sendEmailWebhook: null,
		sendEmailWebhookPassword: null,
	}
}
