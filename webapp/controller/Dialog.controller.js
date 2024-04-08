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
            // /** Exemple d'une vue SQL **/
            const getRequestForOrders = await Views.getOrdersWithStock()
            const getRequestForItems = await Views.getItems()
            console.log("transferRequest ::", getRequestForOrders)
            console.log("getRequestForItems ::", getRequestForItems)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)

            // await this.getBusinessPartner()
            // await this.getOrders()
            // await this.getStockItems()
            // await this.getItems()
            await this.getOrdersData()
            await this.getItemsData()
            await this.getItemsList()
        },

//********************************************* GET View SQL **************************************************//

        getOrdersData: async function () {
            const orders = await Views.getOrdersWithStock();
            const formatOrders = [];

            Object.values(orders).forEach(order => {
                const formatOrder = {
                    DocDueDate_formatted: order.DocDueDate_formatted,
                    DocEntry: order.DocEntry,
                    CardCode: order.CardCode,
                    CardName: order.CardName,
                    totalPriceInOrder: order.totalPriceInOrder,
                    Address: order.Address
                };
                formatOrders.push(formatOrder);
            });
            this._setModel(formatOrders, "ordersModelSQL");
        },

        getItemsList: async function () {
            const items = await Views.getItems()
            console.log("items dans getItemsList ::", items)
            const formatItems = []
            Object.values(items).forEach(item => {
                const formatItem = {
                    ItemCode: item.ItemCode,
                    ItemName: item.ItemName,
                    CodeBars: item.CodeBars
                };
                formatItems.push(formatItem);
            });
            this._setModel(formatItems, 'itemsListModelSQL')
        },

        getItemsData: async function () {
            const items = await Views.getOrdersWithStock();
            const formatItems = [];

            Object.values(items).forEach(item => {
                item.DocumentLines.forEach(line => {
                    const formatItem = {
                        DocEntry: line.DocEntry,
                        Quantity: line.Quantity,
                        totalPriceByItem: line.totalPriceByItem,
                        Price: line.Price,
                        ItemCode: line.ItemCode,
                        Dscription: line.Dscription,
                        OnHand: line.OnHand,
                        WhsCode: line.WhsCode,
                        WhsName: line.WhsName,
                        totalStock: line.totalStock,
                        CodeBars: line.CodeBars,
                        LineNum: line.LineNum
                    };
                    formatItems.push(formatItem);
                });
            });

            console.log("formatted items :", formatItems);
            return formatItems; //return the formatted items
        },


//-------------------------------------------------OPENDIALOG-------------------------------------------------//

        openDialog: function (oDialogName) {
            this.oView.addDependent(oDialogName);
            oDialogName.attachAfterClose(() => oDialogName.destroy())
            oDialogName.getEndButton(() => oDialogName.close());
            oDialogName.open();
        },

//********************************************* ITEMS IN ORDERS ***************************************************

        onShowItemsInOfSQL: async function (oEvent) {
            let that = this;
            const docEntry =  oEvent.getSource().getBindingContext("ordersModelSQL").getObject().DocEntry;
            const oDialogName = this._byId("itemsDialog");
            console.log("docEntry :: ", docEntry);
            const items = await this.getItemsData();
            const itemsFilteredByDocEntry = items.filter(item => item.DocEntry === docEntry);
            console.log("itemsFilteredByDocEntry :: ", itemsFilteredByDocEntry);

            if (!oDialogName) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.ItemsForOf",
                    controller: this
                }).then(async function (oDialog) {
                    that._setModel({DocEntry: docEntry, DocumentLines: itemsFilteredByDocEntry}, "itemsModelSQL");
                    // Set filtered items model
                    that.openDialog(oDialog);
                });
            }
        },

//******************************************* ADD ITEM IN ORDER ***************************************************

        onOpenDialogAddItemSQL: function () {
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
                    oDialog.setModel(new JSONModel({}), "newItemModelSQL")
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },


        // onOpenDialogAddItemSQL: function () {
        //     let that = this
        //
        //         Fragment.load({
        //             name: "wwl.view.AddItemToOrder",
        //             controller: this
        //         }).then(function (oDialog) {
        //
        //             that.oView.addDependent(oDialog);
        //             oDialog.attachAfterClose(() => oDialog.destroy())
        //             oDialog.getEndButton(async () => {
        //                 oDialog.close()
        //             });
        //             oDialog.setModel(new JSONModel({}), "newItemModel")
        //             oDialog.open();
        //         });
        // },


        onAddItemInOrderSQL: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
            const selectedItem = dialog.getModel("newItemModelSQL").getData();
            const itemsModelSQL = this._getModel("itemsModelSQL")
            const itemsModelData = itemsModelSQL.getData()
            const items = itemsModelData.DocumentLines;
            const idOrder = itemsModelData.DocEntry
            // const idOrder = event.getSource().getParent().getParent().getBindingContext("ordersModelSQL").getObject().DocEntry
            console.log("selectedItem ::", selectedItem)
            console.log("items :: ", items)
            console.log("idOrder :: ", idOrder)
            if (Array.isArray(items)) {
                //pour ajouter et pas ecraser la ligne deja existante
                const lineNumArray = items.map(docLine => docLine.LineNum);
                const highestLineNum = Math.max(...lineNumArray);
                console.log("highest line num :: ", highestLineNum)
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
                await Models.Orders().patch(dataToPatch, idOrder).then(async function () {
                    console.log("PATCH successful");
                }).catch(function (error) {
                    console.error("PATCH failed", error);
                });
                let updatedOrder = await Models.Orders().id(idOrder).get();
                console.log("updatedOrder :: ", updatedOrder)
                this._setModel(updatedOrder, 'selectedRowModelSQL');
                await that.getOrdersData()
                dialog.close();
            } else {
                console.error("DocumentLines is not an array");
            }
        },

//******************************************** SELECT ITEM *****************************************************

        onSelectChangeSQL: function (event) {
            // const selectedItem = event.getSource().getSelectedItem().getBindingContext("itemsListModel").getObject()
            const selectedItem = event.getSource()
            const dialog = event.getSource().getParent().getParent();
            console.log("item selectionné :: ", selectedItem)
            dialog.getModel("newItemModelSQL").getData().ItemCode = selectedItem.getSelectedKey()
            // this._getModel("newItemModel").getData().ItemCode = selectedItem.getSelectedKey()
        },

//****************************************** DELETE ITEM IN ORDER *************************************************

        onOpenDialogDeleteSQL: function (oEvent) {
            let that = this
            const selectedItem = oEvent.getSource().getBindingContext("itemsModelSQL").getObject();
            const ItemCode = selectedItem.ItemCode;
            const ItemDescription = selectedItem.Dscription;
            const LineNum = selectedItem.LineNum
            const Quantity = selectedItem.Quantity
            console.log("selected item :: ", selectedItem)
            Fragment.load({
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
                    LineNum: selectedItem.LineNum + 1,
                    Quantity: selectedItem.Quantity
                }, "selectedItemForDeleteModelSQL");

                oDialog.open();
            });
        },

        onDeleteItemSQL: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();

            const orderModel = this._getModel("selectedItemForDeleteModelSQL")
            const orderModelData = orderModel.getData();
            const LineNumToItemToDelete = orderModelData.LineNum
            const selectedItem = orderModelData.selectedItem;
            const idOrder = orderModelData.selectedItem.DocEntry;

            const allItemsInItemsModel = this._getModel("itemsModelSQL")
            const allItemsInOrderData = allItemsInItemsModel.getData();
            const items = allItemsInOrderData.DocumentLines;

            console.log("id Order :: ", idOrder)
            console.log("all items in order data :: ", allItemsInOrderData)
            console.log("items :: ",items)
            console.log("orders model data ::", orderModelData)
            console.log("LineNum item to delete :: ", LineNumToItemToDelete)
            // filter methode pour tableau
            const filteredItems = items.filter(LineNum => LineNum !== LineNumToItemToDelete);
            // pour valider le changement de collection pour qu'elle soit remplacer par la nouvelle la methode patch doit return B1S-ReplaceCollectionsOnPatch a true
            await Models.Orders().patch({DocumentLines: filteredItems}, idOrder, true)
                .then(() => {
                    console.log("Item deleted successfully!");
                }).catch((error) => {
                    console.error("Error deleting item:", error);
                });
            //ne veut pas mettre a jour le fragment des items obligé de fermer le fragment manuellement et de re-ouvrir
            let updatedOrder = await Models.Orders().id(idOrder).get();
            this._setModel(updatedOrder, 'itemsModelSQL');
            dialog.close()
        },


//-------------------------------------------------MATH IN PRICE---------------------------------------------//

        transformDocumentLines: function (documentLines) {
            documentLines.forEach(item => {
                if (typeof item === 'object') {
                    item.totalPriceForItem = (item.Price * item.Quantity).toFixed(2);
                }
            });
        },

        calculateSumPrices: function (documentLines) {
            const isObject = obj => typeof obj === 'object';
            return documentLines.reduce((total, currentLine) => {
                if (isObject(currentLine)) {
                    const totalPriceForItem = currentLine.Price * currentLine.Quantity;
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
            console.log("item selectionné :: ", selectedItem)
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
            const orders = await Models.Orders().orderby("DocEntry desc").top(20).get();

            orders.value.forEach(order => {
                this.transformDocumentLines(order.DocumentLines);
                order.TotalPrice = this.calculateSumPrices(order.DocumentLines).toFixed(2);
                order.TotalQuantity = this.calculateTotalQuantity(order.DocumentLines);
            });
            this._setModel(orders.value, "ordersModel");
        },

        getStockItems: async function () {
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

        getItems: async function () {
            const items = await Models.Items().filter("Frozen ne 'tYES' and BarCode ne 'null'").get();
            this._setModel(items.value, "itemsModel")
        },
// ------------------------------------------------CLOSE DIALOG------------------------------------------------------ //


        onCancelAddItem: async function () {
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
            console.log("selectedRow ::", selectedRow)
            console.log("oDialogName ::", oDialogName)
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
            let that = this;
            const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject();
            const docEntry = selectedRow.DocEntry;
            const oDialogName = this._byId("itemsDialog");

            for (const line of selectedRow.DocumentLines) {
                const itemDetails = await Models.Items().id(`'${line.ItemCode}'`).get();
                console.log("details item : ", itemDetails);

                if (itemDetails.ItemWarehouseInfoCollection.length > 0) {
                    line.totalStock = 0;
                    const warehouseNames = [];
                    itemDetails.ItemWarehouseInfoCollection.forEach(whs => {
                        console.log("whs.InStock ::", whs.InStock);
                        line.totalStock += whs.InStock;
                        if (whs.InStock > 0) {
                            warehouseNames.push(whs.WarehouseCode);
                        }
                    })
                    line.warehouseNames = warehouseNames.join(", ");
                    console.log("nameOfWHS", line.warehouseNames)
                }
            }
            if (!oDialogName) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.ItemsForOf",
                    controller: this
                }).then(function (oDialog) {
                    that._setModel(selectedRow, "selectedRowModel");
                    oDialog.setModel(new JSONModel({}), "table2");
                    that.openDialog(oDialog);
                });
            } else {
                this._oDialogDetail.then(function (oDialog) {
                    oDialog.open();
                });
            }
        },

        onShowWarehouse: function (oEvent) {
            let that = this;
            const selectedRow = oEvent.getSource().getBindingContext("selectedRowModel").getObject();
            console.log(selectedRow);
            let VBox = new sap.m.VBox().addStyleClass("sapUiSmallMargin");

            selectedRow.DocumentLines.forEach(line => {
                let labelWarehouseName = new sap.m.Label({text: "Magasin"});
                let textName = new sap.m.Text({text: line.warehouseNames});
                let labelWarehouseStock = new sap.m.Label({text: "Quantité"});
                let textQty = new sap.m.Text({text: line.totalStock});

                let HboxName = new sap.m.HBox({
                    items: [labelWarehouseName, textName],
                    alignItems: "Center",
                }).addStyleClass("sapUiSmallMargin");

                let HboxQty = new sap.m.HBox({
                    items: [labelWarehouseStock, textQty],
                    alignItems: "Center",
                }).addStyleClass("sapUiSmallMargin");

                VBox.addItem(HboxName);
                VBox.addItem(HboxQty);
            });

            // Créer le dialog avec le contenu VBox
            let dialog = new sap.m.Dialog({
                title: "WAREHOUSE",
                content: [VBox],
                endButton: new sap.m.Button({
                    text: "Valider",
                    press: () => {
                        dialog.close();
                    }
                })
            });
            dialog.open();
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

//-------------------------------------------------WAREHOUSE--------------------------------------------------//


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
            //const selectedRow = event.getSource().getParent().getBindingContext("selectedRowModel");
            console.log("selectedRow in verificator : ", selectedRow)
            if (selectedRow) {
                let CodeBars = selectedRow.CodeBars;
                let Qty = selectedRow.Quantity;

                if (CodeBars && Qty) {
                    if (CodeBars.includes(inputBarCode)) {
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