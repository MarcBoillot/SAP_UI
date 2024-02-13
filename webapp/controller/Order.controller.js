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
            const order = await Models.Orders().filter("DocumentStatus eq 'bost_Open'").top(5).get();
            const order2 = await Models.Orders().top(5).get()
            const item = await Models.Items().top(10).get()
            const BusinessPartners = await Models.BusinessPartners().top(10).get()

            this._setModel(order.value, "ordersModel")
            this._setModel(item.value, "itemsModel")
            this._setModel(BusinessPartners.value, "BusinessPartnersModel")

            console.log("top 10 items : ", this._getModel("itemsModel").getData());
            console.log("top 5 orders : ", this._getModel("ordersModel").getData());
            console.log("top 10 clients : ", this._getModel("BusinessPartnersModel").getData());

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

        // ecoute de l'event sur le button pour savoir quel orderModel je recupere
        onExpandSelection: function (oEvent) {
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            console.log("selectedRow", selectedRow)
            let that = this
            // ensuite je charge le fragment pour afficher la vue des elements que contient l'order selected
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
                    name: "wwl.view.AddItemToOrder",
                    controller: this
                }).then(function (oNewItems) {

                    that.oView.addDependent(oNewItems);
                    oNewItems.attachAfterClose(() => oNewItems.destroy())
                    oNewItems.getEndButton(function () {
                        oNewItems.close()
                    });


                    oNewItems.setModel(new JSONModel({}), "selectedItemModel2")
                    // that._setModel({
                    //     selectedRow: selectedRow,
                    // },"fragmentCreateModel");
                    oNewItems.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oNewItems.setModel(new JSONModel({}), "selectedItemModel2")
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
                DocumentLines: [{ItemCode: "", Quantity: 1}]
            }).then(function () {
                console.log("POST successful");
            }).catch(function (error) {
                console.error("POST failed", error);
            });
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

        onSelectChange: function (event) {
            const selectedItem = event.getSource().getSelectedItem().getBindingContext("itemsModel").getObject()
            this._getModel("selectedItemModel2").getData().ItemCode = selectedItem.ItemCode
        },

        onPostItem: function (event) {
            const dialog = event.getSource().getParent()
            const selectedItem = dialog.getModel("selectedItemModel2").getData()
            const idOrder = this._getModel("fragmentModel").getData().selectedRow.DocEntry
            console.log("fragmentmodel : ", idOrder)
            console.log("selectedItem dans le onPostItem ::", selectedItem)


            const dataToPatch = {
                DocumentLines: [
                    {
                        Quantity: selectedItem.Quantity,
                        ItemCode: selectedItem.ItemCode,
                    }
                ]
            }

            // j'utilise la methode patch
            Models.Orders().patch(dataToPatch, idOrder).then(function () {
                console.log("Item added to order successfully");
            }).catch(function (error) {
                console.error("Failed to add item to order", error);
            });
           dialog.close()

        },

        onOpenDialogDelete: function () {
            let that = this
            if (!this._byId("deleteItem")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.ValidationDelete",
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

        onDeleteItem: function (oEvent) {
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            console.log("selectedRow", selectedRow)
            let that = this

            console.log("selected row : ", selectedRow);


        }

    })
});