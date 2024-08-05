sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment"
], function (BaseController, JSONMOdel, Fragment) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionSelectPurchaseOrder", {


        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionSelectPurchaseOrderPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function (oEvent) {
            // const x = await Views.getPurchaseOrder()
            // const y = await Views.getDraftToPurchaseOrders()
            // const z = await Views.noFormatItems()
            // console.log("data ::",z)
            // console.log("::",y)
            // console.log("vue sql ::", x)
            const dataToPost = {
                "Requete": "select * from SBO_ASTIC_TSTAPI.OB1_DRAFT_TO_PURCHASE_ORDER"
            }
            console.log(JSON.stringify(dataToPost))
            await Models.SeidorAPI().requestBySeidorAPI(dataToPost)

            const DocEntry = oEvent.getParameter("arguments").DocEntry;
            const ItemCode = oEvent.getParameter("arguments").ItemCode;
            const CardCode = oEvent.getParameter("arguments").CardCode;
            this._setModel({DocEntry: DocEntry}, "DocEntryModelSL")
            this._setModel({ItemCode: ItemCode}, "ItemCodeModelSL")
            this._setModel({CardCode: CardCode}, "CardCodeModelSL")
            await this.informationBussinessPartners()
            await this.informationDraft()
            await this.informationItem()
            await this.purhaseOrdersList()

        },

        informationDraft: async function () {
            const DocEntryDraft = this._getModel("DocEntryModelSL").getData().DocEntry;
            console.log("DocEntryDraft 1::", DocEntryDraft)
            const dataDraft = await Models.Drafts().filter(`contains(DocEntry, '${DocEntryDraft}')`).get()
            console.log("dataDraft 2::", dataDraft.value[0])
            return dataDraft.value[0]
        },

        informationItem: async function () {
            const ItemCode = this._getModel("ItemCodeModelSL").getData().ItemCode;
            console.log("ItemCode 3::", ItemCode)
            const dataItem = await Models.Items().filter(`Frozen ne 'Y' and ItemCode eq '${ItemCode}'`).get()
            console.log("dataItem 4::", dataItem.value[0])
            return dataItem.value[0]
        },

        informationBussinessPartners: async function () {
            const CardCode = this._getModel("CardCodeModelSL").getData().CardCode;
            console.log("CardCode 5::", CardCode)
            const dataBusinnessPartner = await Models.BusinessPartners().filter(`Frozen ne 'tYES' and CardType eq 'S' and CardCode eq '${CardCode}'`).get()
            console.log("dataBusinnessPartner 6::", dataBusinnessPartner.value[0])
            return dataBusinnessPartner.value[0]
        },

        purhaseOrdersList: async function () {
            //je dois recuperer la list des purchase Orders qui a des documentLines avec cet itemCode et ce CardName
            const getViewDataPurchaseOrder = await Views.getPurchaseOrder()
            console.log("getViewDataPurchaseOrder:",getViewDataPurchaseOrder)
            const ItemCode = this._getModel("ItemCodeModelSL").getData().ItemCode;
            console.log("ItemCode 7:::::",ItemCode)
            const purchaseOrders = await Models.PurchaseOrders().filter(`contains(ItemCode, '${ItemCode}')`).get()
            console.log("purchasdeOrders 8::", purchaseOrders.value)
            console.log(" purchase order list ")
        },

        onPressSelectItem: function () {
            const docEntry = this._getModel("DocEntryModelSL").getData().DocEntry
            const cardCode = this._getModel("CardCodeModelSL").getData().CardCode
            console.log("DocEntry::::::",docEntry)
            console.log("cardCode ::::::",cardCode)
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectItemPage", {
                DocEntry: docEntry,
                CardCode: cardCode
            });
        },

        onPressSelectPurchaseOrder: function (DocEntry, ItemCode, DocEntryPO) {
            this.getOwnerComponent().getRouter().navTo("ReceptionCreateDraftPage", {
                DocEntry: DocEntry,
                ItemCode: ItemCode,
                DocEntryPO: DocEntryPO
            })
        },
    });
});
