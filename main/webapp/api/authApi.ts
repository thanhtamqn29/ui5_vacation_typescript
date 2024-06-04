import { facilities } from "./config";

export const authApi = {

	getIASAttributes: async (data: any) => {
		return await facilities.post("public/checkingIASId", data);
	},

	login: async (username: string, password: string) => {
		return await facilities.post("public/login", { username, password });
	},

	getCurrentUser : async (token: string) => {
		return await facilities.get("auth/Users", {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
	}
};
