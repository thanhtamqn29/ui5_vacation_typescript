import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { jwtDecode } from "jwt-decode";

export default class Login extends BaseController {
    public onInit(): void {
        const oViewModel = new JSONModel({
            username: "",
            password: ""
        });
        this.getView().setModel(oViewModel, "view");
    }

    public onLoginPress(): void {
        const oView = this.getView();
        const sUsername = (oView.byId("usernameInput") as Input).getValue();
        const sPassword = (oView.byId("passwordInput") as Input).getValue();

        if (this._validateCredentials(sUsername, sPassword)) {
            this._login(sUsername, sPassword);
        } else {
            MessageBox.error("Invalid credentials. Please try again.");
        }
    }

    private _validateCredentials(username: string, password: string): boolean {
        return username.trim() !== "" && password.trim() !== "";
    }

    private async _login(username: string, password: string): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/public/login", {
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
            const tokenPayload = getRoleFromToken(data.value.accessToken); 

            
            MessageBox.success("Login successful!", {
                onClose: () => {
                    if (tokenPayload.role === "manager" && tokenPayload.department_id === 2) {
                        this.getRouter().navTo("hrManager");
                    } else if (tokenPayload.role === "staff") {
                        this.getRouter().navTo("main");
                    } else if (tokenPayload.role === "manager") {
                        this.getRouter().navTo("manager");
                    };
                }
            });

        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred during login.";
            MessageBox.error(errorMessage);
        }
    }

 
}
function getRoleFromToken(token: string): { role: string, department_id: number } | null {
    try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        return {
            role: tokenPayload.role,
            department_id: tokenPayload.department_id
        };
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
}
