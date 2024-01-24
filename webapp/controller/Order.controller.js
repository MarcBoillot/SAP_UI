sap.ui.define([
        "./BaseController",
        'sap/ui/model/json/JSONModel',
        "sap/m/MessageBox"

], function (
        BaseController,
        JSONModel,
        MessageBox,
    ){
        "use strict"
        let Models
        let Views

    return BaseController.extend("wwl.controller.Order",{
            // Formatter: Formatter,

            onInit: function () {
                Models = this.getOwnerComponent().ConfModel;
                Views = this.getOwnerComponent().ViewsModel;
                this.getOwnerComponent().getRouter()
                    .getRoute("OrdersTable")
                    .attachMatched(this.onRouteMatch, this)

            },

        onRouteMatch: async function () {
            const order = await Models.Orders().top(5).get()
            const item = await Models.Items().top(5).get()
            this._setModel(order.value, "ordersModel")
            this._setModel(item.value, "itemsModel")
            console.log(this._getModel("itemsModel").getData());
            console.log(this._getModel("ordersModel").getData());

            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },
        onMasterView: function (){
            this.getOwnerComponent().getRouter().navTo('Master')
        },
        onGet: async function (){
            this._getModel(this._getModel( "itemsModel").getData());
        },

        onPost: function(){
            Models.Orders().post({})
        },

        onPut: function(){
            put()
        },

        onDelete: function (){
            // delete ();
        }

    })
});