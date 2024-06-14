import { authApi } from "myapp/api/authApi";
import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import { isLoading } from "myapp/utils/busyIndicator";
import axios from "axios";

const loadingDialog = new isLoading();
export default class Login extends BaseController {
	public async onInit(): Promise<void> {
		const oModel = new JSONModel();
		
		await oModel.loadData("/user-api/currentUser");

		this.getView().setModel(oModel);

		oModel.attachRequestCompleted((oEvent) => {
			if (oEvent.getParameter("success")) {
				oModel.setProperty("/json", oModel.getJSON());
				oModel.setProperty("/status", "Success");
			} else {
				const msg = oEvent.getParameter("errorobject");
				oModel.setProperty(
					"/status",
					msg || "Unknown error retrieving user info"
				);
			}
		});

		try {
			loadingDialog.show();
			const response = await authApi.getIASAttributes({
				data: oModel.getData(),
			});
			const accessToken = response.data.value.accessToken;

			localStorage.setItem("accessToken", accessToken);
			loadingDialog.hide();

			await this.navigation();
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request.",
				{
					onClose: () => loadingDialog.hide(),
				}
			);
		}
	}

	// private async test() {
	// 	try {
	// 		const {data} = await axios.post(
	// 			"https://ap5x0pdek.trial-accounts.ondemand.com/oauth2/token",
	// 			`grant_type=password&client_id=af8dbd38-ee9d-4d94-a167-c9641075211f&client_secret=XEZ5ZCyXlz6=t18AkyupOZcnHydrCd&username=bondshino238@gmail.com&password=Shino238@`,
	// 			{
	// 				headers: {
	// 					"Content-Type": "application/x-www-form-urlencoded",
	// 				},
	// 			}
	// 		);
	// 		console.log(data);

	// 		const accessToken = data.access_token;
	// 		console.log(accessToken);
			
	// 		const getUser = await axios.get(
	// 			"https://ap5x0pdek.trial-accounts.ondemand.com/oauth2/userinfo", {
	// 				headers: {
	// 					Authorization: `Bearer ${accessToken}`,
	// 				}
	// 			}
	// 		)
	// 		console.log(getUser);
			
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// }

	private async navigation() {
		try {
			loadingDialog.show();
			const { data } = await authApi.getCurrentUser(
				localStorage.getItem("accessToken")
			);
			const getInfo = data.value[0];

			if (getInfo.department_id) this.navTo("hrManager");
			else {
				if (getInfo.role === "staff") this.navTo("main");
				if (getInfo.role === "manager") this.navTo("manager");
			}
			loadingDialog.hide();
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request.",
				{
					onClose: () => loadingDialog.hide(),
				}
			);
		}
	}
}
