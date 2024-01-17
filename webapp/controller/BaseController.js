sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    History
) {
    "use strict";

    return Controller.extend("wwl.controller.BaseController", {
        allParams: "",

        onNavBack: function () {
            let that = this
            let currentPage = that.getOwnerComponent().getRouter().oHashChanger._oActiveRouter._oMatchedRoute._oConfig.name

            this.handleViewOnNavigation()

            switch (currentPage) {
                case "Tags" :
                    that.getOwnerComponent().getRouter().navTo('Master')
                    break
                case "InventoryCountingLines" :
                    let currentInventory = this._getModel("inventoryCountingLinesModel").getData()
                    that.getOwnerComponent().getRouter().navTo('BinLocations', {selectedInventory: currentInventory.DocEntry})
                    break
                default:
                    let oHistory = History.getInstance()
                    let sPreviousHash = oHistory.getPreviousHash()
                    if (sPreviousHash !== undefined) window.history.go(-1)
                    else that.getOwnerComponent().getRouter().navTo('Master')
                    break
            }

            // let oHistory = History.getInstance()
            // let sPreviousHash = oHistory.getPreviousHash()
            // let previousPage
            // let previousPageParameter

            // if (sPreviousHash) {
            //     if (sPreviousHash.indexOf("/") === -1) previousPage = sPreviousHash
            //     else {
            //         console.log("sPreviousHash ::", sPreviousHash)
            //         previousPage = sPreviousHash.substring(0, sPreviousHash.indexOf("/"))
            //
            //         let numberOfParameters = 0
            //         let position = sPreviousHash.indexOf("/")
            //
            //         while (position !== -1) {
            //             numberOfParameters++
            //             position = sPreviousHash.indexOf("/", position + 1)
            //         }
            //
            //         previousPageParameter = sPreviousHash.substring(sPreviousHash.indexOf("/") + 1)
            //         console.log("numberOfParameters ::", numberOfParameters)
            //         console.log("previousPageParameter ::", previousPageParameter)
            //     }
            // }
        },

        handleViewOnNavigation: function () {
            let currentPage = this.getOwnerComponent().getRouter().oHashChanger._oActiveRouter._oMatchedRoute._oConfig.name

            switch (currentPage) {
                case "Tags" :
                    this._byId("grid").destroyItems()
                    this._setModel({}, "filteredResults")
                    break
            }
        },

        removeDuplicates: function (arrayToFilter) {
            return Array.from(new Set(arrayToFilter));
        },

        setFocus: function (itemInput) {
            setTimeout(function () {
                itemInput.focus()
            }, 500)
        },

        getError: function (e) {
            if (e.stack) {
                e = e.stack.split("\n");
                e = e.join('\n"');
            } else if (e.responseJSON) {
                e = e.responseJSON.error.message.value
            }
            return e
        },

        onMenuAction: function (event) {
            let selectedOption = event.getParameter('item').mProperties.text

            this.handleViewOnNavigation()

            switch (selectedOption) {
                case 'Accueil' :
                    this.getOwnerComponent().getRouter().navTo('Master')
                    break
                case 'Se déconnecter':
                    this.handleLogout()
                    break
            }
        },

        handleLogout: function () {
            let that = this;
            this.getOwnerComponent().ConfModel.Logout().post().always(() => {
                that.getOwnerComponent().getRouter().navTo('Login')
            })
        },

        _byId: function (name) {
            return sap.ui.getCore().byId(name) ? sap.ui.getCore().byId(name) : this.getView().byId(name)
        },

        _getModel: function (name) {
            return this.getView().getModel(name);
        },

        _setModel: function (data, modelName, sizeLimit) {
            let jsonModel = new JSONModel(data);
            if (sizeLimit) jsonModel.setSizeLimit(sizeLimit);
            return this.getView().setModel(jsonModel, modelName)
        },
    });
});