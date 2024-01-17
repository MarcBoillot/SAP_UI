sap.ui.define([
    "./BaseModel",
    "sap/m/BusyDialog",
], function (
    BaseModel,
    BusyDialog
) {
    "use strict";

    return BaseModel.extend('wwl.model.ConfModel', {

        constructor: function (oView) {
            this.oView = oView
            this.appContext = oView.getParent().APP_CONTEXT
            this.busyDialog = new BusyDialog({
                busyIndicatorDelay: 0,
                title: "",
                showCancelButton: false
            })
        },

        TransactionScript: function () {
            this.target = "script/WW/TransactionScript"
            return this
        },

        SQLQueries: function () {
            this.target = "SQLQueries"
            return this
        },

        U_OB1PARAMS: function () {
            this.target = "U_OB1PARAMS"
            return this
        },

        BinLocations: function () {
            this.target = "BinLocations"
            return this
        },

        BusinessPartners: function () {
            this.target = "BusinessPartners"
            return this
        },

        DeliveryNotes: function () {
            this.target = "DeliveryNotes"
            return this
        },

        Drafts: function () {
            this.target = "Drafts"
            return this
        },

        InventoryCountings: function () {
            this.target = "InventoryCountings"
            return this
        },

        InventoryGenEntries: function () {
            this.target = "InventoryGenEntries"
            return this
        },

        InventoryGenExits: function () {
            this.target = "InventoryGenExits"
            return this
        },

        InventoryTransferRequests: function () {
            this.target = "InventoryTransferRequests"
            return this
        },

        Items: function () {
            this.target = "Items"
            return this
        },

        Login: function () {
            this.target = "Login"
            return this
        },

        Logout: function () {
            this.target = "Logout"
            return this
        },

        Orders: function () {
            this.target = "Orders"
            return this
        },

        ProductionOrders: function () {
            this.target = "ProductionOrders"
            return this
        },

        ReceiptDetails: function () {
            this.target = "ReceiptDetails"
            return this
        },

        StockTransfers: function () {
            this.target = "StockTransfers"
            return this
        },

        PrintAPI: function () {
            this.target = "api"
            return this
        }
    });
});