import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import Dialog from "sap/m/Dialog";
import { requestApi } from "myapp/api/epl-requestApi";
import { notificationApi } from "myapp/api/notificationApi";
import Menu from "sap/m/Menu";
import Event from "sap/ui/base/Event";
import { authApi } from "myapp/api/authApi";
import { isLoading } from "myapp/utils/busyIndicator";

const loadingDialog = new isLoading();
export default class Main extends BaseController {
	public async onInit(): Promise<void> {
		const oViewModel = new JSONModel({
			value: [],
			newRequest: {},
			currentRequest: {},
			notifications: [],
			totalNotifications: "0",
		});
		this.getView().setModel(oViewModel, "view");
		void (await this.loadRequests());
		void (await this.loadNotifications());
	}

	private async loadNotifications(): Promise<void> {
		try {
			loadingDialog.show();

			const { data, status } = await notificationApi.getNotificationsEpl(
				localStorage.getItem("accessToken")
			);
			if (status !== 200) throw new Error("Failed to create leave request");

			const oModel = this.getView().getModel("view") as JSONModel;
			oModel.setProperty("/notifications", data.value);
			oModel.setProperty("/totalNotifications", data.value.length);
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
	private async loadRequests(): Promise<void> {
		try {
			loadingDialog.show();

			const token = localStorage.getItem("accessToken");
			const { data } = await requestApi.getRequests(token);

			if (!data.value) throw new Error("Failed to fetch leave requests");

			const oModel = this.getView().getModel("view") as JSONModel;
			oModel.setProperty("/value", data.value);
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
			loadingDialog.show();

			const response = await requestApi.createRequest(newRequest, token);

			if (response.status !== 201) {
				throw new Error("Failed to create leave request");
			}

			const data = response.data;

			const requests = oModel.getProperty("/value");
			requests.push(data);

			oModel.setProperty("/value", requests);

			MessageBox.success("Leave request created successfully!", {
				onClose: () => loadingDialog.hide(),
			});

			const oDialog = this.byId("createRequestDialog") as Dialog;
			if (oDialog) {
				oDialog.close();
			}

			oModel.setProperty("/newRequest", {});
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
						loadingDialog.show();

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

						MessageBox.success("Leave request deleted successfully!", {
							onClose: () => loadingDialog.hide(),
						});
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
			loadingDialog.show();

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

			MessageBox.success("Leave request updated successfully!", {
				onClose: () => loadingDialog.hide(),
			});

			const oDialog = this.byId("updateRequestDialog") as Dialog;
			if (oDialog) {
				oDialog.close();
			}
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

	private formatDate(date: string): string {
		const dateObj = new Date(date);
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, "0");
		const day = String(dateObj.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	private async onNotificationPress(): Promise<void> {
		const popover = this.byId("notificationPopover");
		if (popover) {
			const popoverDomRef = popover.getDomRef();
			if (
				popoverDomRef.style.display === "none" ||
				popoverDomRef.style.display === ""
			) {
				popoverDomRef.style.display = "block";
				void (await this.loadNotifications());
			} else {
				popoverDomRef.style.display = "none";
			}
		} else {
			console.error("Popover not found");
		}
	}

	public onProfilePress(oEvent: Event): void {
		const menu = this.byId("profile-menu") as Menu;
		menu.openBy(oEvent.getSource(), true);
	}

	public async onLogout(): Promise<void> {
		await authApi.logout(localStorage.getItem("accessToken"));

		window.location.href = window.location.origin + "/logout.do";
	}
}
