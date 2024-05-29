import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default class Login extends BaseController {
    public onInit(): void {
        const oViewModel = new JSONModel({
            username: "",
            password: ""
        });
        this.getView().setModel(oViewModel, "view");
    }

    public async onLoginPress  (): Promise<void> {
        const oView = this.getView();
        const sUsername = (oView.byId("usernameInput") as Input).getValue();
        const sPassword = (oView.byId("passwordInput") as Input).getValue();

        if (this._validateCredentials(sUsername, sPassword)) {
           await this._login(sUsername, sPassword);
        } else {
            MessageBox.error("Invalid credentials. Please try again.");
        }
    }

    private _validateCredentials(username: string, password: string): boolean {
        return username.trim() !== "" && password.trim() !== "";
    }

    private async _login(username: string, password: string): Promise<void> {
        try {
            const response = await fetchWithAuth("https://vacation-srv-mediating-nyala-rd.cfapps.us10-001.hana.ondemand.com/public/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error("Login failed");
            }

            const data = await response.json();
            localStorage.setItem("accessToken", data.value.accessToken);             
            MessageBox.success("Login successful!", {
                onClose: () => {
                    this.getRouter().navTo("hrManager");

                }
            });

        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred during login.";
            MessageBox.error(errorMessage);
        }
    }
}
