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
) {
    "use strict"
    let Models
    let Views

    return BaseController.extend("wwl.controller.Crud", {
        Formatter: Formatter,

        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;

            let oModel = new JSONModel({
                ItemDescription: "",
                PriceAfterVAT: "",
                Currency: "",
                Quantity: ""
            });
            this.getView().setModel(oModel);
            this.getOwnerComponent().getRouter()
                .getRoute("OrdersTable")
                .attachMatched(this.onRouteMatch, this)

        },

        onRouteMatch: async function () {
            const order = await Models.Orders().filter("DocumentStatus eq 'bost_Open'").top(5).get();
            const item = await Models.Items().top(10).get()
            const BusinessPartners = await Models.BusinessPartners().top(10).get()

            this._setModel(order.value, "ordersModel")
            this._setModel(item.value, "itemsModel")
            this._setModel(BusinessPartners.value, "BusinessPartnersModel")

            console.log("top 10 items : ", this._getModel("itemsModel").getData());
            console.log("top 5 orders : ", this._getModel("ordersModel").getData());
            console.log("top 10 clients : ", this._getModel("BusinessPartnersModel").getData());

        },


        onSelectChange: function (event) {
            const selectedItem = event.getSource().getSelectedItem().getBindingContext("itemsModel").getObject()
            this._getModel("selectedItemModel2").getData().ItemCode = selectedItem.ItemCode
        },

        onSelectChangeBusinessPartner: function (event) {
            const selectedBusinessPartner = event.getSource().getSelectedItem().getBindingContext("BusinessPartnersModel").getObject()
            this._getModel("selectedItemModel2").getData().CardName = selectedBusinessPartner.CardName
        },

        onPatchOrder: function (oEvent) {
            let that = this
            let oModel = this.getView().getModel();
            let selectedLine = oEvent.getSource().getBindingContext("fragmentModel").getObject();
            console.log("selectedLine", selectedLine);

            if (!this._byId("UpdateItemFragment")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.UpdateItem",
                    controller: this
                }).then(function (oDialog) {

                    that.oView.addDependent(oDialog);
                    oDialog.attachAfterClose(() => oDialog.destroy())
                    oDialog.getEndButton(function () {
                        oDialog.close()
                    });
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
            let aItems = oModel.getProperty("/Items");
            if (aItems) {
                let sItemDescription = oModel.getProperty("/ItemDescription");
                let sPriceAfterVAT = oModel.getProperty("/PriceAfterVAT");
                let sCurrency = oModel.getProperty("/Currency");
                let sQuantity = oModel.getProperty("/Quantity");
                aItems.Items.push({
                    ItemDescription: sItemDescription,
                    PriceAfterVAT: sPriceAfterVAT,
                    Currency: sCurrency,
                    Quantity: sQuantity
                });

                // Effectuez la requête PATCH pour mettre à jour l'ordre
                Models.Orders().patch(aItems).then(function () {
                    console.log("PATCH successful");
                }).catch(function (error) {
                    console.error("PATCH failed", error);
                });
            } else {
                console.error("Item not found");
            }
        },





    });
});