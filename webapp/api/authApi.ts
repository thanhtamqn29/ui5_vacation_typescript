import { facilities } from "./config";

export const authApi = {
	login: async (username: string, password: string) => {
		return await facilities.post("public/login", { username, password });
	},
};
