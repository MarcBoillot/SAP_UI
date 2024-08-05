sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "wwl/utils/Formatter"
], function (BaseController, JSONModel, Fragment,Formatter) {
    "use strict";
    let Models
    let Views

    return BaseController.extend("wwl.controller.ControlPreparationList", {
        Formatter: Formatter,

        onInit: async function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ControlPreparationListPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch:async function(){
            const orders = await Models.Orders().filter("DocumentStatus ne 'bost_Close' and U_OB1ETATPREP eq 'P'").orderby('DocDueDate desc').get();
            this._setModel(orders.value,"OrdersModelSL");
            console.log("orders ::",orders.value)
        },

        onPressMasterPage: function (){
            this.getOwnerComponent().getRouter().navTo("Master");
        },

        onPressSortByMat: async function(){
            const listOfMatOrder = await Models.Orders().filter(`DocumentStatus ne 'bost_Close' and U_OB1TYPCDE eq '2'`).get();
            this._setModel(listOfMatOrder.value, "OrdersModelSL");
            this._getModel("OrdersModelSL").refresh(true);
            console.log(listOfMatOrder)
            return listOfMatOrder
        },

        onPressSortByAccess:async function(event){
            const listOfAccessOrder = await Models.Orders().filter(`DocumentStatus ne 'bost_Close' and U_OB1TYPCDE eq '1'`).get();
            this._setModel(listOfAccessOrder.value, "OrdersModelSL");
            this._getModel("OrdersModelSL").refresh(true);
            console.log(listOfAccessOrder)
            return listOfAccessOrder
        },

        onPressShowItemsInOfSL:async function (event) {
            const OrdersModelSL = await this._getModel("OrdersModelSL")
            const selectedOrder = event.getSource().getBindingContext("OrdersModelSL").getObject()
            const DocEntry = selectedOrder.DocEntry
            console.log("DocEntry of selected Order ::",DocEntry)
            this.getOwnerComponent().getRouter().navTo("PreparationItemsViewPage", {
                DocEntry: DocEntry
            });
        },

    });
});
