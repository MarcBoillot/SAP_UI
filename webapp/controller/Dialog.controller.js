sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "wwl/utils/Formatter",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",

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
    let selectedRow

    return BaseController.extend("wwl.controller.Master", {
        Formatter: Formatter,

        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;

            let oModel = new JSONModel({
                ItemDescription: "",
                PriceAfterVAT: "",
                Currency: "",
                Quantity: ""
            });

            this.getView().setModel(oModel);
            this.getOwnerComponent().getRouter()
                .getRoute("Master")
                .attachMatched(this.onRouteMatch, this)

        },

// ------------------------------------------------ROUTEMATCH------------------------------------------------ //

        onRouteMatch: async function () {
            let that = this




            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },




//********************************************* IDENTIFICATION ***************************************************

Identification:function (){},

//***************************************** SHOW THE BL CLOSED **********************************************



//****************************************** SHOW WHAREHOUSE ************************************************




//******************************************* ADD ITEM IN ORDER ***************************************************





//****************************************** DELETE ITEM IN ORDER *************************************************



//************************************* MODIFY ITEM IN ORDER *****************************************************




//******************************************** SELECT ITEM *****************************************************


// -------------------------------------------MODIFICATION IN SELECT------------------------------------------------- //

// ------------------------------------------------CLOSE DIALOG------------------------------------------------------ //





//************************************************* GENERATE A BL ***********************************************



// ------------------------------------------------SHOW ITEMS IN ORDER------------------------------------------------ //




// ------------------------------------------------ADD AN ITEM IN ORDER------------------------------------------------//




// ------------------------------------------------DELETE AN ITEM IN ORDER------------------------------------------------ //



// ----------------------------------------------------MESSAGE OF QTY------------------------------------------//



//-------------------------------------------------SCANNER--------------------------------------------------//






    })
})
;