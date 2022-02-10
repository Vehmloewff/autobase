import { registerModel } from '../mod.ts'

export interface Notebook {
	id: '123423'
	name: string
	ownerUserId: string
	notes: string[]
	settings: {
		public: boolean
		access: boolean[]
	}
}

export const Notebook = await registerModel<Notebook>('Notebook', { index: 'id' })

export interface UserInfo {
	id: string
	email: string
	username: string | null
	firstName: string | null
	lastName: string | null
	notebooks: string[]
}

export const UserInfo = await registerModel<UserInfo>('UserInfo', { index: 'id' })
