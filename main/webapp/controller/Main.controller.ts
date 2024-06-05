import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import Dialog from "sap/m/Dialog";
import { requestApi } from "myapp/api/epl-requestApi";

export default class Main extends BaseController {
	public onInit(): void {
		const oViewModel = new JSONModel({
			value: [],
			newRequest: {},
			currentRequest: {},
		});
		this.getView().setModel(oViewModel, "view");
		void this.loadRequests();
	}

	private async loadRequests(): Promise<void> {
		try {
			const token = localStorage.getItem("accessToken");
			const { data } = await requestApi.getRequests(token);

			if (!data.value) throw new Error("Failed to fetch leave requests");

			const oModel = this.getView().getModel("view") as JSONModel;
			oModel.setProperty("/value", data.value);
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
		}
	}

	public onCreateRequestPress(): void {
		const oDialog = this.byId("createRequestDialog") as Dialog;
		if (oDialog) {
			oDialog.open();
		}
	}

	public onCancelCreateRequest(): void {
		const oDialog = this.byId("createRequestDialog") as Dialog;
		if (oDialog) {
			oDialog.close();
		}
	}

	public async onCreateRequest(): Promise<void> {
		const oModel = this.getView().getModel("view") as JSONModel;
		const token = localStorage.getItem("accessToken");

		const newRequest = oModel.getProperty("/newRequest");

		// Convert dates to the required format
		newRequest.startDay = this.formatDate(newRequest.startDay);
		if (newRequest.endDay) {
			newRequest.endDay = this.formatDate(newRequest.endDay);
		}

		try {
			const response = await requestApi.createRequest(newRequest, token);

			if (response.status !== 201) {
				throw new Error("Failed to create leave request");
			}

			const data = response.data;

			const requests = oModel.getProperty("/value");
			requests.push(data);

			oModel.setProperty("/value", requests);

			MessageBox.success("Leave request created successfully!");

			const oDialog = this.byId("createRequestDialog") as Dialog;
			if (oDialog) {
				oDialog.close();
			}

			oModel.setProperty("/newRequest", {});
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
		}
	}

	public onDeleteRequest(oEvent: any): void {
		const oItem = oEvent
			.getSource()
			.getParent()
			.getBindingContext("view")
			.getObject();
		const oModel = this.getView().getModel("view") as JSONModel;

		MessageBox.confirm("Are you sure you want to delete this leave request?", {
			actions: [MessageBox.Action.YES, MessageBox.Action.NO],
			onClose: async (sAction: any) => {
				if (sAction === MessageBox.Action.YES) {
					try {
						const response = await requestApi.removeRequest(
							oItem.ID,
							{ status: "removed" },
							localStorage.getItem("accessToken")
						);

						if (response.status !== 200) {
							throw new Error("Failed to delete leave request");
						}

						const requests = oModel
							.getProperty("/value")
							.filter((request: any) => request.ID !== oItem.ID);
						oModel.setProperty("/value", requests);

						MessageBox.success("Leave request deleted successfully!");
					} catch (error) {
						MessageBox.error(
							error.response.data?.error?.message ||
								"An error occurred while creating the leave request."
						);
					}
				}
			},
		});
	}

	public onEditRequest(oEvent: any): void {
		const oItem = oEvent
			.getSource()
			.getParent()
			.getBindingContext("view")
			.getObject();
		const oModel = this.getView().getModel("view") as JSONModel;

		oModel.setProperty("/currentRequest", { ...oItem });

		const oDialog = this.byId("updateRequestDialog") as Dialog;
		if (oDialog) {
			oDialog.open();
		}
	}

	public onCancelUpdateRequest(): void {
		const oDialog = this.byId("updateRequestDialog") as Dialog;
		if (oDialog) {
			oDialog.close();
		}
	}

	public async onUpdateRequest(): Promise<void> {
		const oModel = this.getView().getModel("view") as JSONModel;
		const currentRequest = oModel.getProperty("/currentRequest");
		delete currentRequest["@odata.context"];

		if (currentRequest.dayOffType === "FULL_DAY") {
			const clearData: { [key: string]: null } = {
				endDay: null,
				shift: null,
				isOutOfDay: null,
			};
			Object.keys(clearData).forEach((key: string) => {
				currentRequest[key] = clearData[key];
			});
		}

		if (currentRequest.dayOffType === "HALF_DAY") {
			const clearData: { [key: string]: null } = {
				endDay: null,
				isOutOfDay: null,
			};
			Object.keys(clearData).forEach((key: string) => {
				currentRequest[key] = clearData[key];
			});
		}
		if (currentRequest.dayOffType === "PERIOD_TIME") {
			const clearData: { [key: string]: null } = {
				isOutOfDay: null,
				shift: null,
			};
			Object.keys(clearData).forEach((key: string) => {
				currentRequest[key] = clearData[key];
			});
		}
		currentRequest.startDay = this.formatDate(currentRequest.startDay);
		if (currentRequest.endDay) {
			currentRequest.endDay = this.formatDate(currentRequest.endDay);
		}

		try {
			const response = await requestApi.updateRequest(
				currentRequest.ID,
				currentRequest,
				localStorage.getItem("accessToken")
			);

			if (response.status !== 200) {
				throw new Error("Failed to update leave request");
			}

			const updatedData = response.data;

			const requests = oModel.getProperty("/value").map((request: any) => {
				if (request.ID === updatedData.ID) {
					return updatedData;
				}
				return request;
			});

			oModel.setProperty("/value", requests);

			MessageBox.success("Leave request updated successfully!");

			const oDialog = this.byId("updateRequestDialog") as Dialog;
			if (oDialog) {
				oDialog.close();
			}
		} catch (error) {
			const errorMessage =
				(error as Error).message ||
				"An error occurred while updating the leave request.";
			MessageBox.error(errorMessage);
		}
	}

	private formatDate(date: string): string {
		const dateObj = new Date(date);
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, "0");
		const day = String(dateObj.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}
}
