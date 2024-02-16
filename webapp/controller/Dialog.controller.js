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

    return BaseController.extend("wwl.controller.Dialog", {
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

            const item = await Models.Items().top(10).get()
            const BusinessPartners = await Models.BusinessPartners().top(10).get()
            await this.getOrders()

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

        getOrders: async function () {
            const order = await Models.Orders().filter("DocumentStatus eq 'bost_Open'").orderby("DocNum").top(15).get();
            this._setModel(order.value, "ordersModel")
        },

        onCancel: function () {
            sap.ui.getCore().byId("AddItemToOrder").close()
        },

        onCancelDeleteItem: function () {
            sap.ui.getCore().byId("deleteItem").close()
        },

        onMasterView: function () {
            this.getOwnerComponent().getRouter().navTo('Master')
        },

        // ecoute de l'event sur le button pour savoir quel orderModel je recupere
        onExpandSelection: function (oEvent) {
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            const docNum = selectedRow.DocNum
            const docEntry = selectedRow.DocEntry
            console.log("docNum : ",docNum)
            console.log("docEntry : ", docEntry)
            console.log("selectedRow", selectedRow)
            let that = this
            // ensuite je charge le fragment pour afficher la vue des elements que contient l'order selected
            if (!this._byId("itemsDialog")) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.Items",
                    controller: this
                }).then(function (oDialogItem) {
                    that.oView.addDependent(oDialogItem);
                    oDialogItem.attachAfterClose(() => oDialogItem.destroy())
                    oDialogItem.getEndButton().attachPress(() => {
                        oDialogItem.close()
                    })

                    // je set le selectedRow pour pouvoir mettre a jour le model ordersModel et defini un nom de model pour pouvoir l'appeler dans la vue
                    that._setModel({
                        selectedRow: selectedRow,
                        DocNum: docNum,
                        DocEntry: docEntry
                    }, "fragmentModel");

                    oDialogItem.open();

                    const table = that._byId("table")
                    console.log("id table", table)
                });
            } else {
                this._oDialogDetail.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        onOpenDialogAddItem: function (oEvent) {
            let that = this
            if (!this._byId("AddItemToOrder")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.AddItemToOrder",
                    controller: this
                }).then(function (oDialog) {

                    that.oView.addDependent(oDialog);
                    oDialog.attachAfterClose(() => oDialog.destroy())
                    oDialog.getEndButton(function () {
                        oDialog.close()
                    });

                    oDialog.setModel(new JSONModel({}), "selectedItemModel2")
                    // that._setModel({
                    //     selectedRow: selectedRow,
                    // },"fragmentCreateModel");
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oNewItems.setModel(new JSONModel({}), "selectedItemModel2")
                    oDialog.open();
                })
            }
        },

        onAddItemInOrder: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
            console.log(dialog)
            const selectedItem = dialog.getModel("selectedItemModel2").getData();
            const idOrder = this._getModel("fragmentModel").getData().selectedRow.DocEntry;
            const documentLines = this._getModel("fragmentModel").getData().selectedRow.DocumentLines;

            if (Array.isArray(documentLines)) {
                const lineNumArray = documentLines.map(docLine => docLine.LineNum);
                const highestLineNum = Math.max(...lineNumArray);

                console.log("fragmentModel : ", idOrder);
                console.log("selectedItem dans le onPostItem ::", selectedItem);
                console.log("LineNum Array:", lineNumArray);
                console.log("Highest LineNum:", highestLineNum);

                const dataToPatch = {
                    DocumentLines: [
                        {
                            LineNum: highestLineNum + 1,
                            Quantity: selectedItem.Quantity,
                            ItemCode: selectedItem.ItemCode,
                        }
                    ]
                };

                Models.Orders().patch(dataToPatch, idOrder).then(function () {
                    console.log("Item added to order successfully");
                }).catch(function (error) {
                    console.error("Failed to add item to order", error);
                });

                await that.getOrders();
                dialog.close();
            } else {
                console.error("DocumentLines is not an array");
            }
        },


        handleClose: function () {
            this._byId("AddItemToOrder").close();
        },

        onOpenDialogAddOrder: function () {
            let that = this
            if (!this._byId("createOrderDialog")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.CreateOrder",
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
        },

        onCloseCreateOrder: function () {
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

        onOpenDialogDelete: function (oEvent) {
            let that = this
            if (!this._byId("deleteItem")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.DeleteValidation",
                    controller: this
                }).then(function (oDialog) {

                    that.oView.addDependent(oDialog);
                    oDialog.attachAfterClose(() => oDialog.destroy())
                    oDialog.getEndButton(function () {
                        oDialog.close()
                    });
                    const selectedItem = oEvent.getSource().getBindingContext("fragmentModel").getObject();
                    console.log("selected item : ", selectedItem)
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        onDeleteItem: function (selectedItem) {
            let that = this;
            const idOrder = this._getModel("fragmentModel").getData().selectedRow.DocEntry;
            console.log("id : ", idOrder)
            Models.Orders().delete(selectedItem, idOrder).then(()=>{
                console.log("item deleted with success !!!")
            }).catch((error)=>{
                console.log("une erreur est survenue : ", error)
            });
            console.log("selected Item : ", selectedItem)
        },


    })
});