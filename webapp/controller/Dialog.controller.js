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
            const getRequestForBusinessPartners = await Models.BusinessPartners().filter("Frozen ne 'tYES'").top(15).get();
            const getRequestForDeliveryNotes = await Models.DeliveryNotes().orderby('DocDate desc').top(20).get();
            this._setModel(getRequestForOrders, "ordersModelSQL");
            this._setModel(getRequestForBusinessPartners.value, "BusinessPartnersModelSL");
            this._setModel(getRequestForDeliveryNotes.value, "DeleveryNotesClosedModelSL");


            // console.log("serialnumber ::",getRequestForSerialNumber.d.results)
            console.log("orders ::", getRequestForOrders)
            console.log("Business Partners :: ", getRequestForBusinessPartners)
            console.log("Bon de Livraison :: ", getRequestForDeliveryNotes.value)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },

// --------------------------------------------------ALL REQUEST IN BDD-------------------------------------------- //

        // getBusinessPartner: async function () {
        //     const BusinessPartners = await Models.BusinessPartners().filter("Frozen ne 'tYES'").top(15).get()
        //     this._setModel(BusinessPartners.value, "BusinessPartnersModel")
        // },

        // getOrders: async function () {
        //     const orders = await Models.Orders().orderby("DocEntry desc").top(20).get();
        //
        //     orders.value.forEach(order => {
        //         this.transformDocumentLines(order.DocumentLines);
        //         order.TotalPrice = this.calculateSumPrices(order.DocumentLines).toFixed(2);
        //         order.TotalQuantity = this.calculateTotalQuantity(order.DocumentLines);
        //     });
        //     this._setModel(orders.value, "ordersModel");
        // },

        // getItems: async function () {
        //     const items = await Models.Items().filter("Frozen ne 'tYES' and BarCode ne 'null'").get();
        //     this._setModel(items.value, "itemsModel")
        // },

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
            const getRequestForItems = await Models.Items().filter("Frozen ne 'tYES' and BarCode ne 'null'").select("ItemCode, ItemName, BarCode, ManageSerialNumbers, ManageBatchNumbers").get()
            this._setModel(getRequestForItems.value, "itemsModelSQL");
            console.log("items ::", getRequestForItems.value)

            const ordersModelObject = oEvent.getSource().getBindingContext("ordersModelSQL").getObject();
            const docEntry = ordersModelObject.DocEntry;
            const documentLinesObject = ordersModelObject.DocumentLines;
            const oDialogName = this._byId("itemsDialog");
            const items = documentLinesObject;
            const itemsFilteredByDocEntry = items.filter(item => item.DocEntry === docEntry);
            if (!oDialogName) {
                this._oDialogDetail = Fragment.load({
                    name: "wwl.view.ItemsForOf",
                    controller: this
                }).then(async function (oDialog) {
                    that._setModel({
                        DocEntry: docEntry,
                        DocumentLines: itemsFilteredByDocEntry,
                    }, "selectedRowModelSQL");

                    // Set filtered items model
                    that.openDialog(oDialog);
                });
            }
            const getRequestForOrders = await Views.getOrdersWithStock();
            this._setModel(getRequestForOrders, "ordersModelSQL");

        },

//***************************************** SHOW THE BL CLOSED **********************************************

        onShowDetailsOfOrdersClosed: function (oEvent) {
            const selectedOrder = oEvent.getSource().getBindingContext("DeleveryNotesClosedModelSL").getObject();
            const documentLines = selectedOrder.DocumentLines;
            console.log(documentLines);

            let oTable = new sap.m.Table({
                mode: sap.m.ListMode.None,
                columns: [
                    new sap.m.Column({header: new sap.m.Text({text: "Article"})}),
                    new sap.m.Column({header: new sap.m.Text({text: "Code Barre"})}),
                    new sap.m.Column({header: new sap.m.Text({text: "N° Série"})}),
                    new sap.m.Column({header: new sap.m.Text({text: "Quantité"})}),
                    new sap.m.Column({header: new sap.m.Text({text: "Prix"})})
                ]
            });

            documentLines.forEach(line => {
                let oColumnListItem = new sap.m.ColumnListItem();
                // let serialNumber = Views.getView("GetSerialNumber_Parameters(itemCode='line.ItemCode')/Results").d.results
                oColumnListItem.addCell(new sap.m.Text({text: line.ItemCode}));
                oColumnListItem.addCell(new sap.m.Text({text: line.BarCode}));
                oColumnListItem.addCell(new sap.m.Text({text: line.SerialNumbers}));
                oColumnListItem.addCell(new sap.m.Text({text: line.Quantity}));
                oColumnListItem.addCell(new sap.m.Text({text: line.PriceAfterVAT + " €"}));

                // let statusText = line.LineStatus === 'bost_Close' ? "Delivered" : line.LineStatus === 'bost_Open' ? "Delivery" : "Warning";
                // let lineStatusText = new sap.m.Text({ text: statusText });
                //
                // if (line.LineStatus === 'bost_Close') {
                //     lineStatusText.addStyleClass("sapUiSuccess");
                // } else {
                //     lineStatusText.addStyleClass('sapUiWarning');
                // }
                // oColumnListItem.addCell(lineStatusText);
                oTable.addItem(oColumnListItem);
            });

            let dialog = new sap.m.Dialog({
                title: "BL détails",
                content: [oTable],
                contentWidth: "900px",
                endButton: new sap.m.Button({
                    text: "Fermer",
                    press: () => {
                        dialog.close();
                    }
                })
            });
            dialog.open();
        },


//****************************************** SHOW WHAREHOUSE ************************************************

        onShowWarehouse: function (oEvent) {
            let that = this;
            const selectedItem = oEvent.getSource().getBindingContext("selectedRowModelSQL").getObject();
            let VBox = new sap.m.VBox().addStyleClass("sapUiSmallMargin");

            selectedItem.stockPerWhs.forEach((line, index) => {
                let labelWarehouseCode = new sap.m.Label({text: "Code du Magasin : "}).addStyleClass("textMargin");
                let textCode = new sap.m.Text({text: line.WhsCode});
                let labelWarehouseName = new sap.m.Label({text: "Nom du Magasin : "}).addStyleClass("textMargin");
                let textName = new sap.m.Text({text: line.WhsName});
                let labelWarehouseOnHand = new sap.m.Label({text: "Quantité en magasin : "}).addStyleClass("textMargin");
                let textOnHand = new sap.m.Text({text: line.OnHand});


                let HboxName = new sap.m.HBox({
                    items: [labelWarehouseName, textName],
                    alignItems: "Center",
                }).addStyleClass("sapUiSmallMargin");

                let HboxCode = new sap.m.HBox({
                    items: [labelWarehouseCode, textCode],
                    alignItems: "Center",
                }).addStyleClass("sapUiSmallMargin");

                let HboxOnHand = new sap.m.HBox({
                    items: [labelWarehouseOnHand, textOnHand],
                    alignItems: "Center",
                }).addStyleClass("sapUiSmallMargin");

                VBox.addItem(HboxName);
                VBox.addItem(HboxCode);
                VBox.addItem(HboxOnHand);

                if (index < selectedItem.stockPerWhs.length - 1) {
                    let separator = new sap.ui.core.HTML({content: "<hr>", preferDOM: false});
                    VBox.addItem(separator);
                }
            });
            let dialog = new sap.m.Dialog({
                title: "WAREHOUSE",
                content: [VBox],
                endButton: new sap.m.Button({
                    text: "Fermer",
                    press: () => {
                        dialog.close();
                    }
                })
            });
            dialog.open();
        }
        ,


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
                    oDialog.setModel(new JSONModel({isSelected: false, mngSerialNumber: false}), "newItemModelSQL")
                    oDialog.open();
                });
            } else {
                this._oDialogCreate.then(function (oDialog) {
                    oDialog.open();
                })
            }
        },

        onAddItemInOrderSQL: async function (event) {
            let that = this;
            const dialog = event.getSource().getParent();
            const itemsModelSQL = this._getModel("selectedRowModelSQL")
            const selectedItem = dialog.getModel("newItemModelSQL").getData();
            const itemsModelData = itemsModelSQL.getData()
            const items = itemsModelData.DocumentLines;
            const idOrder = dialog.getModel("selectedRowModelSQL").getData().DocEntry
            console.log("item document lines :: ", items)
            //pour ajouter et pas ecraser la ligne deja existante
            const lineNumArray = items.map(docLine => docLine.LineNum);
            const highestLineNum = Math.max(...lineNumArray);
            console.log("highest line num :: ", highestLineNum)
            // j'ajoute dans le model a la ligne suivante l'item selected et sa quantity

            if (selectedItem.ManageSerialNumbers === 'tYES') {
                const dataToPatch = {
                    DocumentLines: [
                        {
                            LineNum: highestLineNum + 1,
                            Quantity: selectedItem.Quantity,
                            ItemCode: selectedItem.ItemCode,
                            SerialNumber: selectedItem.SerialNumber
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
                dialog.close();
            } else {
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
                dialog.close();
            }


            this._setModel(await Views.getOrdersWithStock(), "ordersModelSQL")
            const updatedOrders = this._getModel("ordersModelSQL").getData()
            const orderUpdated = updatedOrders.find(order => idOrder === order.DocEntry)
            this._setModel(orderUpdated, 'selectedRowModelSQL');
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
                    oDialog.setModel(new JSONModel({}), "newItemModelSQL")
                    oDialog.setModel(new JSONModel({}), "selectedBusinessPartnerModelSL")
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
            const selectedItem = dialog.getModel("newItemModelSQL").getData();
            //a revoir ne fonctionne pas
            console.log("selecteditem.itemcode", selectedItem.ItemCode)
            const selectedBusinessPartner = dialog.getModel("selectedBusinessPartnerModelSL").getData();
            let oModel = that.getView().getModel();
            await Models.Orders().post({
                CardCode: selectedBusinessPartner.CardCode,
                ItemCode: selectedItem.ItemCode,
                DocDueDate: new Date(),
                DocumentLines: [
                    {
                        ItemCode: selectedItem.ItemCode,
                        Quantity: selectedItem.Quantity
                    }
                ]
            }).then(function () {
                console.log("POST successful");
            }).catch(function (error) {
                console.error("POST failed", error);
            });
            // refresh done
            this._setModel(await Views.getOrdersWithStock(), "ordersModelSQL")
            this._getModel("ordersModelSQL").getData()
            dialog.close();
        },

//****************************************** DELETE ITEM IN ORDER *************************************************

        onOpenDialogDeleteSQL: function (oEvent) {
            let that = this
            const selectedItem = oEvent.getSource().getBindingContext("selectedRowModelSQL").getObject();
            const selectedOrder = oEvent.getSource().getBindingContext("selectedRowModelSQL").getModel().getData()
            Fragment.load({
                name: "wwl.view.DeleteValidation",
                controller: this

            }).then(function (oDialog) {
                that.oView.addDependent(oDialog);
                oDialog.attachAfterClose(() => oDialog.destroy())
                oDialog.getEndButton().attachPress(() => oDialog.close())
                oDialog.getBeginButton().attachPress(() => {
                    that.onDeleteItemSQL(selectedOrder, selectedItem.LineNum)
                    oDialog.close()
                })
                oDialog.open()
            })
        },

        onDeleteItemSQL: async function (selectedOrder, lineNumToDelete) {
            const filteredItems = selectedOrder.DocumentLines.filter(item => item.LineNum !== lineNumToDelete);
            const lineNums = filteredItems.map(item => {
                return {LineNum: item.LineNum}
            });
            console.log("keep LineNUm ::", lineNums)
            await Models.Orders().patch({DocumentLines: lineNums}, selectedOrder.DocEntry, true)
                .then(() => {
                    console.log("Item deleted successfully!");
                }).catch((error) => {
                    console.error("Error deleting item:", error);
                });
            this._setModel(await Views.getOrdersWithStock(), "ordersModelSQL")
            const updatedOrders = this._getModel("ordersModelSQL").getData()
            const orderUpdated = updatedOrders.find(order => selectedOrder.DocEntry === order.DocEntry)
            this._setModel(orderUpdated, 'selectedRowModelSQL');
        },

//************************************* MODIFY ITEM IN ORDER *****************************************************

        onDialogModifSQL: function (event) {
            let that = this
            const selectedItem = event.getSource().getBindingContext("selectedRowModelSQL").getObject();
            const selectedOrder = event.getSource().getBindingContext("selectedRowModelSQL").getModel().getData()
            const Quantity = selectedItem.Quantity
            Fragment.load({
                name: "wwl.view.ModifyItems",
                controller: this

            }).then(function (oDialog) {
                that.oView.addDependent(oDialog);
                oDialog.attachAfterClose(() => oDialog.destroy())
                oDialog.getEndButton(function () {
                    oDialog.close()
                });
                that._setModel({
                    Dscription: selectedItem.Dscription,
                    Quantity: selectedItem.Quantity,
                    LineNum: selectedItem.LineNum,
                }, "selectedItemWithQuantity");

                oDialog.open();
            });
        },

        onChangeQuantityOfItem: async function (event) {
            let that = this;
            const selectedItem = event.getSource().getParent().getModel("selectedItemWithQuantity").getData();
            const selectedOrder = event.getSource().getParent().getModel("selectedRowModelSQL").getData()
            const idOrder = selectedOrder.DocEntry
            const dataToPatch = {DocumentLines: selectedItem.Quantity};
            await Models.Orders().patch(dataToPatch, idOrder).then(async function () {
                console.log("PATCH successful");
            }).catch(function (error) {
                console.error("PATCH failed", error);
            });
            await Models.Orders().id(idOrder).get();
            this._setModel(await Views.getOrdersWithStock(), "ordersModelSQL")
            const updatedOrders = this._getModel("ordersModelSQL").getData()
            const orderUpdated = updatedOrders.find(order => idOrder === order.DocEntry)
            this._setModel(orderUpdated, 'selectedRowModelSQL');

        },


//******************************************** SELECT ITEM *****************************************************
        onSelectChangeSQL: async function (event) {
            let that = this;
            const source = event.getSource()
            const dialog = source.getParent().getParent();
            const newItemModel = dialog.getModel("newItemModelSQL")
            const newItem = newItemModel.getData()
            console.log("newItem ::", newItem)
            const itemCode = source.getSelectedKey()
            const itemsList = event.getSource().getModel("itemsModelSQL").getData()
            const selectedItem = itemsList.find(item => item.ItemCode === itemCode)
            newItem.isSelected = true
            newItemModel.refresh(true)

            if (selectedItem.ManageSerialNumbers === 'tYES') {
                newItem.mngSerialNumber = true
                newItemModel.refresh(true)
                newItem.ItemCode = source.getSelectedKey();
                let getRequestForSerialNumber = await Views.getView(`GetSerialNumber_Parameters(itemCode='${newItem.ItemCode}')/Results`)
                this._setModel(getRequestForSerialNumber.d.results, "SerialNumberModelSQL")
                let serialNumber = this._getModel("SerialNumberModelSQL").getData()
                console.log("serialNumber :: ", serialNumber)
            } else {
                console.error("Ce produit n'est géré par numéro de série");
                newItem.mngSerialNumber = false
                newItemModel.refresh(true)
            }
        },

// -------------------------------------------MODIFICATION IN SELECT------------------------------------------------- //

        onSelectChange: function (event) {
            const selectedItem = event.getSource().getSelectedItem().getBindingContext("itemsModel").getObject()
            console.log("item selectionné :: ", selectedItem)
            this._getModel("newItemModel").getData().ItemCode = selectedItem.ItemCode
        },

        onSelectChangeBusinessPartner: function (event) {
            const selectedBusinessPartner = event.getSource().getSelectedBusinessPartner().getBindingContext("BusinessPartnersModelSL").getObject()
            this._getModel("selectedBusinessPartnerModelSL").getData().CardCode = selectedBusinessPartner.CardCode
        },

// ------------------------------------------------CLOSE DIALOG------------------------------------------------------ //


        onCancelAddItem: async function () {
            this._byId("AddItemToOrder").close()
        }
        ,

        onCancelDeleteItem: function () {
            this._byId("deleteItem").close()
        }
        ,

        onCloseCreateOrder: function () {
            this._byId("createOrderDialog").close();
        }
        ,

        onCloseItemsDialog: function () {
            this._byId("itemsDialog").close();
        }
        ,

        onCloseModifyQuantityOfItem: function () {
            this._byId("modifyItem").close()
        }
        ,
        onCloseWhareHouseOfItem: function () {
            this._byId("wharehouse").close()
        },


//************************************************* GENERATE A BL ***********************************************

        onGenerateBl: async function (event) {
            let that = this
            const dialog = event.getSource().getParent();
            const itemsModelSQL = this._getModel("selectedRowModelSQL")
            const itemsModelData = itemsModelSQL.getData()
            const items = itemsModelData.DocumentLines;
            const idOrder = dialog.getModel("selectedRowModelSQL").getData().DocEntry

            const blModelSL = await Models.Orders().id(idOrder).get()
            const CardName = blModelSL.CardName
            const CardCode = blModelSL.CardCode

            const NumBl = blModelSL.DocEntry
            const customerToString = '\'' + CardCode + '\'';

            const blBpModelSL = await Models.BusinessPartners().id(customerToString).get()
            const Address = blModelSL.Address
            //
            // const CardCodeCustomer = blBpModelSL.CardCode
            // const selectedOrder = dialog.getModel("selectedRowModelSQL").getData().DocumentLines;


            let labelCardName = new sap.m.Label({text: "Nom de la société : "}).addStyleClass("sapUiSmallMargin");
            let textCardName = new sap.m.Text({text: CardName});

            let labelCardCode = new sap.m.Label({text: "Code de la Société : "}).addStyleClass("sapUiSmallMargin");
            let textCardCode = new sap.m.Text({text: CardCode});

            let labelAddress = new sap.m.Label({text: "Address Client : "}).addStyleClass("sapUiSmallMargin");
            let textAddress = new sap.m.Text({text: Address});

            let labelNumeroDeBl = new sap.m.Label({text: "Numero de BL : "}).addStyleClass("sapUiSmallMargin");
            let textNumeroDeBl = new sap.m.Text({text: NumBl});

            let HboxCardName = new sap.m.HBox({
                items: [labelCardName, textCardName],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let HboxCardCode = new sap.m.HBox({
                items: [labelCardCode, textCardCode],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let HboxAddress = new sap.m.HBox({
                items: [labelAddress, textAddress],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let HboxNumBl = new sap.m.HBox({
                items: [labelNumeroDeBl, textNumeroDeBl],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let dialogue = new sap.m.Dialog({
                title: "BL",
                content: [HboxCardName, HboxCardCode, HboxAddress, HboxNumBl],
                beginButton: new sap.m.Button({
                    text: "Print",
                    press: () => {
                        dialogue.close()
                        return "";
                    }
                })
            });
            let dataToPost = {
                DocumentLines: []
            }
            items.forEach(line => {
                dataToPost.DocumentLines.push({
                    BaseEntry: line.DocEntry,
                    BaseLine: line.LineNum,
                    BaseType: 17,
                    Quantity: line.Quantity
                });
            });

            console.log("dataToPost :: ", dataToPost)
            await Models.DeliveryNotes().post(dataToPost).then(function () {
                console.log("POST successful");
            }).catch(function (error) {
                console.error("POST failed", error);
            });
            dialogue.open();

            // this._setModel(await Models.getDeliveryNotes(), "DeliveryNotesModelSL")
            // const updatedOrders = this._getModel("DeliveryNotesModelSL").getData()
            // const orderUpdated = updatedOrders.find(order => idOrder === order.DocEntry)
            // this._setModel(orderUpdated, 'DeliveryNotesModelSL');
        },

// ------------------------------------------------SHOW ITEMS IN ORDER------------------------------------------------ //

        // onShowItemsInOrder: async function (oEvent) {
        //     let that = this
        //     const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject()
        //     const oDialogName = this._byId("itemsDialog")
        //     console.log("selectedRow ::", selectedRow)
        //     console.log("oDialogName ::", oDialogName)
        //     if (!oDialogName) {
        //         this._oDialogDetail = Fragment.load({
        //             name: "wwl.view.Items",
        //             controller: this
        //         }).then(function (oDialog) {
        //             // je set le selectedRow pour pouvoir mettre a jour le model ordersModel et defini un nom de model pour pouvoir l'appeler dans la vue
        //             that._setModel(selectedRow, "selectedRowModel");
        //             oDialog.setModel(new JSONModel({}), "table")
        //             that.openDialog(oDialog)
        //         });
        //     } else {
        //         this._oDialogDetail.then(function (oDialog) {
        //             oDialog.open();
        //         })
        //     }
        //
        // }
        // ,
        //
        // onShowItemsInOf: async function (oEvent) {
        //     let that = this;
        //     const selectedRow = oEvent.getSource().getBindingContext("ordersModel").getObject();
        //     const docEntry = selectedRow.DocEntry;
        //     const oDialogName = this._byId("itemsDialog");
        //
        //     for (const line of selectedRow.DocumentLines) {
        //         const itemDetails = await Models.Items().id(`'${line.ItemCode}'`).get();
        //         console.log("details item : ", itemDetails);
        //
        //         if (itemDetails.ItemWarehouseInfoCollection.length > 0) {
        //             line.totalStock = 0;
        //             const warehouseNames = [];
        //             itemDetails.ItemWarehouseInfoCollection.forEach(whs => {
        //                 console.log("whs.InStock ::", whs.InStock);
        //                 line.totalStock += whs.InStock;
        //                 if (whs.InStock > 0) {
        //                     warehouseNames.push(whs.WarehouseCode);
        //                 }
        //             })
        //             line.warehouseNames = warehouseNames.join(", ");
        //             console.log("nameOfWHS", line.warehouseNames)
        //         }
        //     }
        //     if (!oDialogName) {
        //         this._oDialogDetail = Fragment.load({
        //             name: "wwl.view.ItemsForOf",
        //             controller: this
        //         }).then(function (oDialog) {
        //             that._setModel(selectedRow, "selectedRowModel");
        //             oDialog.setModel(new JSONModel({}), "table2");
        //             that.openDialog(oDialog);
        //         });
        //     } else {
        //         this._oDialogDetail.then(function (oDialog) {
        //             oDialog.open();
        //         });
        //     }
        // }
        // ,


// ------------------------------------------------ADD AN ITEM IN ORDER------------------------------------------------//

        // onOpenDialogAddItem: function () {
        //     let that = this
        //     if (!this._byId("AddItemToOrder")) {
        //         this._oDialogCreate = Fragment.load({
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
        //     } else {
        //         this._oDialogCreate.then(function (oDialog) {
        //             oDialog.open();
        //         })
        //     }
        // }
        // ,
        //
        // onAddItemInOrder: async function (event) {
        //     let that = this;
        //     const dialog = event.getSource().getParent();
        //     const selectedItem = dialog.getModel("newItemModel").getData();
        //     console.log("selectedItem ::", selectedItem)
        //     const idOrder = this._getModel("selectedRowModel").getData().DocEntry;
        //     const documentLines = this._getModel("selectedRowModel").getData().DocumentLines;
        //
        //     if (Array.isArray(documentLines)) {
        //         if(selectedItem.SysNumber != null){
        //             const lineNumArray = documentLines.map(docLine => docLine.LineNum);
        //             const highestLineNum = Math.max(...lineNumArray);
        //             const dataToPatch = {
        //                 DocumentLines: [
        //                     {
        //                         LineNum: highestLineNum + 1,
        //                         Quantity: selectedItem.Quantity,
        //                         ItemCode: selectedItem.ItemCode,
        //                         SysNumber: selectedItem.SysNumber
        //                     }
        //                 ]
        //             };
        //         }else{
        //             console.log("il y a pas de numero de serie sur cet article")
        //         }
        //         //pour ajouter et pas ecraser la ligne deja existante
        //         const lineNumArray = documentLines.map(docLine => docLine.LineNum);
        //         const highestLineNum = Math.max(...lineNumArray);
        //         // j'ajoute dans le model a la ligne suivante l'item selected et sa quantity
        //         const dataToPatch = {
        //             DocumentLines: [
        //                 {
        //                     LineNum: highestLineNum + 1,
        //                     Quantity: selectedItem.Quantity,
        //                     ItemCode: selectedItem.ItemCode,
        //                 }
        //             ]
        //         };
        //         //je patch les nouvelles données
        //         await Models.Orders().patch(dataToPatch, idOrder).then(function () {
        //             console.log("PATCH successful");
        //         }).catch(function (error) {
        //             console.error("PATCH failed", error);
        //         });
        //         let updatedOrder = await Models.Orders().id(idOrder).get();
        //         this._setModel(updatedOrder, 'selectedRowModel');
        //         await that.getOrders()
        //         dialog.close();
        //     } else {
        //         console.error("DocumentLines is not an array");
        //     }
        // }
        // ,


// ------------------------------------------------DELETE AN ITEM IN ORDER------------------------------------------------ //

        // onOpenDialogDelete: function (oEvent) {
        //     let that = this
        //     const selectedItem = oEvent.getSource().getBindingContext("selectedRowModel").getObject();
        //     const ItemCode = selectedItem.ItemCode;
        //     const ItemDescription = selectedItem.ItemDescription;
        //     const LineNum = selectedItem.LineNum
        //     const Quantity = selectedItem.Quantity
        //     if (!this._byId("deleteItem")) {
        //         this._oDialogCreate = Fragment.load({
        //             name: "wwl.view.DeleteValidation",
        //             controller: this
        //
        //         }).then(function (oDialog) {
        //
        //             that.oView.addDependent(oDialog);
        //             oDialog.attachAfterClose(() => oDialog.destroy())
        //             oDialog.getEndButton(function () {
        //                 oDialog.close()
        //             });
        //             that._setModel({
        //                 selectedItem: selectedItem,
        //                 ItemCode: selectedItem.ItemCode,
        //                 ItemDescription: selectedItem.ItemDescription,
        //                 LineNum: selectedItem.LineNum + 1,
        //                 Quantity: selectedItem.Quantity
        //             }, "selectedItemForDeleteModel");
        //
        //             oDialog.open();
        //         });
        //     } else {
        //         this._oDialogCreate.then(function (oDialog) {
        //             oDialog.open();
        //         })
        //     }
        // }
        // ,
        // onDeleteItem: async function (event) {
        //     let that = this;
        //     const dialog = event.getSource().getParent();
        //     const orderModelData = this._getModel("selectedItemForDeleteModel").getData();
        //     const selectedItem = orderModelData.selectedItem;
        //     const idOrder = orderModelData.selectedItem.DocEntry;
        //     const allItemsInOrder = this._getModel("selectedRowModel").getData();
        //     const items = allItemsInOrder.DocumentLines;
        //     // filter methode pour tableau
        //     const updatedItems = items.filter(LineNum => LineNum !== selectedItem);
        //     // pour valider le changement de collection pour qu'elle soit remplacer par la nouvelle la methode patch doit return B1S-ReplaceCollectionsOnPatch a true
        //     await Models.Orders().patch({DocumentLines: updatedItems}, idOrder, true)
        //         .then(() => {
        //             console.log("Item deleted successfully!");
        //         }).catch((error) => {
        //             console.error("Error deleting item:", error);
        //         });
        //     //ne veut pas mettre a jour le fragment des items obligé de fermer le fragment manuellement et de re-ouvrir
        //     let updatedOrder = await Models.Orders().id(idOrder).get();
        //     this._setModel(updatedOrder, 'selectedRowModel');
        //     dialog.close()
        // },

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
            const selectedOrder = event.getSource().getParent().getModel("selectedRowModelSQL").getData().DocumentLines;
            let labelBarCode = new sap.m.Label({text: "Entrez un code-bar"}).addStyleClass("sapUiSmallMargin");
            let inputBarCode = new sap.m.Input({placeholder: "Entrez un code-bar"});
            let labelQty = new sap.m.Label({text: "Entrez une quantité"}).addStyleClass("sapUiSmallMargin");
            let inputQty = new sap.m.Input({value: 1});
            let HboxBarCode = new sap.m.HBox({
                items: [labelBarCode, inputBarCode],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");
            let HboxQty = new sap.m.HBox({
                items: [labelQty, inputQty],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");
            let dialog = new sap.m.Dialog({
                title: "SCANNER",
                content: [HboxBarCode, HboxQty],
                beginButton: new sap.m.Button({
                    text: "Valider",
                    press: () => {
                        let valueInputQty = inputQty.getValue();
                        if (isNaN(valueInputQty)) {
                            console.error("Quantité invalide");
                            return;
                        }
                        let valueInputBarCode = inputBarCode.getValue();
                        this.verificatorExistAndQty(valueInputBarCode, valueInputQty, event);
                        dialog.close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Close",
                    press: () => {
                        dialog.close();
                    }
                })
            });
            dialog.open();
        },

        verificatorExistAndQty: async function (inputBarCode, inputQty, event) {
            const selectedRow = event.getSource().getParent().getParent().getModel("selectedRowModelSQL").getData();
            const itemsInOrder = selectedRow.DocumentLines;
            console.log("itemsInOrder :: ", itemsInOrder)
            if (itemsInOrder) {
                const itemTarget = itemsInOrder.find(item => item.CodeBars === inputBarCode);
                if (itemTarget) {
                    const idOrder = selectedRow.DocEntry;
                    let statusItem = selectedRow.DocumentLines;

                    let newStatus = 'C'
                    Models.Orders().patch({DocumentLines: newStatus}, idOrder)
                        .then(() => {
                            console.log("Statut de l'article mis à jour avec succès!");
                        }).catch((error) => {
                        console.error("Erreur lors de la mise à jour du statut de l'article:", error);
                    });
                    let updatedOrder = await Models.Orders().id(idOrder).get();
                    this._setModel(updatedOrder, 'selectedRowModelSQL');
                    console.log("updatedOrder :: ", updatedOrder)

                    if (inputQty === itemTarget.Quantity) {
                        console.log("Item validé");
                        sap.m.MessageBox.success("Item scanné : " + itemTarget.Dscription, {
                            actions: ["OK"],
                            onClose: (sAction) => {
                                if (sAction === "OK") {
                                    console.log("OK");
                                }
                            }
                        });
                    } else {
                        console.log("Quantité invalide");
                        sap.m.MessageBox.warning("La quantité ne correspond pas", {
                            actions: ["OK"],
                            onClose: (sAction) => {
                                if (sAction === "OK") {
                                    console.log("OK");
                                }
                            }
                        });
                    }
                } else {
                    sap.m.MessageBox.error("Aucun code bar correspondant", {
                        actions: ["Fermer"],
                        onClose: (sAction) => {
                            if (sAction === "Fermer") {
                                console.log("Fermé");
                            }
                        }
                    });
                }
            } else {
                console.error("Aucun élément de commande trouvé.");
                MessageToast.show("Aucun élément de commande trouvé.");
            }
        }


    })
})
;