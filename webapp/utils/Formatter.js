sap.ui.define([
    "wwl/model/models"
], function (models) {
    "use strict";
    return {

        formatDate:function (DocDate) {
            return new Date(DocDate).toLocaleDateString('fr')
        },

        formatterMessage: {
            getStatusType: function(sStatus) {
                switch (sStatus) {
                    case "delivered":
                        return MessageType.Success;
                    case "partially delivered":
                        return MessageType.Warning;
                    default:
                        return MessageType.Error;
                }
            }
        }

    }
});