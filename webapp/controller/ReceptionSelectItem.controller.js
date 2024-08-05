sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel,Fragment) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionSelectItem", {


        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionSelectItemPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function (oEvent) {
            const DocEntry = oEvent.getParameter("arguments").DocEntry;
            const CardCode = oEvent.getParameter("arguments").CardCode;
            this._setModel({DocEntry: DocEntry}, "DocEntryModelSL")
            this._setModel({CardCode: CardCode}, "CardCodeModelSL")
        },

        onPressSelectBusinessPartners: function () {
            const DocEntry = this._getModel("DocEntryModelSL").getData().DocEntry;
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectBusinessPartnersPage",{
                DocEntry:DocEntry
            });
        },


        onPressReceptionScanItem: function () {
            let that = this
            let inputCodeBar = new sap.m.Input({
                placeholder: "code bar"
            });

            let HboxinputCodeBar = new sap.m.HBox({
                items: [inputCodeBar],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let dialog = new sap.m.Dialog({
                title: "Code bar",
                content: [HboxinputCodeBar],
                beginButton: new sap.m.Button({
                    text: "Valider",
                    press: async () => {

                        let scannedCode = inputCodeBar.getValue();
                        const listOfItemWitCodeBars = await Models.Items().filter(`Frozen ne 'Y' and contains(BarCode,'${scannedCode}')`).get()
                        this._setModel(listOfItemWitCodeBars.value[0], "listOfItemWithCodeBarsModel")
                        const itemCode = await this._getModel("listOfItemWithCodeBarsModel").getData().ItemCode

                        if (!itemCode){
                            new sap.m.MessageBox.error("Aucun code barre correspondant")
                        }else{
                            this._getModel("listOfItemWithCodeBarsModel").refresh(true);
                            const DocEntry = this._getModel("DocEntryModelSL").getData().DocEntry
                            const CardCode = this._getModel("CardCodeModelSL").getData().CardCode
                            this.openDialog(DocEntry,CardCode ,itemCode)
                        }

                        console.log("Scanned code: ", scannedCode);
                        console.log("itemCode ::", itemCode)

                    }
                }),
                endButton: new sap.m.Button({
                    text: "Fermer",
                    press: function () {
                        dialog.close();
                    }
                })
            });
            this.getView().addDependent(dialog);
            dialog.open();
        },

        openDialog: function (DocEntry ,CardCode,itemCode) {
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectPurchaseOrderPage", {
                DocEntry: DocEntry,
                CardCode: CardCode,
                ItemCode: itemCode
            });
        },

        showListOfItems: async function (event) {
            const input = event.getSource().getValue()
            const ListOfItemsFiltered = await Models.Items().filter(`Frozen ne 'tYES' and contains(ItemCode,'${input}')`).get();
            this._setModel(ListOfItemsFiltered.value, "ReceptionItemsListModelSL");
            console.log("ListOfItemsFiltered ::", ListOfItemsFiltered)
            console.log("input ::", input)
        },

        selectedItem: async function (event) {
            const selectedItem = event.getSource().getSelectedKey()
            const itemWithItemCode = this._setModel([], "draftModelSL")
            this._setModel(itemWithItemCode.ItemCode, "itemWithItemCodeModelSL")
            this._setModel({ItemCode:selectedItem},"ItemCodeModelSL")
            const DocEntry = this._getModel("DocEntryModelSL").getData().DocEntry
            const CardCode = this._getModel("CardCodeModelSL").getData().CardCode
            const itemCode = this._getModel("ItemCodeModelSL").getData().ItemCode
            this.openDialog(DocEntry,CardCode,itemCode)
        },

    });
});


