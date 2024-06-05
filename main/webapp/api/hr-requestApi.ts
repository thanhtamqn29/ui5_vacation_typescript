import { facilities } from "./config";

export const requestApi = {
	getRequests: async (token: string) => {
		return await facilities.get("manage/manageHr/UserRequests", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},
	getDepartments: async (token: string) => {
		return await facilities.get("manage/manageHr/Departments", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	},
};
