/* eslint-disable @typescript-eslint/no-unsafe-call */
import BaseController from "./BaseController";
/**
 * @namespace myapp.controller
 */
export default class App extends BaseController {
	public onInit(): void {
		this.getView().addStyleClass(
			this.getOwnerComponent().getContentDensityClass()
		)
	}

}
