sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "wwl/utils/Formatter",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"


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

            this.getOwnerComponent().getRouter()
                .getRoute("Master")
                .attachMatched(this.onRouteMatch, this)

        },

        onRouteMatch: async function () {
            const order = await Models.Orders().top(5).get()
            const item = await Models.Items().top(5).get()

            let formattedOrders = []
            order.value.forEach((order => {
                formattedOrders.push({
                    key1: order.DocNum,
                    key2: order.DocEntry,
                    key3: order.DocumentLines
                })
            }))

            console.log("formattedOrders ::", formattedOrders)
            this._setModel(order.value, "ordersModel")
            this._setModel(item.value, "itemsModel")
            let totalPrice = this.calculiSommePrice(Models.Items().top(5).get())
            console.log(totalPrice);
            console.log(this._getModel("itemsModel").getData());
            console.log(this._getModel("ordersModel").getData());

            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },

        onCollapseAll: function () {
            const oTreeTable = this._byId("treeTable")
            // let allOrders = Models.Orders().top(2).get()
            // this._setModel(allOrders.value,"ordersModel");
            oTreeTable.collapseAll();
        },

        onCollapseSelection: function () {
            const oTreeTable = this._byId("treeTable")
            // let oTreeTable = Models.Orders().top(2).get()
            // this._setModel(oTreeTable.value, "ordersModel");
            oTreeTable.collapse(oTreeTable.getSelectedIndices());
        },

        onExpandFirstLevel: function () {
            const oTreeTable = this._byId("treeTable")
            // let oTreeTable = Models.Orders().top(2).get()
            // this._setModel(oTreeTable.value, "ordersModel");
            oTreeTable.expandToLevel(1);
        },

        onExpandSelection: function () {
            const oTreeTable = this._byId("treeTable")
            // let oTreeTable = Models.Orders().top(2).get()
            // this._setModel(oTreeTable.value, "ordersModel");
            oTreeTable.expand(oTreeTable.getSelectedIndices());
        },

        getDetails: function (oEvent) {

            const selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.ordersModel.getObject()
            Fragment.load({})

        },

        onPress: function () {
            let that = this

            if (!this._byId("helloDialog")) {
                Fragment.load({
                    // id: this.oView.getId(),
                    name: "wwl.view.Menu",
                    controller: this
                }).then(function (oMenu) {
                    console.log("this ;;", that)
                    that.oView.addDependent(oMenu);
                    oMenu.open();
                });
            } else {
                this._byId("helloDialog").open();
            }
        },


        onMenuAction: function (oEvent) {
            let oItem = oEvent.getParameter("item"),
                sItemPath = "";

            while (oItem instanceof MenuItem) {
                sItemPath = oItem.getText() + " > " + sItemPath;
                oItem = oItem.getParent();
            }

            sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));

            MessageToast.show("Action triggered on item: " + sItemPath);
        },

        calculiSommePrice: function (itemPriceData) {
            let somme = 0;
            for (let i = 0; i < itemPriceData.length; i++) {
                somme += itemPriceData[i].prix;
            }
            return itemPriceData;
        }

    });
});