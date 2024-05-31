import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import { authApi } from "../api/authApi";

export default class Login extends BaseController {

	public onInit(): void {
		const oViewModel = new JSONModel({
			username: "",
			password: "",
		});
		this.getView().setModel(oViewModel, "view");
	}

	public onLoginPress(): void {
		const oView = this.getView();
		const sUsername = (oView.byId("usernameInput") as Input).getValue();
		const sPassword = (oView.byId("passwordInput") as Input).getValue();

		if (this._validateCredentials(sUsername, sPassword)) {
			void this._login(sUsername, sPassword);
		} else {
			MessageBox.error("Invalid credentials. Please try again.");
		}
	}

	private _validateCredentials(username: string, password: string): boolean {
		return username.trim() !== "" && password.trim() !== "";
	}

	private async _login(username: string, password: string): Promise<void> {
		try {
			const { data } = await authApi.login(username, password);
			console.log(data);

			if (data.value?.code !== 200) {
				throw new Error("Login failed");
			}

			
			localStorage.setItem("accessToken", data.value.accessToken);
			MessageBox.success("Login successful!", {
				onClose: () => {
					this.getRouter().navTo("hrManager");
				},
			});
		} catch (error) {
			const errorMessage =
				(error as Error).message || "An error occurred during login.";
			MessageBox.error(errorMessage);
		}

}
