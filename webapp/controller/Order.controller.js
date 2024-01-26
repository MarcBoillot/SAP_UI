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

    return BaseController.extend("wwl.controller.Order", {
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
            const order = await Models.Orders().top(5).get()
            const item = await Models.Items().top(5).get()
            const BusinessPartners = await Models.BusinessPartners().top(5).get()
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

        onMasterView: function () {
            this.getOwnerComponent().getRouter().navTo('Master')
        },

        onExpandSelection: function (oEvent) {
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            console.log("selectedRow", selectedRow)
            let that = this
            if (!this._byId("itemsDialog")) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.Items",
                    controller: this
                }).then(function (oItems) {

                    that.oView.addDependent(oItems);
                    oItems.attachAfterClose(() => oItems.destroy())
                    oItems.getEndButton(function () {
                        oItems.close()
                    });
                    // je set le selectedRow pour pouvoir mettre a jour le model ordersModel et defini un nom de model pour pouvoir l'appeler dans la vue
                    that._setModel({
                        selectedRow: selectedRow,
                    }, "fragmentModel");

                    oItems.open();

                    const table = that._byId("table")
                    console.log("id table", table)
                });
            } else {
                this._oDialogDetail.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        onClose: function () {
            this._byId("itemsDialog").close();
        },

        createItemDialog: function (oEvent) {
            // const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            let that = this
            if (!this._byId("helloPopover")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.CreateItem",
                    controller: this
                }).then(function (oNewItems) {

                    that.oView.addDependent(oNewItems);
                    oNewItems.attachAfterClose(() => oNewItems.destroy())
                    oNewItems.getEndButton(function () {
                        oNewItems.close()
                    });
                    // that._setModel({
                    //     selectedRow: selectedRow,
                    // },"fragmentCreateModel");
                    oNewItems.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        handleClose: function () {
            this._byId("helloPopover").close();
        },

        createOrderDialog: function () {
            let that = this
            if (!this._byId("createOrderDialog")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.CreateOrder",
                    controller: this
                }).then(function (oNewItems) {

                    that.oView.addDependent(oNewItems);
                    oNewItems.attachAfterClose(() => oNewItems.destroy())
                    oNewItems.getEndButton(function () {
                        oNewItems.close()
                    });
                    oNewItems.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        createOrderClose: function () {
            this._byId("createOrderDialog").close();
        },

        onPost: function () {
            // Obtenez le modèle de la vue du fragment
            let oModel = this.getView().getModel();

            // Obtenez les valeurs des champs d'entrée
            // let sIdOrder = oModel.getProperty("/DocEntry");
            let sOrderName = oModel.getProperty("/CardName");
            let sOrderCode = oModel.getProperty("/CardCode");
            // let sDate = oModel.getProperty("/DocDate");
            let sDate = oModel.getProperty("/DocDueDate");

            console.log("sDate ::", new Date(sDate))
            //effectuer la requête POST
            Models.Orders().post({
                // DocEntry: sIdOrder,
                // CardName: sOrderName,
                CardCode: sOrderCode,
                DocDueDate: new Date(),
                DocumentLines:[{ItemCode:"", Quantity:1}]
            }).then(function () {
                console.log("POST successful");
            }).catch(function (error) {
                console.error("POST failed", error);
            });
        },

        onPatchOrder: function (oEvent) {
            let oModel = this.getView().getModel();
            let sItemDescription = oModel.getProperty("/ItemDescription");
            let sPriceAfterVAT = oModel.getProperty("/PriceAfterVAT");
            let sCurrency = oModel.getProperty("/Currency");
            let sQuantity = oModel.getProperty("/Quantity");

            let sDocEntry = oEvent.getSource().getBindingContext("ordersModel").getObject();

            // Recherchez l'order dans le modèle par son DocEntry
            let aOrders = oModel.getProperty("/orders");
            let oOrder = aOrders.find(function (order) {
                return order.DocEntry === sDocEntry;
            });
            if (oOrder) {
                oOrder.Items.push({
                    ItemDescription: sItemDescription,
                    PriceAfterVAT: sPriceAfterVAT,
                    Currency: sCurrency,
                    Quantity: sQuantity
                });

                // Effectuez la requête PATCH pour mettre à jour l'ordre
                Models.Orders().patch(oOrder).then(function () {
                    console.log("PATCH successful");
                }).catch(function (error) {
                    console.error("PATCH failed", error);
                });
            } else {
                console.error("Order not found");
            }
        },
        onPatchItem: function () {

        },


        onDelete: function () {
            close();
        }

    })
});