import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import Dialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import SelectDialog from "sap/m/SelectDialog";
import StandardListItem from "sap/m/StandardListItem";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";

export default class Manager extends BaseController {

    public onInit(): void {
        const oViewModel = new JSONModel({
            value: [],
            department:[]
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
        this.loadRequests();
        this.loadUser();
        this.loadDepartment();
    }

    private async loadRequests(): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/MngRequests");

            if (!response.ok) {
                throw new Error("Failed to fetch leave requests");
            }
            const data = await response.json();
            const oModel = this.getView().getModel("view") as JSONModel;
            oModel.setProperty("/value", data.value);
        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred while fetching leave requests.";
            MessageBox.error(errorMessage);
        }
    }
    private async loadUser(): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/MngUsers");

            if (!response.ok) {
                throw new Error("Failed to fetch leave requests");
            }
            const data = await response.json();
            const oModel = this.getView().getModel("user") as JSONModel;
            oModel.setProperty("/value", data.value);
        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred while fetching leave requests.";
            MessageBox.error(errorMessage);
        }
    }
    private async loadDepartment(): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/MngDepartments");
          
            
            if (!response.ok) {
                throw new Error("Failed to fetch leave requests");
            }
            const data = await response.json();
            console.log(data);
            
            const oModel = this.getView().getModel("view") as JSONModel;
            oModel.setProperty("/department", data.value);
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
                this.loadRequests();
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

    public async onOpenSelectDialog(): Promise<void> {
        const oSelectDialog = this.byId("userSelectDialog") as SelectDialog;
    
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/getNoDepartmentUser()", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch users without a department");
            }
    
            const aUsers = await response.json();     
            const oUserModel = this.getView().getModel("depUser") as JSONModel;
            oUserModel.setProperty("/value", aUsers.value.data);
    
            oSelectDialog.setModel(oUserModel);
            oSelectDialog.bindAggregation("items", {
                path: "depUser>/value",
                template: new StandardListItem({
                    title: "{depUser>ID}",
                    description: "{depUser>username}"
                })
            });
            oSelectDialog.open(""); 
        } catch (error) {
            MessageBox.error(`Error fetching users: ${(error as Error).message}`);
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
            const aUserIds = oSelectedItem.map((item: any) => item.getBindingContext("depUser").getProperty("ID"));
            console.log(aUserIds);
            
            try {
                const response = await fetchWithAuth("http://localhost:4004/manage/invite", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ids: aUserIds }),
                });
                console.log(response);
                
                if (!response.ok) {
                    throw new Error("Failed to add user to the department");
                }
                
                MessageBox.success("User added to the department successfully!");
                await this.loadUser()
            } catch (error) {
                MessageBox.error(`Error adding user to the department: ${(error as Error).message}`);
            }
        }
    }
    
}