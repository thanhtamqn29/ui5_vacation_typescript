import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import Dialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import Log from "sap/base/Log";

export default class Manager extends BaseController {

    public onInit(): void {
        const oViewModel = new JSONModel({
            value: [],
        });
        this.getView().setModel(oViewModel, "view");
        void this.loadRequests();
    }

    private async loadRequests(): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/MngRequests");

            if (!response.ok) {
                throw new Error("Failed to fetch leave requests");
            }

            const data = await response.json();
            console.log("data", data);

            const oModel = this.getView().getModel("view") as JSONModel;
            oModel.setProperty("/value", data.value);
        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred while fetching leave requests.";
            MessageBox.error(errorMessage);
        }
    }

    public onAccepted(oEvent:any): void {
        const sRequestId = oEvent.getSource().getBindingContext("view").getProperty("ID");
        this.openCommentDialog("accepted", sRequestId);
    }

    public onReject(oEvent: any): void {
        const sRequestId = oEvent.getSource().getBindingContext("view").getProperty("ID");
        this.openCommentDialog("reject", sRequestId);
    }

    private openCommentDialog(action: string, requestId: string): void {
        const oDialog = this.byId("commentDialog") as Dialog;
        oDialog.data("action", action);
        oDialog.data("requestId", requestId);
        oDialog.open();
    }

    public onSubmitComment(): void {
        const oDialog = this.byId("commentDialog") as Dialog;
        const sAction = oDialog.data("action") as string;
        const sRequestId = oDialog.data("requestId") as string;
        const sComment = (this.byId("commentTextArea") as TextArea).getValue();
        this.updateRequestStatus(sRequestId, sAction, sComment)
            .then(() => {
                MessageBox.success(`Request has been ${sAction} successfully.`);
                oDialog.close();
                void this.loadRequests();
            })
            .catch((error) => {
                MessageBox.error(`Failed to ${sAction} request: ${(error as Error).message}`);
            });
    }

    public onCancelComment(): void {
        const oDialog = this.byId("commentDialog") as Dialog;
        oDialog.close();
    }

    private async updateRequestStatus(requestId: string, action: string, comment: string): Promise<void> {
        try {
            const status = action === "accepted" ? "accepted" : "rejected";
            console.log(status);
            
            const response = await fetchWithAuth(`http://localhost:4004/manage/MngRequests(${requestId})`, {
                method: "PATCH", 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: status,
                    comment: comment,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} request`);
            }
        } catch (error) {
            throw error;
        }
    }
}