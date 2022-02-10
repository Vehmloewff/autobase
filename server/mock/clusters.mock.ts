export interface Cluster {
	name: string
	models: string[]
}

export const clusters: Record<string, Cluster> = {
	// INSERT_START
	clusterName: {
		name: 'clusterName',
		models: ['Model1', 'Model2'],
	},
	// INSERT_END
}
