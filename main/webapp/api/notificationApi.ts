import { facilities } from "./config"

export const notificationApi = {
    getNotificationsEpl :  async (token: string) => {
        return await facilities.get("request/EplNotifications", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    },
    getNotificationsMng :  async (token: string) => {
        return await facilities.get("manage/MngNotifications", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    }
}