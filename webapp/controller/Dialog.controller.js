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


// --------------------------------------------------------------------ROUTEMATCH-------------------------------------------------------------------------------------- //

        onRouteMatch: async function () {

            await this.getBusinessPartner()
            await this.getOrders()
            await this.getItems()


            console.log("top 10 items : ", this._getModel("itemsModel").getData());
            console.log("top 15 orders : ", this._getModel("ordersModel").getData());
            console.log("top 10 clients : ", this._getModel("BusinessPartnersModel").getData());

            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },


// ---------------------------------------------------------------------------MODIFICATION IN CHOICE------------------------------------------------------------------------------- //

        onSelectChange: function (event) {
            const selectedItem = event.getSource().getSelectedItem().getBindingContext("itemsModel").getObject()
            this._getModel("selectedItemModel2").getData().ItemCode = selectedItem.ItemCode
        },

        onSelectChangeBusinessPartner: function (event) {
            const selectedBusinessPartner = event.getSource().getSelectedBusinessPartner().getBindingContext("BusinessPartnersModel").getObject()
            this._getModel("selectedBusinessPartnerModel").getData().CardName = selectedBusinessPartner.CardName
            this._getModel("selectedBusinessPartnerModel").getData().CardCode = selectedBusinessPartner.CardCode
            this._getModel("selectedBusinessPartnerModel").getData().CardType = selectedBusinessPartner.CardType
        },

// ---------------------------------------------------------------------------REFRESH WITH REQUEST------------------------------------------------------------------------------- //

        getBusinessPartner: async function () {
            const BusinessPartners = await Models.BusinessPartners().filter("Frozen ne 'tYES'").top(10).get()
            this._setModel(BusinessPartners.value, "BusinessPartnersModel")
        },

        getOrders: async function () {
            const order = await Models.Orders().filter("DocumentStatus eq 'bost_Open'").orderby("DocNum desc").top(15).get();
            this._setModel(order.value, "ordersModel")
        },


        getItems: async function () {
            const item = await Models.Items().filter("Frozen ne 'tYES'").top(10).get()
            this._setModel(item.value, "itemsModel")
        },

// ----------------------------------------------------------------------------CLOSE DIALOG------------------------------------------------------------------------------ //

        onCancel: async function () {
            sap.ui.getCore().byId("AddItemToOrder").close()
        },

        onCancelDeleteItem: async function () {
            sap.ui.getCore().byId("deleteItem").close()
        },

        handleClose: function () {
            this._byId("AddItemToOrder").close();
        },

        onCloseCreateOrder: async function () {
            this._byId("createOrderDialog").close();
        },

        onMasterView: function () {
            this.getOwnerComponent().getRouter().navTo('Master')
        },


// ------------------------------------------------------------------------------SHOW ITEMS IN ORDER---------------------------------------------------------------------------- //


        onExpandSelection: function (oEvent) {
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            const docNum = selectedRow.DocNum
            const docEntry = selectedRow.DocEntry
            console.log("docNum : ", docNum)
            console.log("docEntry : ", docEntry)
            console.log("selectedRow", selectedRow)
            let that = this

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
                    that._setModel(selectedRow, "fragmentModel");
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


// -------------------------------------------------------------------------ADD AN ITEM IN ORDER--------------------------------------------------------------------------------- //

        onOpenDialogAddItem: function () {
            let that = this
            if (!this._byId("AddItemToOrder")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.AddItemToOrder",
                    controller: this
                }).then(function (oDialog) {

                    that.oView.addDependent(oDialog);
                    oDialog.attachAfterClose(() => oDialog.destroy())
                    oDialog.getEndButton(async () => {
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
                    // oNewItems.setModel(new JSONModel({}), "selectedItemModel2")

                    oDialog.open();
                })
            }
        },

        onAddItemInOrder: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
            console.log(dialog)
            const selectedItem = dialog.getModel("selectedItemModel2").getData();
            const idOrder = this._getModel("fragmentModel").getData().DocEntry;
            const documentLines = this._getModel("fragmentModel").getData().DocumentLines;

            if (Array.isArray(documentLines)) {
                //pour ajouter et pas ecraser la ligne deja existante
                const lineNumArray = documentLines.map(docLine => docLine.LineNum);
                const highestLineNum = Math.max(...lineNumArray);

                console.log("fragmentModel : ", idOrder);
                console.log("selectedItem dans le onPostItem ::", selectedItem);
                console.log("LineNum Array:", lineNumArray);
                console.log("Highest LineNum:", highestLineNum);

                // j'ajoute dans le model a la ligne suivante l'item selected et sa quantity

                const dataToPatch = {
                    DocumentLines: [
                        {
                            LineNum: highestLineNum + 1,
                            Quantity: selectedItem.Quantity,
                            ItemCode: selectedItem.ItemCode,
                        }
                    ]
                };

                //je patch les nouvelles données
                await Models.Orders().patch(dataToPatch, idOrder).then(function () {
                    console.log("PATCH successful");
                }).catch(function (error) {
                    console.error("PATCH failed", error);
                });

                //avant la fermeture du dialog je met a jour le model ne fonctionne pas sur fragment
                let updatedOrder = await Models.Orders().id(idOrder).get();
                this._setModel(updatedOrder, 'fragmentModel');
                dialog.close();
            } else {
                console.error("DocumentLines is not an array");
            }
        },


// ----------------------------------------------------------------------------ADD AN ORDER------------------------------------------------------------------------------ //

        onOpenDialogAddOrder: function () {
            let that = this
            if (!this._byId("createOrderDialog")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.CreateOrder",
                    controller: this

                }).then(function (oDialog) {

                    that.oView.addDependent(oDialog);
                    oDialog.attachAfterClose(() => oDialog.destroy())
                    oDialog.getEndButton(async function () {
                        oDialog.close()
                    });
                    oDialog.setModel(new JSONModel({}), "selectedItemModel2")
                    oDialog.setModel(new JSONModel({}), "selectedBusinessPartnerModel")
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        onCreateNewOrder: async function (event) {
            let that = this
            const dialog = event.getSource().getParent();
            const selectedItem = dialog.getModel("selectedItemModel2").getData();
            const selectedBusinessPartner = dialog.getModel("selectedBusinessPartnerModel").getData();
            let oModel = that.getView().getModel();

            console.log("dialog : ", dialog)
            console.log("selectedItem : ", selectedItem)
            console.log("selectedBusinessPartner : ", selectedBusinessPartner)
            console.log("oModel : ", oModel)

            await Models.Orders().post({
                CardCode: selectedBusinessPartner.CardCode,
                ItemCode: selectedItem.ItemCode,
                DocDueDate: new Date(),
                DocumentLines: [
                    {
                        ItemCode: selectedItem.ItemCode,
                        Quantity: 1
                    }
                ]
            }).then(function () {
                console.log("POST successful");
            }).catch(function (error) {
                console.error("POST failed", error);
            });
            // refresh done
            await that.getOrders();
            dialog.close();
        },


// ---------------------------------------------------------------------------DELETE AN ITEM IN ORDER------------------------------------------------------------------------------- //

        onOpenDialogDelete: function (oEvent) {
            let that = this

            const selectedItem = oEvent.getSource().getBindingContext("fragmentModel").getObject();
            const ItemCode = selectedItem.ItemCode;
            const ItemDescription = selectedItem.ItemDescription;
            const LineNum = selectedItem.LineNum
            const Quantity = selectedItem.Quantity

            console.log("selectedItem : ", selectedItem)
            console.log("Itemcode : ", ItemCode)
            console.log("ItemDescription : ", ItemDescription)
            console.log("LineNum : ", LineNum)
            console.log("Quantity : ", Quantity)

            if (!this._byId("deleteItem")) {
                this._oDialogCreate = Fragment.load({
                    name: "wwl.view.DeleteValidation",
                    controller: this

                }).then(function (oDialog) {

                    that.oView.addDependent(oDialog);
                    oDialog.attachAfterClose(() => oDialog.destroy())
                    oDialog.getEndButton(async function () {
                        oDialog.close()
                    });

                    that._setModel({
                        selectedItem: selectedItem,
                        ItemCode: selectedItem.ItemCode,
                        ItemDescription: selectedItem.ItemDescription,
                        LineNum: selectedItem.LineNum + 1,
                        Quantity: selectedItem.Quantity
                    }, "fragmentModel1");

                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },


        onDeleteItem: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
            const orderModelData = this._getModel("fragmentModel1").getData();
            const selectedItem = orderModelData.selectedItem;
            const idOrder = orderModelData.selectedItem.DocEntry;
            const allItemsInOrder = this._getModel("fragmentModel").getData();
            const items = allItemsInOrder.DocumentLines;
            // filter methode pour tableau
            const updatedItems = items.filter(LineNum => LineNum !== selectedItem);

            console.log("orderModelData", orderModelData)
            console.log("selecteditem", selectedItem)
            console.log("id : ", idOrder)
            console.log("ordersItems selected : ", allItemsInOrder)
            console.log("items : ", items)
            console.log("updatedItems", updatedItems)

            // pour valider le changement de collection pour qu'elle soit remplacer par la nouvelle la methode patch doit return B1S-ReplaceCollectionsOnPatch a true
            await Models.Orders().patch({DocumentLines: updatedItems}, idOrder, true)
                .then(() => {
                    console.log("Item deleted successfully!");
                }).catch((error) => {
                    console.error("Error deleting item:", error);
                });
            //ne veut pas mettre a jour le fragment des items obligé de fermer le fragment manuellement et de re-ouvrir
            let updatedOrder = await Models.Orders().id(idOrder).get();
            this._setModel(updatedOrder, 'fragmentModel');
            dialog.close()
            console.log("selected Item : ", selectedItem);

        },
        // ----------------------------------------------------------------------------------------------------------------------------------------------------------

    })
});