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
                //.svc pour service reservé aux client server sql
                // url: appContext.url.SL + "view.svc/" + viewName + qry,
                url: appContext.url.XSODATA + "service.xsodata/" + viewName + qry + "?$format=json",
                xhrFields: {withCredentials: true}
            }).fail(error => {
                MessageBox.error(that.getError(error))
            }).always(() => {
                that.busyDialog.close()
            })
        },

        getOrdersWithStock: async function () {
            // return this.formatTransferRequestData(await this.getView('OB1_GET_TRANSFER_REQUESTS_M4_B1SLQuery'))
            // return await this.getView('GetOrdersWithStock');
            return this.formatOrders(await this.getView('GetOrdersWithStock'))
        },

        getItems: async function () {
            return this.noFormatItems(await this.getView('GetItems'))
        },

        // getBusinessPartners:async function(){
        //   return this.noFormatBusinessPartners(await this.getView('GetBusinessPartners'))
        // },
        //
        // noFormatBusinessPartners:function (){
        //   return data.d.results.map(result =>{
        //       return {
        //           CardName:result.CardName,
        //           CardCode:result.CardCode,
        //           CardType:result.CardType,
        //       }
        //     })
        // },

        noFormatItems: function (data) {
            return data.d.results.map(result => {
                return {
                    ItemCode: result.ItemCode,
                    ItemName: result.ItemName,
                    CodeBars: result.CodeBars,
                }
            })
        },

        noFormatOrders: function (data) {
            if (!data || !data.d.results || data.d.results.length === 0) {
                return [];
            }

            return data.d.results.map(result => {
                return {
                    DocDueDate_formatted: result.DocDueDate_formatted,
                    DocEntry: result.DocEntry,
                    DocNum: result.DocNum,
                    CardCode: result.CardCode,
                    CardName: result.CardName,
                    ItemCode: result.ItemCode,
                    Dscription: result.Dscription,
                    OnHand: result.OnHand,
                    WhsName: result.WhsName,
                    WhsCode: result.WhsCode,
                    Price: result.Price,
                    Quantity: result.Quantity,
                    totalStock: result.totalStock,
                    totalPriceInOrder: result.totalPriceInOrder,
                    totalPriceByItem: result.totalPriceByItem,
                };
            });
        },

        formatOrders: function (data) {
            if (!data || !data.d.results || data.d.results.length === 0) {
                return [];
            }

            // const acc = [];
            // data.d.results.forEach(line => {
            // let groupedData = {}
            return Object.values(data.d.results).reduce((acc, line) => {
                const docEntry = line.DocEntry;
                if (!acc[docEntry]) {
                    acc[docEntry] = [];
                    acc[docEntry].DocumentLines = []
                    acc[docEntry].CardName = line.CardName
                    acc[docEntry].CardCode = line.CardCode
                    acc[docEntry].DocDueDate_formatted = line.DocDueDate_formatted
                    acc[docEntry].totalPriceInOrder = line.totalPriceInOrder
                    acc[docEntry].DocEntry = line.DocEntry
                    acc[docEntry].DocNum = line.DocNum
                    acc[docEntry].CodeBars = line.CodeBars
                }

                let existingLine = acc[docEntry].DocumentLines.find(docLine => line.LineNum == docLine.LineNum)
                if (!existingLine) {
                    acc[docEntry].DocumentLines.push({
                        DocEntry: line.DocEntry,
                        Dscription: line.Dscription,
                        ItemCode: line.ItemCode,
                        CodeBars: line.CodeBars,
                        Price: line.Price,
                        Quantity: line.Quantity,
                        stockPerWhs: [{
                            WhsName: line.WhsName,
                            WhsCode: line.WhsCode,
                            OnHand: line.OnHand
                        }],
                        totalStock: line.totalStock,
                        totalPriceByItem: line.totalPriceByItem,
                        totalPriceInOrder: line.totalPriceInOrder,
                        LineNum: line.LineNum,

                    });
                } else {
                    existingLine.stockPerWhs.push({
                        WhsName: line.WhsName, WhsCode: line.WhsCode, OnHand: line.OnHand
                    })
                }
                return acc
                //besoin d'un tableau d'objet
            }, {});


            // return Object.values(acc).map(transferRequest => {
            //     const {
            //         CardCode,
            //         CardName,
            //         DocDueDate,
            //         DocEntry,
            //         Dscription,
            //         ItemCode,
            //         OnHand,
            //         Price,
            //         Quantity,
            //         WhsCode,
            //         WhsName,
            //         totalStock,
            //         totalPriceByItem,
            //         totalPriceInOrder,
            //     } = transferRequest[0];
            //
            //     return {
            //         CardCode,
            //         CardName,
            //         DocDueDate: new Date(DocDueDate).toLocaleDateString('fr'),
            //         DocEntry,
            //         Dscription,
            //         ItemCode,
            //         OnHand,
            //         Price,
            //         Quantity,
            //         WhsName,
            //         WhsCode,
            //         totalStock,
            //         totalPriceByItem,
            //         totalPriceInOrder,
            //     };
            // });
        },


        // formatTransferRequestData: function (data) {
        //     return Object.values(data.value.reduce((accumulator, currentvalue) => {
        //         accumulator[currentvalue.DocEntry] = accumulator[currentvalue.DocEntry] || []
        //         accumulator[currentvalue.DocEntry].push(currentvalue)
        //         return accumulator
        //     }, {}))
        //         .map(transferRequest => {
        //             const {
        //                 DocDueDate,
        //                 DocEntry,
        //                 CardCode,
        //                 cardName,
        //                 ItemCode,
        //                 Dscription,
        //                 OnHand,
        //                 WhsName,
        //                 WhsCode,
        //                 Price,
        //                 Quantity,
        //                 totalStock,
        //                 totalPriceInOrder,
        //                 totalPriceByItem,
        //
        //                 // U_OB1_PREP_ENCOURS: InPreparation,
        //                 // U_OB1_OPERATEUR,
        //                 // pendingRequestBinLoc
        //             } = transferRequest[0]
        //
        //             return {
        //
        //                 DocDueDate: new Date(DocDueDate).toLocaleDateString('fr'),
        //                 DocEntry,
        //                 CardCode,
        //                 cardName,
        //                 ItemCode,
        //                 Dscription,
        //                 OnHand,
        //                 WhsName,
        //                 WhsCode,
        //                 Price,
        //                 Quantity,
        //                 totalStock,
        //                 totalPriceInOrder,
        //                 totalPriceByItem,
        //                 // DocNum,
        //                 // InPreparation,
        //                 // StockTransferLines: transferRequest,
        //                 // U_OB1_OPERATEUR,
        //                 // pendingRequestBinLoc,
        //                 // NbLines: transferRequest.filter(item => item.InvntItem === 'Y').length
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