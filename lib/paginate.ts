/**
 * Get's a certain page in a large
 *
 * The default for itemsPerPage is 50
 */
export function paginate<T>(items: T[], page: number, itemsPerPage = 100): T[] {
	const startIndex = itemsPerPage * page
	const endIndex = itemsPerPage * (page + 1)

	if (startIndex > items.length) return []

	return items.slice(startIndex, endIndex > items.length ? items.length : endIndex)
}
