sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
], function (
    ManagedObject,
    BusyDialog,
    MessageBox
) {
    let appContext

    return ManagedObject.extend('wwl.model.Views', {

        query: "",

        constructor: function (oView) {
            appContext = oView.getParent().APP_CONTEXT
            this.busyDialog = new BusyDialog({
                busyIndicatorDelay: 0,
                title: "",
                showCancelButton: false
            })
        },

        _prepareToAddParam: function () {
            return this.query === "" ? "?$" : "&$";
        },

        select: function (select) {
            this.query += this._prepareToAddParam();
            this.query += "select=" + select;
            return this
        },

        apply: function (apply) {
            this.query += this._prepareToAddParam();
            this.query += "apply=" + apply;
            return this
        },

        filter: function (filter) {
            this.query += this._prepareToAddParam();
            this.query += "filter=" + filter;
            return this
        },

        id: function (id) {
            this.query = "(" + id + ")" + this.query;
            return this
        },

        _resetQuery: function () {
            this.query = ""
        },

        getView: function (viewName) {
            let that = this
            that.busyDialog.setText("Requête en cours...")
            that.busyDialog.open()

            let qry = that.query
            that._resetQuery()

            return $.ajax({
                method: 'get',
                // url: `${appContext.url.SL}view.svc/${viewName}${qry}`,
                // url: appContext.url.SL + "view.svc/" + viewName + qry,
                url: appContext.url.SL + "service.xsodata/" + viewName + qry,
                xhrFields: {withCredentials: true}
            }).fail(error => {
                MessageBox.error(that.getError(error))
            }).always(() => {
                that.busyDialog.close()
            })
        },

        getTransferRequests: async function () {
            // return this.formatTransferRequestData(await this.getView('OB1_GET_TRANSFER_REQUESTS_M4_B1SLQuery'))
            return await this.getView('GetOrdersWithStock');
        },

        // formatTransferRequestData: function (data) {
        //     return Object.values(data.value.reduce((r, a) => {
        //         r[a.DocNum] = r[a.DocNum] || []
        //         r[a.DocNum].push(a)
        //         return r
        //     }, {}))
        //         .map(transferRequest => {
        //             const {
        //                 DocEntry,
        //                 DocNum,
        //                 DocDueDate,
        //                 U_OB1_PREP_ENCOURS: InPreparation,
        //                 U_OB1_OPERATEUR,
        //                 pendingRequestBinLoc
        //             } = transferRequest[0]
        //
        //             return {
        //                 DocEntry,
        //                 DocNum,
        //                 DocDueDate: new Date(DocDueDate).toLocaleDateString('fr'),
        //                 InPreparation,
        //                 StockTransferLines: transferRequest,
        //                 U_OB1_OPERATEUR,
        //                 pendingRequestBinLoc,
        //                 NbLines: transferRequest.filter(item => item.InvntItem === 'Y').length
        //             }
        //         })
        // },

        getError: function (e) {
            if (e.stack) {
                e = e.stack.split("\n");
                e = e.join('\n"');
            } else if (e.responseJSON) {
                e = e.responseJSON.error.message.value
            }
            return e
        },
    });
});