import axios, { AxiosRequestConfig } from "axios";

const url = "https://vacation-srv-bright-numbat-cu.cfapps.us10-001.hana.ondemand.com";

export const facilities = {
	get: async (srv: string, config?: AxiosRequestConfig) => {
		return await axios.get(`${url}/${srv}`, config);
	},
	post: async (srv: string, data?: object, config?: AxiosRequestConfig) => {
		return await axios.post(`${url}/${srv}`, data, config);
	},
	put: async (srv: string, data?: object, config?: AxiosRequestConfig) => {
		return await axios.put(`${url}/${srv}`, data, config);
	},
	patch: async (srv: string, data?: object, config?: AxiosRequestConfig) => {
		return await axios.patch(`${url}/${srv}`, data, config);
	},
	delete: async (srv: string, config?: AxiosRequestConfig) => {
		return await axios.delete(`${url}/${srv}`, config);
	}
	

};
