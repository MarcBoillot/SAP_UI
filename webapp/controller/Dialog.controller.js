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
    let selectedRow

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

        onRouteMatch: async function () {
            let that = this
            await this.getBusinessPartner()
            await this.getOrders()
            await this.getItems()
            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
            console.log(this._getModel("stocksModel").getData())

        },


        openDialog: function (oDialogName) {
            this.oView.addDependent(oDialogName);
            oDialogName.attachAfterClose(() => oDialogName.destroy())
            oDialogName.getEndButton(() => oDialogName.close());
            oDialogName.open();
        },


//-------------------------------------------------MATH IN QUANTITY---------------------------------------------//

        calculateQuantityInStock: function (items) {
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
            // const selectedRowModel = this._getModel("selectedRowModel")
            // const selectedRow = selectedRowModel.getData()
            // console.log("selectedRow ::", selectedRow)
            try {
                const items = await Models.Items().filter("Frozen ne 'tYES' and BarCode ne 'null'").top(15).get();
                const stocks = items.value.map(item => {
                    if (item.ItemWarehouseInfoCollection.length > 0) {
                        return item.ItemWarehouseInfoCollection.reduce((total, warehouse) => total + warehouse.InStock, 0);
                    } else {
                        return 0;
                    }
                });
                this._setModel(stocks, "stocksModel");
            } catch (error) {
                console.error("Error fetching items:", error);
            }
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


        onShowItemsInOrder: async function (oEvent) {
            let that = this
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
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

        onShowItemsInOf: async function (oEvent) {
            let that = this
            selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
            const docNum = selectedRow.DocNum
            const docEntry = selectedRow.DocEntry
            const oDialogName = this._byId("itemsDialog")
            for (const line of selectedRow.DocumentLines) {
                const itemDetails = await Models.Items().id(`'${line.ItemCode}'`).get()
                console.log("itemDetails ::", itemDetails)
                if (itemDetails.ItemWarehouseInfoCollection.length > 0) {
                    line.totalStock = 0
                    itemDetails.ItemWarehouseInfoCollection.forEach(whs => {
                        console.log("whs.InStock ::", whs.InStock)
                        line.totalStock += whs.InStock
                    })
                }
                console.log("line.totalStock ::", line.totalStock)
            }
            console.log("selectedRow ::", selectedRow)
            if (!oDialogName) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.ItemsForOf",
                    controller: this
                }).then(function (oDialog) {
                    // je set le selectedRow pour pouvoir mettre a jour le model ordersModel et defini un nom de model pour pouvoir l'appeler dans la vue
                    that._setModel(selectedRow, "selectedRowModel");
                    oDialog.setModel(new JSONModel({}), "table2")
                    that.openDialog(oDialog)
                });
            } else {
                this._oDialogDetail.then(function (oDialog) {
                    oDialog.open();
                })
            }
            console.log("selectedRow : ", selectedRow)
        },


// ------------------------------------------------ADD AN ITEM IN ORDER------------------------------------------------//

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
                    oDialog.setModel(new JSONModel({}), "newItemModel")
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        onAddItemInOrder: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
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
                    oDialog.setModel(new JSONModel({}), "newItemModel")
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


// ----------------------------------------------------MESSAGE OF QTY------------------------------------------//

        onValidationOF: function () {
            MessageBox.confirm("Voulez-vous clôturer cette OF", {
                actions: ["YES", "NO"],
                onClose: (sAction) => {
                    if (sAction === "YES") {
                        console.log("ok")
                    } else {
                        console.log("no")
                    }
                }
            })
        },

//-------------------------------------------------SCANNER--------------------------------------------------//

        onScan: function (event) {
            let labelBarCode = new sap.m.Label({text: "Entrez un code-bar"})
            let inputBarCode = new sap.m.Input({placeholder: 1645298})
            let labelQty = new sap.m.Label({text: "Entrez une qantité"})
            let inputQty = new sap.m.Input({value: 1})
            let HboxBarCode = new sap.m.HBox({
                items: [labelBarCode, inputBarCode],
                alignItems: "Center",
            })
            let HboxQty = new sap.m.HBox({
                items: [labelQty, inputQty],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin")
            let dialog = new sap.m.Dialog({
                title: "SCANNER",
                content: [HboxBarCode, HboxQty],
                endButton: new sap.m.Button({
                    text: "Valider",
                    press: () => {
                        console.log("valeur inputBarCode : ", inputBarCode.getValue())
                        console.log("valeur inputQty : ", inputQty.getValue())
                        let valueInputBarCode = inputBarCode.getValue()
                        let valueInputQty = inputQty.getValue()
                        this.verificatorExistAndQty(valueInputBarCode, valueInputQty, event);
                        dialog.close()
                    }
                })
            })
            dialog.open()
        },

        verificatorExistAndQty: function (inputBarCode, inputQty, event) {
            // const selectedRow = event.getSource().getParent().getBindingContext("selectedRowModel");
            console.log("selectedRow in verificator : ", selectedRow)
            if (selectedRow) {
                let BarCode = selectedRow.BarCode;
                let Qty = selectedRow.Quantity;

                if (BarCode && Qty) {
                    if (BarCode.includes(inputBarCode)) {
                        let index = BarCode.indexOf(inputBarCode);
                        if (inputQty == Qty[index]) {
                            console.log("OK");
                        } else {
                            console.log("KO");
                            MessageBox.warning("La Quantité ne correspond pas", {
                                actions: ["OK"],
                                onClose: (sAction) => {
                                    if (sAction === "OK") {
                                        console.log("ok");
                                    }
                                }
                            });
                        }
                    } else {
                        MessageBox.error("Aucun code bar correspondant", {
                            actions: ["Fermer"],
                            onClose: (sAction) => {
                                if (sAction === "Fermer") {
                                    console.log("Fermé");
                                }
                            }
                        });
                    }
                } else {
                    console.error("Propriétés BarCode ou Quantity non définies dans l'objet de la commande sélectionnée.");
                }
            } else {
                console.error("Aucun contexte de liaison trouvé pour l'élément parent de l'élément déclencheur de l'événement.");
            }
        }
    })
});