sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "wwl/utils/Formatter",
], function (
    BaseController,
    JSONModel,
    MessageBox,
    Formatter,
) {
    "use strict"
    let Models
    let Views

    return BaseController.extend("wwl.controller.Master", {
        Formatter: Formatter,

        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;

            this.getOwnerComponent().getRouter()
                .getRoute("Master")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {
            const order = await Models.Orders().top(5).get()
            this._setModel(order.value, "ordersModel")

            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },
    });
});