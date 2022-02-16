import { connect, generateClientId, controllers } from './glue.generated.ts'

connect({ clientId: generateClientId(), host: 'localhost:8080' })

console.log('add interest')
const unsubscribe = controllers.notebook.$myNotebooks.subscribe($notebooks => {
	console.log('subscription', $notebooks)
})

setTimeout(() => {
	console.log('remove interest')
	unsubscribe()
}, 10000)
