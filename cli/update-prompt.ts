import { version } from './utils/urls.ts'
import { getLatestVersion } from './install.ts'
import { colors } from './deps.ts'

export async function updatePrompt() {
	if (!version) return

	const latestVersion = await getLatestVersion()
	if (latestVersion === version) return

	console.log(
		`
 =================================================================
||                                                               ||
||                                                               ||
||    There is an updated version of autobase available.  Run    ||
||                                                               ||
||                        autobase update                        ||
||                                                               ||
||                 to install the latest version.                ||
||                                                               ||
||                                                               ||
 =================================================================

 ${colors.red(version || '1.1.1')} -> ${colors.bold(colors.green(latestVersion))}
	`.replace('autobase update', colors.cyan('autobase update'))
	)
}
