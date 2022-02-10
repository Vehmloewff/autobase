import { bypassRoute } from '../router.ts'
import { getSettings, setSettings } from '../../lib/mod.ts'
import { Settings } from '../../mod.ts'

bypassRoute('get /settings', () => {
	return getSettings()
})

bypassRoute('put /settings', async (_, req) => {
	const body = (await req.json()) as Settings

	await setSettings(body)
})
