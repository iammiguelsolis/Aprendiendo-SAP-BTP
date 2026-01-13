sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/Label',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/comp/smartvariants/PersonalizableInfo',
    'sap/ui/model/odata/v2/ODataModel'
], function(Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo, ODataModel) {
    "use strict";

    return Controller.extend("uppersap.com.listreport.controller.Main", {

        onInit: function() {
            this.oSmartVariantManagement = this.getView().byId("svm");
            this.oExpandedLabel = this.getView().byId("expandedLabel");
            this.oSnappedLabel = this.getView().byId("snappedLabel");
            this.oFilterBar = this.getView().byId("filterbar");
            this.oTable = this.getView().byId("table");

            this.applyData = this.applyData.bind(this);
            this.fetchData = this.fetchData.bind(this);
            this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

            this.oFilterBar.registerFetchData(this.fetchData);
            this.oFilterBar.registerApplyData(this.applyData);
            this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

            let oPersInfo = new PersonalizableInfo({
                type: "filterBar",
                keyName: "persistencyKey",
                dataSource: "",
                control: this.oFilterBar
            });
            this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
            this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);

            this.getView().addStyleClass("sapUiSizeCompact");

            let sUrl = "https://services.odata.org/Northwind/Northwind.svc/";
            let oModelOData = new ODataModel(sUrl);


            // .read("/Products") -> SELECT * FROM PRODUCTS
            oModelOData.read("/Products", {
                urlParameters: {
                    "$expand": "Category,Supplier"
                }, // El expand es como un INNER JOIN
                success: function(oData) {
                    console.log(oData)
                    let aNorthwindProducts = oData.results;

                    let aMappedProducts = aNorthwindProducts.map(function(p) {
                        let sState = "Success"; 
                        let sIcon = "sap-icon://accept";
                        let sStockText = "En Stock (" + p.UnitsInStock + ")";

                        if (p.Discontinued) {
                            sState = "Error";
                            sIcon = "sap-icon://decline";
                            sStockText = "Descontinuado";
                        } else if (p.UnitsInStock < 10) {
                            sState = "Warning";
                            sIcon = "sap-icon://alert";
                            sStockText = "Bajo Stock (" + p.UnitsInStock + ")";
                        }

                        return {
                            ProductId: p.ProductID,
                            Name: p.ProductName,
                            Category: p.Category ? p.Category.CategoryName : "General",
                            SupplierName: p.Supplier ? p.Supplier.CompanyName : "Desconocido",
                            Price: p.UnitPrice,
                            Stock: p.UnitsInStock,
                            StockState: sState,
                            StockIcon: sIcon,
                            StockText: sStockText
                        };
                    });

                    let aUniqueNames = [...new Set(aMappedProducts.map(p => p.Name))].sort().map(n => ({ key: n, name: n }));
                    let aUniqueSuppliers = [...new Set(aMappedProducts.map(p => p.SupplierName))].sort().map(s => ({ key: s, name: s }));

                    let oModelJson = new JSONModel();
                    oModelJson.setData({
                        ProductCollection: aMappedProducts,
                        ProductNames: aUniqueNames,
                        ProductSuppliers: aUniqueSuppliers
                    });

                    this.getOwnerComponent().setModel(oModelJson, "datos");
                    this.oModel = oModelJson;
                }.bind(this), // js y sus alcances jeje
                error: function(oError) {
                    console.error("Hola, hubo error ->", oError);
                }
            });
        },

        onPress: function(oEvent) {
            let oItem = oEvent.getSource();
            console.log(oItem)
            let oBindingContext = oItem.getBindingContext("datos");
            let sProductId = oBindingContext.getProperty("ProductId");

            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Detalle", {
                objectId: sProductId
            });
        },
        fetchData: function () {
            let aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
                aResult.push({
                    groupName: oFilterItem.getGroupName(),
                    fieldName: oFilterItem.getName(),
                    fieldData: oFilterItem.getControl().getSelectedKeys()
                });
                return aResult;
            }, []);
            return aData;
        },

        applyData: function (aData) {
            aData.forEach(function (oDataObject) {
                let oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
                oControl.setSelectedKeys(oDataObject.fieldData);
            }, this);
        },

        getFiltersWithValues: function () {
            let aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                let oControl = oFilterGroupItem.getControl();
                if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
                    aResult.push(oFilterGroupItem);
                }
                return aResult;
            }, []);
            return aFiltersWithValue;
        },

        onSelectionChange: function (oEvent) {
            this.oSmartVariantManagement.currentVariantSetModified(true);
            this.oFilterBar.fireFilterChange(oEvent);
            this.onSearch();
        },

        onSearch: function () {
            let aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                let oControl = oFilterGroupItem.getControl(),
                    aSelectedKeys = oControl.getSelectedKeys(),
                    aFilters = aSelectedKeys.map(function (sSelectedKey) {
                        return new Filter({
                            path: oFilterGroupItem.getName(),
                            operator: FilterOperator.Contains,
                            value1: sSelectedKey
                        });
                    });

                if (aSelectedKeys.length > 0) {
                    aResult.push(new Filter({
                        filters: aFilters,
                        and: false
                    }));
                }
                return aResult;
            }, []);

            if (this.oTable.getBinding("items")) {
                this.oTable.getBinding("items").filter(aTableFilters);
                this.oTable.setShowOverlay(false);
            }
        },

        onFilterChange: function () {
            this._updateLabelsAndTable();
        },

        onAfterVariantLoad: function () {
            this._updateLabelsAndTable();
        },

        getFormattedSummaryText: function() {
            let aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();
            if (aFiltersWithValues.length === 0) return "No filters active";
            if (aFiltersWithValues.length === 1) return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
            return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
        },

        getFormattedSummaryTextExpanded: function() {
            let aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();
            if (aFiltersWithValues.length === 0) return "No filters active";
            let sText = aFiltersWithValues.length + " filters active",
                aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();
            if (aFiltersWithValues.length === 1) sText = aFiltersWithValues.length + " filter active";
            if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
            return sText;
        },

        _updateLabelsAndTable: function () {
            this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
            this.oSnappedLabel.setText(this.getFormattedSummaryText());
        },
        
        onExit: function() {
            this.oModel = null;
            this.oSmartVariantManagement = null;
            this.oExpandedLabel = null;
            this.oSnappedLabel = null;
            this.oFilterBar = null;
            this.oTable = null;
        }
    });
});