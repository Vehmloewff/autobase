// IMPORTS_HERE

import { Context, Connection, SingularConnection, PluralConnection } from '../../mod.ts'

export type MethodDef = RequestMethodDef | ConnectionMethodDef

export interface RequestMethodDef {
	name: string
	type: 'conventional'
	requiresParams: boolean
	fn(context: Context, params?: unknown): Promise<unknown> | unknown
}

export interface ConnectionMethodDef {
	name: string
	type: 'connection'
	fn(
		connection: Connection
		// really wish we didn't have to set these to any, but setting them to unknown throws an error
		// deno-lint-ignore no-explicit-any
	): SingularConnection<any> | PluralConnection<any> | Promise<SingularConnection<any>> | Promise<PluralConnection<any>>
}

export interface ControllerDef {
	name: string
	methods: Record<string, MethodDef>
}

export const controllers: Record<string, ControllerDef> = {
	// INSERT_START
	controllerName: {
		name: 'controllerName',
		methods: {
			methodName: {
				name: 'methodName',
				type: 'conventional',
				requiresParams: false,
				async fn(context: Context) {
					return await context.getUser()
				},
			},
			$methodName: {
				name: '$methodName',
				type: 'connection',
				fn() {
					// just so that we don't have to import Model for this mock
					// deno-lint-ignore no-explicit-any
					return { connectionType: 'plural', model: {} as any }
				},
			},
		},
	},
	// INSERT_END
}
