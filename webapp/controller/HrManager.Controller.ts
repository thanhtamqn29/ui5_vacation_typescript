import { fetchWithAuth } from "../utils/fetchWithAuth";
import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import ComboBox from "sap/m/ComboBox";
import Item from "sap/ui/core/Item";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import SearchField from "sap/m/SearchField";
import ListBinding from "sap/ui/model/ListBinding";
import DatePicker from "sap/m/DatePicker";
export default class HrManager extends BaseController {
    public onInit(): void {
        const oViewModel = new JSONModel({
            value: [],
            departments: []
        });
        this.getView().setModel(oViewModel, "view");
        this.loadRequests();
        this.loadDepartments();
    }

    private async loadRequests(): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/manageHr/UserRequests");

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

    private async loadDepartments(): Promise<void> {
        try {
            const response = await fetchWithAuth("http://localhost:4004/manage/manageHr/Departments");
    
            if (!response.ok) {
                throw new Error("Failed to fetch departments");
            }
    
            const data = await response.json();
            const oModel = this.getView().getModel("view") as JSONModel;
            oModel.setProperty("/departments", data.value);
    
            const oComboBox = this.getView().byId("searchDepartment") as ComboBox;
            data.value.forEach((dept: any) => {
                oComboBox.addItem(new Item({
                    key: dept.departmentName, 
                    text: dept.departmentName
                }));
            });
        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred while fetching departments.";
            MessageBox.error(errorMessage);
        }
    }
    
    public onSearch(): void {
        const oView = this.getView();
        const oModel = oView.getModel("view") as JSONModel;
        const aFilters: Filter[] = [];
    
        const oSearchName = oView.byId("searchName") as SearchField;
        const oComboBoxDepartment = oView.byId("searchDepartment") as ComboBox;
        const oDatePicker = oView.byId("searchDate") as DatePicker;
        const sName = oSearchName.getValue();
        const sDepartment = oComboBoxDepartment.getSelectedKey();
        const sDate = oDatePicker.getDateValue();
        if (sName) {
            aFilters.push(new Filter("username", FilterOperator.Contains, sName));
        }
        if (sDepartment) {
            aFilters.push(new Filter("departmentName", FilterOperator.Contains, sDepartment)); // Filtering by departmentName
        }
        if (sDate) {
            const formattedDate = this.formatDate(sDate.toISOString());  
            const filterStartDay = new Filter("startDay", FilterOperator.EQ, formattedDate);
            const filterEndDay = new Filter("endDay", FilterOperator.EQ, formattedDate);
            aFilters.push(new Filter({
                filters: [filterStartDay, filterEndDay],
                and: false 
            }));
        }
        const oBinding = oView.byId("leaveRequestsTable").getBinding("items") as ListBinding;
        oBinding.filter(aFilters);
    }

    public onMenuAction(oEvent: any): void {
        const oItem = oEvent.getParameter("item");
        const sItemText = oItem.getText();

        if (sItemText === "Export to Excel") {
            this.exportToExcel();
        } else if (sItemText === "Export as PDF") {
            MessageBox.show("PDF export is not implemented yet.");
        }
    }

    private exportToExcel(): void {
        const sUrl = "http://localhost:4004/manage/manageHr/exportExcel()";
        
        fetchWithAuth(sUrl, {
            method: 'GET'
        })
        .then(response => {
            console.log(response);
            
            if (!response.ok) {
                throw new Error('Failed to export to Excel.');
            }
           
            return response.blob();
        })
        .then(blob => {
        
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Report.xlsx'; 
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => {
            MessageBox.error(error.message || 'An error occurred while exporting to Excel.');
        });
    }
    private formatDate(date: string): string {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
