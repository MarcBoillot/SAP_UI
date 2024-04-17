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

## Request spec for SQL VIEW
*

**SELECT**
* 0.0 "measure", <-- dont forget
* t0."Address",
* TO_VARCHAR(t0."DocDueDate", 'DD-MM-YYYY') AS "DocDueDate_formatted",
* t4."CodeBars",
* t0."DocEntry",
* t0."CardCode",
* t0."CardName",
* t1."ItemCode",
* t1."Dscription",
* t2."OnHand",
* t3."WhsName",
* t2."WhsCode",
* t1."Price",
* t1."Quantity",
* t1."LineNum",
* SUM(t2."OnHand") OVER(PARTITION BY t1."ItemCode") AS "totalStock",
* SUM(t1."Price") OVER(PARTITION BY t0."DocEntry") AS "totalPriceInOrder",
* SUM(t1."Price") OVER(PARTITION BY t0."DocEntry", t1."ItemCode") AS "totalPriceByItem",
* CASE
* WHEN t1."LineStatus"='C' THEN 'Delivered'
* WHEN t1."Quantity" <> t1."OpenQty" THEN 'Delivery'
* ELSE 'Not delivered'
* END	as STATUS
* **FROM**
* ORDERS t0
* **INNER JOIN**
* ORDER t1 ON t0."DocEntry" = t1."DocEntry"
* **INNER JOIN**
* ITEMS t2 ON t1."ItemCode" = t2."ItemCode"
* **INNER JOIN**
* WAREHOUSE t3 ON t2."WhsCode" = t3."WhsCode"
* **INNER JOIN**
* ITEM t4 ON t2."ItemCode" = t4."ItemCode"
* **WHERE**
* t4."INACTIF" <> 'YES'
* **AND**
* -- t0."DocEntry" IN (SELECT TOP 15 "DocEntry" FROM ORDERS ORDER BY "DocEntry" DESC)
* t2."OnHand" > 0
* **AND**
* t0."DocDueDate" > '2024-01-01'
* **ORDER BY**
* t0."DocEntry";
* END

## An other sql view create just for get all items 
* Don't forget to give the privilege with target the user just for create after you just need ALTER 

## Use Service Layer for Business Partners 