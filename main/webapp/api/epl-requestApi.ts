import { facilities } from "./config";

export const requestApi = {
	getRequests: async (token: string) => {
		return await facilities.get("request/EplRequests", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},
	createRequest: async (request: any, token: string) => {
		return await facilities.post("request/EplRequests", request, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},
	updateRequest: async (id: any, updatedData: object, token: string) => {
		return await facilities.put(`request/EplRequests/${id}`, updatedData, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
	},
	removeRequest: async (id: any, status: object, token: string) => {
		return await facilities.patch(`request/EplRequests/${id}`, status, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},
};
