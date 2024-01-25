sap.ui.define([
        "./BaseController",
        'sap/ui/model/json/JSONModel',
        "sap/m/MessageBox",
        "wwl/utils/Formatter",
        "sap/m/MessageToast",
        "sap/ui/core/Fragment",

], function (
        BaseController,
        JSONModel,
        MessageBox,
        Formatter,
        MessageToast,
        Fragment

    ){
        "use strict"
        let Models
        let Views

    return BaseController.extend("wwl.controller.Order",{
            Formatter: Formatter,

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
            // let formattedOrders = []
            // order.value.forEach((order => {
            //     formattedOrders.push({
            //         Key: order.DocumentLines,
            //     })
            // }))
            this._setModel(order.value, "ordersModel")
            this._setModel(item.value, "itemsModel")
            console.log(this._getModel("itemsModel").getData());
            console.log(this._getModel("ordersModel").getData());
            // console.log("Orders:", formattedOrders)

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

        onExpandSelection: function (oEvent) {
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            console.log("selectedRow",selectedRow)
            const itemsModelData = this.getView().getModel("ordersModel").getData()
            // selectedRow.expand(selectedRow.getSelectedIndices());
            let that = this
            if (!this._byId("itemsDialog")) {
                this._oDialogDetail = Fragment.load({
                    // id: this.oView.getId(),
                    name: "wwl.view.Items",
                    controller: this
                }).then(function (oItems) {

                    that.oView.addDependent(oItems);
                    oItems.attachAfterClose(() => oItems.destroy())
                    oItems.getEndButton(function (){
                        oItems.close()
                    });
                    that._setModel({
                        selectedRow: selectedRow,
                    }, "fragmentModel");

                    oItems.open();

                    const table = that._byId("table")
                    console.log("id table",table)
                });
            } else {
                this._oDialogDetail.then(function (oDialog){
                    oDialog.open();
                })
            }
        },

        onExpandFirstLevel: function () {
            const oTreeTable = this._byId("table")
            oTreeTable.expandToLevel(1);
        },

        onClose: function() {
            this._byId("itemsDialog").close();
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