import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import Dialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import requestApi from "myapp/api/mg-request";
import { notificationApi } from "myapp/api/notificationApi";
import { fetchWithAuth } from "myapp/utils/fetchWithAuth";
import StandardListItem from "sap/m/StandardListItem";
import Filter from "sap/ui/model/Filter";
import SelectDialog from "sap/m/SelectDialog";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";

export default class Manager extends BaseController {
	public onInit(): void {
		const oViewModel = new JSONModel({
			value: [],
			notifications: [],
			totalNotifications: "0",
			department: [],
		});
		this.getView().setModel(oViewModel, "view");
		const oUserModel = new JSONModel({
			value: [],
		});
		this.getView().setModel(oUserModel, "user");

		const oDepUserModel = new JSONModel({
			value: [],
		});
		this.getView().setModel(oDepUserModel, "depUser");

		void this.loadUser();
		void this.loadDepartment();
		void this.loadRequests();
		void this.loadNotifications();
	}
	private async loadUser(): Promise<void> {
		try {
			const { data, status } = await requestApi.getUsers(
				localStorage.getItem("accessToken")
			);

			if (status !== 200) {
				throw new Error("Failed to fetch leave requests");
			}
			const oModel = this.getView().getModel("user") as JSONModel;
			oModel.setProperty("/value", data.value);
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
		}
	}
	private async loadDepartment(): Promise<void> {
		try {
			const { data, status } = await requestApi.getDepartment(
				localStorage.getItem("accessToken")
			);

			if (status !== 200) {
				throw new Error("Failed to fetch leave requests");
			}

			const oModel = this.getView().getModel("view") as JSONModel;
			oModel.setProperty("/department", data.value);
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
		}
	}
	private async loadNotifications(): Promise<void> {
		const { data, status } = await notificationApi.getNotificationsMng(
			localStorage.getItem("accessToken")
		);
		if (status !== 200) throw new Error("Failed to create leave request");

		console.log(data);

		const oModel = this.getView().getModel("view") as JSONModel;
		oModel.setProperty("/notifications", data.value);
		oModel.setProperty("/totalNotifications", data.value.length);
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
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
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

	public async onSubmitComment(): Promise<void> {
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
			MessageBox.success(`Request has ben ${action} successfully`);

			const oDialog = this.byId("commentDialog") as Dialog;
			oDialog.close();
			void this.loadRequests();
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
			const oDialog = this.byId("commentDialog") as Dialog;
			oDialog.close();
			void this.loadRequests();
		}
	}
	public async onNotificationPress(): Promise<void> {
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

	public async onOpenSelectDialog(): Promise<void> {
		const oSelectDialog = this.byId("userSelectDialog") as SelectDialog;

		try {
			const { data, status } = await requestApi.getNullDepartmentUser(
				localStorage.getItem("accessToken")
			);

			if (status !== 200) throw new Error("Failed to create leave request");

			const oUserModel = this.getView().getModel("depUser") as JSONModel;
			oUserModel.setProperty("/value", data.value.data);

			oSelectDialog.setModel(oUserModel);
			oSelectDialog.bindAggregation("items", {
				path: "depUser>/value",
				template: new StandardListItem({
					title: "{depUser>ID}",
					description: "{depUser>fullName}",
				}),
			});
			oSelectDialog.open("");
		} catch (error) {
			MessageBox.error(
				error.response.data?.error?.message ||
					"An error occurred while creating the leave request."
			);
		}
	}

	public onSearchUser(oEvent: any): void {
		const sValue = oEvent.getParameter("value");
		const oFilter = new Filter("username", FilterOperator.Contains, sValue);
		const oBinding = oEvent.getSource().getBinding("items") as ListBinding;
		oBinding.filter([oFilter]);
	}

	public async onAddUser(oEvent: any): Promise<void> {
		const oSelectedItem = oEvent.getParameters("selectedItem").selectedItems;

		if (oSelectedItem && oSelectedItem.length > 0) {
			const aUserIds = oSelectedItem.map((item: any) =>
				item.getBindingContext("depUser").getProperty("ID")
			);

			try {
				const { status } = await requestApi.inviteMembers(
					{ ids: aUserIds },
					localStorage.getItem("accessToken")
				);

				if (status !== 200) throw new Error("Failed to create leave request");
				MessageBox.success("User added to the department successfully!");
				await this.loadUser();
			} catch (error) {
				MessageBox.error(
					error.response.data?.error?.message ||
						"An error occurred while creating the leave request."
				);
			}
		}
	}
}
