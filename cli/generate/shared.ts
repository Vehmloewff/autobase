import { getUrls } from '../utils/urls.ts'

export interface IndentOptions {
	depth?: number
	preventFirstTab?: boolean
}

export function indent(text: string, options: IndentOptions = {}): string {
	const firstTab = options.preventFirstTab ? '' : '\t'

	const result = `${firstTab}${text.replaceAll('\n', '\n\t')}`

	const depth = options.depth ?? 1

	if (depth < 0) return ''
	if (depth === 0) return text
	if (depth === 1) return result

	return indent(result, { preventFirstTab: options.preventFirstTab, depth: depth - 1 })
}

export interface InsertInTemplateParams {
	body: string
	imports?: string
}

export async function insertInTemplate(templateUrl: string, { body, imports }: InsertInTemplateParams) {
	const template = await fetch(templateUrl)
		.then(res => res.text())
		.then(code => code.replace('../../mod.ts', getUrls().lib))

	const START_TAG = '\t// INSERT_START'
	const END_TAG = '\t// INSERT_END'
	const IMPORTS_TAG = '// IMPORTS_HERE'

	const startIndex = template.indexOf(START_TAG)
	const endIndex = template.indexOf(END_TAG) + END_TAG.length

	const templateWithInsert = `${template.slice(0, startIndex)}${body}${template.slice(endIndex, template.length)}`

	if (imports) return templateWithInsert.replace(IMPORTS_TAG, imports)

	return templateWithInsert
}
