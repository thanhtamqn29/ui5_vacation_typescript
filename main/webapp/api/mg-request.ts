import { facilities } from "./config";

const requestApi = {
    getRequests: async (token: string) => {
		return await facilities.get("manage/MngRequests", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},

    updateRequest: async (id: any, updatedData: object, token: string) => {
		return await facilities.patch(`manage/MngRequests/${id}`, updatedData, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
	},
}

export default requestApi;