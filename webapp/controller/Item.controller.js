// sap.ui.define([
//     "./BaseController",
//     'sap/ui/model/json/JSONModel',
//     "sap/m/MessageBox",
//     "wwl/utils/Formatter",
// ], function (
//     BaseController,
//     JSONModel,
//     MessageBox,
//     Formatter,
// ) {
//     "use strict"
//     let Models
//     let Views
//
//     return BaseController.extend("wwl.controller.Item",
//         Formatter: Formatter,
//         onInit: function () {
//         Models = this.getOwnerComponent().ConfModel;
//         Views = this.getOwnerComponent().ViewsModel;
//
//         this.getOwnerComponent().getRouter()
//             .getRoute("Item")
//             .attachMatched(this.onRouteMatch, this)
//
//     },
//     onRouteMatch: async function () {
//         const order = await Models.Items().top(5).get()
//         this._setModel(item.value, "itemModel")
//     },
// });
// });