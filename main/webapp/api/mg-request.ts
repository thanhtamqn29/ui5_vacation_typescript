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
		});
	},

	getUsers: async (token: string) => {
		return await facilities.get("manage/MngUsers", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},

	getDepartment: async (token: string) => {
		return await facilities.get("manage/MngDepartments", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},

	getNullDepartmentUser: async (token: string) => {
		return await facilities.get("manage/getNoDepartmentUser()", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},

	inviteMembers: async (ids: any, token: string) => {
		return await facilities.post("manage/invite", ids, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},
};

export default requestApi;
