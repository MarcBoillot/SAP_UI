sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "wwl/model/models",
    "wwl/model/ConfModel",
    "wwl/model/Views"

], function (
    UIComponent,
    Device,
    models,
    ConfModel,
    ViewsModel
) {
    "use strict";

    return UIComponent.extend("wwl.Component", {

        metadata: {
            manifest: "json"
        },

        init: async function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.APP_CONTEXT = {
                authRequired: true,
                dbCompany: 'OB3_TEST',
                url: {
                    SL: 'https://sap-hana.work-well.fr:4300/MB_Views_TEST/',
                    // SL: 'https://sap-hana.work-well.fr:50000/b1s/v1/',
                    PrintAPI: 'https://sap.dpia.fr:2660/',
                },
            };

            this.setModel(models.createDeviceModel(), "device");
            this.ConfModel = new ConfModel(this.getRootControl());
            this.ViewsModel = new ViewsModel(this.getRootControl());

            this.getRouter().initialize();
        },

    });

});