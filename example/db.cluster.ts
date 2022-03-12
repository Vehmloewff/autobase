import { registerModel } from '../mod.ts'

export type Permissions = 'view' | 'edit' | 'write'

export type Settings = {
	public: boolean
	access: boolean[]
	permissions: Permissions
}

export interface Notebook {
	id: string
	name: string
	ownerUserId: string
	notes: string[]
	settings: Settings
}

export const Notebook = await registerModel<Notebook>('Notebook', { index: 'id' })

export interface UserInfo {
	id: string
	email: string
	username: string | null
	firstName: string | null
	lastName: string | null
	notebooks: string[]
	avatar: Uint8Array
}

export const UserInfo = await registerModel<UserInfo>('UserInfo', { index: 'id' })
