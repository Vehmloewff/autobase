import { bypassRoute } from '../router.ts'
import { clusters } from '../mock/mod.ts'

bypassRoute('get /clusters', () => {
	return Object.keys(clusters)
})
