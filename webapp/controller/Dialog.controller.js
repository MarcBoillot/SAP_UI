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

    return BaseController.extend("wwl.controller.Master", {
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
                .getRoute("Master")
                .attachMatched(this.onRouteMatch, this)

        },


// ------------------------------------------------ROUTEMATCH------------------------------------------------ //

        openDialog: function (oDialogName) {
            this.oView.addDependent(oDialogName);
            oDialogName.attachAfterClose(() => oDialogName.destroy())
            oDialogName.getEndButton(() => oDialogName.close());
            oDialogName.open();
        },


        onRouteMatch: async function () {

            await this.getBusinessPartner()
            await this.getOrders()
            await this.getItems()
            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },

        onMasterView: function () {
            this.getOwnerComponent().getRouter().navTo('Master')
            console.log("vous etes sur la master View")
        },

//-------------------------------------------------MATH IN PRICE---------------------------------------------//

        transformDocumentLines: function (documentLines) {
            documentLines.forEach(item => {
                if (typeof item === 'object') {
                    item.totalPriceForItem = (item.PriceAfterVAT * item.Quantity).toFixed(2);
                }
            });
        },

        calculateSumPrices: function (documentLines) {
            const isObject = obj => typeof obj === 'object';
            return documentLines.reduce((total, currentLine) => {
                if (isObject(currentLine)) {
                    const totalPriceForItem = currentLine.PriceAfterVAT * currentLine.Quantity;
                    return total + totalPriceForItem;
                }
                return total;
            }, 0);
        },

        calculateTotalQuantity: function (documentLines) {
            const isObject = obj => typeof obj === 'object';
            return documentLines.reduce((total, currentLine) => isObject(currentLine) ? total + currentLine.Quantity : total, 0);
        },

// -------------------------------------------MODIFICATION IN SELECT------------------------------------------------- //

        onSelectChange: function (event) {
            const selectedItem = event.getSource().getSelectedItem().getBindingContext("itemsModel").getObject()
            this._getModel("newItemModel").getData().ItemCode = selectedItem.ItemCode
        },

        onSelectChangeBusinessPartner: function (event) {
            const selectedBusinessPartner = event.getSource().getSelectedBusinessPartner().getBindingContext("BusinessPartnersModel").getObject()
            this._getModel("selectedBusinessPartnerModel").getData().CardCode = selectedBusinessPartner.CardCode
        },

// --------------------------------------------------ALL REQUEST IN BDD-------------------------------------------- //

        getBusinessPartner: async function () {
            const BusinessPartners = await Models.BusinessPartners().filter("Frozen ne 'tYES'").top(15).get()
            this._setModel(BusinessPartners.value, "BusinessPartnersModel")
        },

        getOrders: async function () {
            const orders = await Models.Orders().filter("DocumentStatus eq 'bost_Open'").orderby("DocNum desc").top(20).get();

            orders.value.forEach(order => {
                this.transformDocumentLines(order.DocumentLines);
                order.TotalPrice = this.calculateSumPrices(order.DocumentLines).toFixed(2);
                order.TotalQuantity = this.calculateTotalQuantity(order.DocumentLines);
            });

            this._setModel(orders.value, "ordersModel");
        },

        getItems: async function () {
            const item = await Models.Items().filter("Frozen ne 'tYES'").filter("BarCode ne 'null'").top(15).get()
            this._setModel(item.value, "itemsModel")
        },

// ------------------------------------------------CLOSE DIALOG------------------------------------------------------ //


        onCancelAddItem: function () {
            this._byId("AddItemToOrder").close()
        },

        onCancelDeleteItem: function () {
            this._byId("deleteItem").close()
        },

        onCloseCreateOrder: function () {
            this._byId("createOrderDialog").close();
        },

        onCloseItemsDialog: function () {
            this._byId("itemsDialog").close();
        },


// ------------------------------------------------SHOW ITEMS IN ORDER------------------------------------------------ //


        onShowItemsInOrder: function (oEvent) {
            let that = this
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            const docNum = selectedRow.DocNum
            const docEntry = selectedRow.DocEntry
            const oDialogName = this._byId("itemsDialog")
            if (!oDialogName) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.Items",
                    controller: this
                }).then(function (oDialog) {
                    // je set le selectedRow pour pouvoir mettre a jour le model ordersModel et defini un nom de model pour pouvoir l'appeler dans la vue
                    that._setModel(selectedRow, "selectedRowModel");
                    oDialog.setModel(new JSONModel({}), "table")
                    that.openDialog(oDialog)
                });
            } else {
                this._oDialogDetail.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },


// ------------------------------------------------ADD AN ITEM IN ORDER------------------------------------------------//


        onOpenDialogAddItem: function () {
            Fragment.load({
                name: "wwl.view.AddItemToOrder",
                controller: this
            }).then((oDialog) => {
                oDialog._setModel({}, "newItemModel")
                this.openDialog(oDialog);
            })
        },

        onAddItemInOrder: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
            console.log("dialog ::", dialog)
            const selectedItem = dialog.getModel("newItemModel").getData();
            console.log("selectedItem ::", selectedItem)
            const idOrder = this._getModel("selectedRowModel").getData().DocEntry;
            const documentLines = this._getModel("selectedRowModel").getData().DocumentLines;

            if (Array.isArray(documentLines)) {
                //pour ajouter et pas ecraser la ligne deja existante
                const lineNumArray = documentLines.map(docLine => docLine.LineNum);
                const highestLineNum = Math.max(...lineNumArray);
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
                let updatedOrder = await Models.Orders().id(idOrder).get();
                this._setModel(updatedOrder, 'selectedRowModel');
                await that.getOrders()
                dialog.close();
            } else {
                console.error("DocumentLines is not an array");
            }
        },


// ------------------------------------------------ADD AN ORDER------------------------------------------------//

        onOpenDialogAddOrder: function () {
            Fragment.load({
                name: "wwl.view.CreateOrder",
                controller: this,
            }).then(function (oDialog) {
                this.openDialog(oDialog)
                oDialog._setModel({}, "newItemModel")
                oDialog._setModel({}, "selectedBusinessPartnerModel")
            });
        },

        onCreateNewOrder: async function (event) {
            let that = this
            const dialog = event.getSource().getParent();
            const selectedItem = dialog.getModel("newItemModel").getData();
            const selectedBusinessPartner = dialog.getModel("selectedBusinessPartnerModel").getData();
            let oModel = that.getView().getModel();
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


// ------------------------------------------------DELETE AN ITEM IN ORDER------------------------------------------------ //

        onOpenDialogDelete: function (oEvent) {
            let that = this
            const selectedItem = oEvent.getSource().getBindingContext("selectedRowModel").getObject();
            const ItemCode = selectedItem.ItemCode;
            const ItemDescription = selectedItem.ItemDescription;
            const LineNum = selectedItem.LineNum
            const Quantity = selectedItem.Quantity
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
                    that._setModel({
                        selectedItem: selectedItem,
                        ItemCode: selectedItem.ItemCode,
                        ItemDescription: selectedItem.ItemDescription,
                        LineNum: selectedItem.LineNum + 1,
                        Quantity: selectedItem.Quantity
                    }, "selectedItemForDeleteModel");

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
            const orderModelData = this._getModel("selectedItemForDeleteModel").getData();
            const selectedItem = orderModelData.selectedItem;
            const idOrder = orderModelData.selectedItem.DocEntry;
            const allItemsInOrder = this._getModel("selectedRowModel").getData();
            const items = allItemsInOrder.DocumentLines;
            // filter methode pour tableau
            const updatedItems = items.filter(LineNum => LineNum !== selectedItem);
            // pour valider le changement de collection pour qu'elle soit remplacer par la nouvelle la methode patch doit return B1S-ReplaceCollectionsOnPatch a true
            await Models.Orders().patch({DocumentLines: updatedItems}, idOrder, true)
                .then(() => {
                    console.log("Item deleted successfully!");
                }).catch((error) => {
                    console.error("Error deleting item:", error);
                });
            //ne veut pas mettre a jour le fragment des items obligé de fermer le fragment manuellement et de re-ouvrir
            let updatedOrder = await Models.Orders().id(idOrder).get();
            this._setModel(updatedOrder, 'selectedRowModel');
            dialog.close()
        },
// ----------------------------------------------------CLOSE AN ORDER------------------------------------------//
        onClosingOrder: function () {
            let input = new sap.m.Input({})
            let label = new sap.m.Label({text: "test"})
            let Hbox = new sap.m.HBox({items: [label, input]})
            let dialog = new sap.m.Dialog({
                title: "dialog",
                content: [Hbox],
                beginButton: new sap.m.Button({
                    press: () => {
                        console.log(input.getValue())
                        dialog.close()
                    }
                })
            })

            dialog.open()

            MessageBox.confirm("êtes-vous sûr de?", {
                actions: ["OUI", "NON", "PEUT-ETRE"],
                onClose: (sAction) => {
                    if (sAction === "OUI") {
                        console.log("oui")
                    } else {
                        console.log("non")
                    }
                }
            })
        }

    })
});