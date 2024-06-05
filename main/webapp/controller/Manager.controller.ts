import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import Dialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import requestApi from "myapp/api/mg-request";

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
			const { data, status } = await requestApi.getRequests(
				localStorage.getItem("accessToken")
			);

			if (status !== 200) {
				throw new Error("Failed to fetch leave requests");
			}

			console.log("data", data);

			const oModel = this.getView().getModel("view") as JSONModel;
			oModel.setProperty("/value", data.value);
		} catch (error) {
			const errorMessage =
				(error as Error).message ||
				"An error occurred while fetching leave requests.";
			MessageBox.error(errorMessage);
		}
	}

	public onAccepted(oEvent: any): void {
		const sRequestId = oEvent
			.getSource()
			.getBindingContext("view")
			.getProperty("ID");
		this.openCommentDialog("accepted", sRequestId);
	}

	public onReject(oEvent: any): void {
		const sRequestId = oEvent
			.getSource()
			.getBindingContext("view")
			.getProperty("ID");
		this.openCommentDialog("reject", sRequestId);
	}

	private openCommentDialog(action: string, requestId: string): void {
		const oDialog = this.byId("commentDialog") as Dialog;
		oDialog.data("action", action);
		oDialog.data("requestId", requestId);
		oDialog.open();
	}

	public async  onSubmitComment(): Promise<void> {
		const oDialog = this.byId("commentDialog") as Dialog;
		const sAction = oDialog.data("action") as string;
		const sRequestId = oDialog.data("requestId") as string;
		const sComment = (this.byId("commentTextArea") as TextArea).getValue();
		await this.updateRequestStatus(sRequestId, sAction, sComment);
	}

	public onCancelComment(): void {
		const oDialog = this.byId("commentDialog") as Dialog;
		oDialog.close();
	}

	private async updateRequestStatus(
		requestId: string,
		action: string,
		comment: string
	): Promise<void> {
		try {
			const status = action === "accepted" ? "accepted" : "rejected";
			console.log(status);

			const response = await requestApi.updateRequest(
				requestId,
				{ status: status, comment: comment },
				localStorage.getItem("accessToken")
			);

			if (response.status !== 200) {
				throw new Error(`Failed to ${action} request`);
			}
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
		}
	}
}
