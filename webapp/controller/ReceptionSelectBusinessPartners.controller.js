sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
], function (BaseController,JSONModel,Fragment,MessageBox) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionSelectBusinessPartners", {

        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionSelectBusinessPartnersPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {

        },

        onPressReceptionChoicePage: function () {
            this.getOwnerComponent().getRouter().navTo("ReceptionChoicePage");
        },

        onPressReceptionSelectBusinessPartners:async function (){
            // const DocEntry = await this.selectedSupplier()
            const docEntry =  this._getModel("draftModelSL").getData().DocEntry
            const cardCode = this._getModel("ReceptionSuppliersListModelSL").getData()[0].CardCode
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectItemPage", {
                DocEntry:docEntry,
                CardCode: cardCode
            });
        },

        controllerCharNumber: function (event){
            const input = event.getParameters().value
            let nbCharSup = false
            if(input.length>=4){
                nbCharSup = true
            }
            return nbCharSup
        },

        showListOfSuppliers: async function (event){
            console.log(event.getParameters().value.toUpperCase())
            const input = event.getSource().getValue()
            const inputToUpperCase = input.toUpperCase()
            const nbCharSup = this.controllerCharNumber(event)
            let haveSelectedBp = false
            if(nbCharSup === true && haveSelectedBp === false){
                console.log("il y a plus de 3 char ::",nbCharSup)
                const ListOfSuppliersFiltered = await Models.BusinessPartners().filter(`Frozen ne 'tYES' and CardType eq 'S' and contains(CardName,'${inputToUpperCase}')`).get();
                console.log("List of suppliers filtered ::",ListOfSuppliersFiltered.value)
                this._setModel(ListOfSuppliersFiltered.value, "ReceptionSuppliersListModelSL");
            }
            haveSelectedBp = true
        },

        selectedSupplierWithCardName: async function (event){
            let that = this
            const selectedBpBool = true
            const selectedSupplier = event.getSource().getSelectedKey()
            const modelDraft = this._setModel([], "draftModelSL");
            this._setModel(modelDraft.CardName, "inputCardName");
            console.log("Fournisseur sélectionné", selectedSupplier);
            // this.verificatorActionForCreateDraft()
            let response;
            try {
                response = await Models.Drafts().post({
                    CardCode: selectedSupplier,
                    DocDueDate: new Date(),
                    DocObjectCode: "oPurchaseDeliveryNotes",
                    DocumentLines: []
                });
                // console.log("POST successful", response);
                const docEntry = response.DocEntry;
                // console.log("docEntry du draft créé ::", docEntry);
                this._setModel(response, "draftModelSL");
                this._getModel("draftModelSL").setProperty("/DocEntry", docEntry);
                this._getModel("draftModelSL").refresh(true);
                // console.log("Doc entry du model draft :: ",this._getModel("draftModelSL").getData().DocEntry);
                await that.onPressReceptionSelectBusinessPartners();
                return docEntry
            } catch (error) {
                console.error("POST failed", error);
            }
            return selectedBpBool
        },

        showListOfSuppliersWithCardCode:async function (event){
            console.log(event.getParameters().value.toUpperCase())
            const input = event.getSource().getValue()
            const nbCharSup = this.controllerCharNumber(event)
            let haveSelectedBp = false
            if(nbCharSup === true && haveSelectedBp === false){
                console.log("il y a plus de 3 char ::",nbCharSup)
                const ListOfSuppliersFiltered = await Models.BusinessPartners().filter(`Frozen ne 'tYES' and CardType eq 'S' and contains(CardCode,'${input}')`).get();
                console.log("List of suppliers filtered ::",ListOfSuppliersFiltered.value)
                this._setModel(ListOfSuppliersFiltered.value, "ReceptionSuppliersListModelSL");
            }
            haveSelectedBp = true
        },

        // verificatorActionForCreateDraft: function (){
        //     // new sap.m.MessageBox.alert("Approve purchase order 12345?",{});
        //     console.log("messgae d'avertissement")
        // },

        selectedSupplierWithCardCode: async function (event){
            let that = this
            const selectedBpBool = true
            const selectedSupplier = event.getSource().getSelectedKey()
            const modelDraft = this._setModel([], "draftModelSL");
            this._setModel(modelDraft.CardCode, "inputCardCode");
            console.log("Fournisseur sélectionné", selectedSupplier);
            let response;
            try {
                response = await Models.Drafts().post({
                    CardCode: selectedSupplier,
                    DocDueDate: new Date(),
                    DocObjectCode: "oPurchaseDeliveryNotes",
                    DocumentLines: []
                });
                // console.log("POST successful", response);
                const docEntry = response.DocEntry;
                // console.log("docEntry du draft créé ::", docEntry);
                this._setModel(response, "draftModelSL");
                this._getModel("draftModelSL").setProperty("/DocEntry", docEntry);
                this._getModel("draftModelSL").refresh(true);
                // console.log("Doc entry du model draft :: ",this._getModel("draftModelSL").getData().DocEntry);
                await that.onPressReceptionSelectBusinessPartners();
                return docEntry
            } catch (error) {
                console.error("POST failed", error);
            }
            return selectedBpBool
        },

    });
});





