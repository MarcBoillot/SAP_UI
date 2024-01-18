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
                .attachMatched(this.onRouteMatch, this)

        },

        onRouteMatch: async function () {
            const order = await Models.Orders().top(5).get()
            this._setModel(order.value, "ordersModel")
            console.log(this._getModel("ordersModel").getData());         // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },

        onCollapseAll: function(){
            let oTreeTable = Models.Orders().top(2).get()
            this._setModel(oTreeTable.value,"ordersModel");
            oTreeTable.collapseAll();
        },

        onCollapseSelection: function() {
            let oTreeTable = Models.Orders().top(2).get()
            this._setModel(oTreeTable.value,"ordersModel");
            oTreeTable.collapse(oTreeTable.getSelectedIndices());
        },

        onExpandFirstLevel: function() {
            let oTreeTable = Models.Items().top(2).get()
            this._setModel(oTreeTable.value,"itemsModel");
            oTreeTable.expandToLevel(1);
        },

        onExpandSelection: function() {
            let oTreeTable = Models.Orders().top(2).get()
            this._setModel(oTreeTable.value,"ordersModel");
            oTreeTable.expand(oTreeTable.getSelectedIndices());
        },


    });
});