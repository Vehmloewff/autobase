import { bypassRoute } from '../router.ts'
import { clusters } from '../mock/mod.ts'
import { UserError } from '../../lib/mod.ts'

bypassRoute('get /models/:clusterName', ({ clusterName }) => {
	const cluster = clusters[clusterName]
	if (!cluster) throw new UserError('cluster does not exist')

	return cluster.models
})
