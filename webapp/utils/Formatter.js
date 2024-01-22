sap.ui.define([
    "wwl/model/models"
], function (models) {
    "use strict";
    return {

        formatDate:function (DocDate) {
            return new Date(DocDate).toLocaleDateString('fr')
        },

    }
});