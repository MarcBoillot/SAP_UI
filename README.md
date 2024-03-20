# Template for SAP_UI5
Manipulate the sales order database with order creation and add products to orders and delete products from selected orders. Using the patch post and get methods

Manage views with fragments and views. Dynamic Page and Single Page View


## La connection a la base test ce fait par cookies

https://

{
	"CompanyDB":"OB3_TEST_NL",
 "UserName":"",
 "Password":""
}

## Second possibility for connection to database by ViewSQL

Make in Model directory a file which will name Views.js 
* implement your logic for take only the datas you need 

In component.js in init function put your url link to service layer and initialize the router
