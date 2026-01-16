sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/Label',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/comp/smartvariants/PersonalizableInfo'
], function(Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo) {
    "use strict";

    return Controller.extend("uppersap.com.prototipo.controller.Main", {

        onInit: function() {
            let oViewModel = new JSONModel({
                Description: "",
                OrderNumber: "", 
                LocalCenter: [],
                Status: []    
            });
            this.getView().setModel(oViewModel, "filter");

            this.oSmartVariantManagement = this.byId("svm");
            this.oExpandedLabel = this.byId("expandedLabel");
            this.oSnappedLabel = this.byId("snappedLabel");
            this.oFilterBar = this.byId("filterbar");
            this.oTable = this.byId("table");

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

            this._processLocalData();
        },

        _processLocalData: function() {
            let oModel = this.getOwnerComponent().getModel("datos");
            let aOrders = oModel.getProperty("/OrderCollection");

            if (aOrders) {
                let aUniqueCenters = [...new Set(aOrders.map(p => p.LocalCenter))].sort().map(c => ({ key: c, name: c }));
                oModel.setProperty("/Centers", aUniqueCenters);

                let aUniqueStatuses = [...new Set(aOrders.map(p => p.StatusText))].sort().map(s => ({ key: s, name: s }));
                oModel.setProperty("/Statuses", aUniqueStatuses);
            }
        },

        onSearch: function () {
            let oFilterData = this.getView().getModel("filter").getData();
            let aTableFilters = [];

            if (oFilterData.Description) {
                aTableFilters.push(new Filter("Description", FilterOperator.Contains, oFilterData.Description));
            }

            if (oFilterData.OrderNumber) {
                aTableFilters.push(new Filter("OrderNumber", FilterOperator.Contains, oFilterData.OrderNumber));
            }

            if (oFilterData.LocalCenter && oFilterData.LocalCenter.length > 0) {
                let aCenterFilters = oFilterData.LocalCenter.map(function (sKey) {
                    return new Filter("LocalCenter", FilterOperator.EQ, sKey);
                });
                aTableFilters.push(new Filter({ filters: aCenterFilters, and: false }));
            }

            if (oFilterData.Status && oFilterData.Status.length > 0) {
                let aStatusFilters = oFilterData.Status.map(function (sKey) {
                    return new Filter("StatusText", FilterOperator.EQ, sKey);
                });
                aTableFilters.push(new Filter({ filters: aStatusFilters, and: false }));
            }

            let oBinding = this.oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aTableFilters);
                this.oTable.setShowOverlay(false);
            }
            
            this._updateLabelsAndTable();
        },

        fetchData: function () {
            return this.getView().getModel("filter").getData();
        },

        applyData: function (aData) {
            if (aData) {
                this.getView().getModel("filter").setData(aData);
            }
        },

        getFiltersWithValues: function () {
            let aFilters = [];
            let oData = this.getView().getModel("filter").getData();
            
            if (oData.Description) aFilters.push("Description");
            if (oData.OrderNumber) aFilters.push("OrderNumber");
            if (oData.LocalCenter && oData.LocalCenter.length > 0) aFilters.push("LocalCenter");
            if (oData.Status && oData.Status.length > 0) aFilters.push("Status");
            
            return aFilters;
        },

        onSelectionChange: function (oEvent) {
            this.oSmartVariantManagement.currentVariantSetModified(true);
            this.oFilterBar.fireFilterChange(oEvent);
        },

        onFilterChange: function () {
            this._updateLabelsAndTable();
        },

        onAfterVariantLoad: function () {
            this._updateLabelsAndTable();
            this.onSearch();
        },

        _updateLabelsAndTable: function () {
            let iCount = this.getFiltersWithValues().length;
            let sText = iCount === 0 ? "Sin filtros activos" : iCount + " filtros activos";
            this.oExpandedLabel.setText(sText);
            this.oSnappedLabel.setText(sText);
        },

        onPress: function (oEvent) {
            let oItem = oEvent.getSource();
            let oBindingContext = oItem.getBindingContext("datos");
            let sPath = oBindingContext.getPath().substr(1);

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                orderPath: encodeURIComponent(sPath)
            });
        },

        onExit: function() {
            this.oSmartVariantManagement = null;
            this.oExpandedLabel = null;
            this.oSnappedLabel = null;
            this.oFilterBar = null;
            this.oTable = null;
        },
        onNavToCreate: function() {
            this.getOwnerComponent().getRouter().navTo("RouteCreate");
        }
    });
});