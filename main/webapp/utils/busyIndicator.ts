import BusyDialog from "sap/m/BusyDialog";

export class isLoading {
    private busyDialog: BusyDialog;

    constructor() {
        this.busyDialog = new BusyDialog({
            title: "Please wait",
            text: "Fetching data...",
            showCancelButton: false
        });
    }

    show() {
        this.busyDialog.open();
    }

    hide() {
        this.busyDialog.close();
    }
}