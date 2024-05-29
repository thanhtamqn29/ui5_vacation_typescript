import axios from "axios";

const url = "https://vacation-srv-mediating-nyala-rd.cfapps.us10-001.hana.ondemand.com"  | proces.env.localPORT

const facilities = {
    get: async (cds: string, srv: string, id?: string, config?: axiosConfig) => {
        return await axios.get(`${url}/${cds}/${srv}/${id}`, config)
    },
    post: async (cds: string, srv: string, id?: string, data:any, config?: axiosConfig) => {
return await axios.post(`${url}/${cds}/${srv}/${id}`, data, config)
    },
    put : async (cds: string, srv: string, id?: string,data:any, config?: axiosConfig) => {
return await axios.put(`${url}/${cds}/${srv}/${id}`, data, config)
    },
    patch: async ( cds: string, srv: string, id?: string, data:any,config?: axiosConfig) => {
return await axios.patch(`${url}/${cds}/${srv}/${id}`, data, config)
    }
}

export default facilities;