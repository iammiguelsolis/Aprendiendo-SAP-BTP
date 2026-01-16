sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, MessageBox, History) {
    "use strict";

    return Controller.extend("uppersap.com.prototipo.controller.Create", {

        onInit: function () {
            this._initWizardModel();
            this.getOwnerComponent().getRouter().getRoute("RouteCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function() {
            this._initWizardModel();
            let oWizard = this.byId("CreateWizard");
            let oFirstStep = this.byId("ProductTypeStep");
            
            oWizard.discardProgress(oFirstStep);
            oWizard.goToStep(oFirstStep);
            
            var oNavContainer = this.byId("wizardNavContainer");
            oNavContainer.to(this.byId("wizardContentPage"));
        },

        _initWizardModel: function() {
            let oModel = new JSONModel({
                Description: "",
                LocalCenter: "",
                Date: null,
                Materials: [],
                showSave: false
            });
            this.getView().setModel(oModel, "createModel");
        },

        validateStep1: function () {
            let oModel = this.getView().getModel("createModel");
            let sDesc = oModel.getProperty("/Description");
            let sCenter = oModel.getProperty("/LocalCenter");
            let sDate = oModel.getProperty("/Date");

            let bIsValid = sDesc.length > 0 && sCenter.length > 0 && sDate !== null;
            
            let oWizard = this.byId("CreateWizard");
            let oStep1 = this.byId("ProductTypeStep");
            
            if (bIsValid) {
                oWizard.validateStep(oStep1);
            } else {
                oWizard.invalidateStep(oStep1);
            }
        },

        onAddMaterial: function() {
            let oModel = this.getView().getModel("createModel");
            let aMaterials = oModel.getProperty("/Materials");
            
            aMaterials.push({
                MatType: "",
                MatDesc: "",
                MatStore: "",
                MatCenter: oModel.getProperty("/LocalCenter"),
                OrgVentas: "1000",
                Canal: "10",
                UMB: "UN",
                UMA: "1",
                TextoUMA: "Unidad"
            });

            oModel.setProperty("/Materials", [].concat(aMaterials));
        },

        onDeleteMaterial: function(oEvent) {
            let oItem = oEvent.getParameter("listItem");
            let sPath = oItem.getBindingContext("createModel").getPath();
            let iIndex = parseInt(sPath.split("/").pop());
            
            let oModel = this.getView().getModel("createModel");
            let aMaterials = oModel.getProperty("/Materials");
            
            aMaterials.splice(iIndex, 1);

            oModel.setProperty("/Materials", [].concat(aMaterials));
        },

        wizardCompletedHandler: function () {
            var oNavContainer = this.byId("wizardNavContainer");
            var oReviewPage = this.byId("wizardReviewPage");
            oNavContainer.to(oReviewPage);
        },

        onBackToWizard: function () {
            var oNavContainer = this.byId("wizardNavContainer");
            oNavContainer.back();
        },

        onEditStep1: function() {
            this.onBackToWizard();
            var oWizard = this.byId("CreateWizard");
            var oStep1 = this.byId("ProductTypeStep");
            setTimeout(function() {
                oWizard.goToStep(oStep1);
            }, 200);
        },

        onEditStep2: function() {
            this.onBackToWizard();
            var oWizard = this.byId("CreateWizard");
            var oStep2 = this.byId("MaterialsStep");
            setTimeout(function() {
                oWizard.goToStep(oStep2);
            }, 200);
        },

        onSaveOrder: function() {
            let oCreateModel = this.getView().getModel("createModel");
            let oData = oCreateModel.getData();

            let oMainModel = this.getOwnerComponent().getModel("datos");
            let aOrders = oMainModel.getProperty("/OrderCollection");

            let sNewId = (aOrders.length + 1).toString();
            let sNewOrderNumber = "000" + sNewId; 

            let oNewOrder = {
                OrderId: sNewId,
                OrderNumber: sNewOrderNumber,
                Description: oData.Description,
                LocalCenter: oData.LocalCenter,
                Date: oData.Date,
                StatusText: "Creado",
                StatusState: "Information",
                Materials: oData.Materials
            };

            aOrders.push(oNewOrder);
            oMainModel.setProperty("/OrderCollection", aOrders);

            MessageBox.success("Orden " + sNewOrderNumber + " creada exitosamente.", {
                onClose: function() {
                    this.onNavBack();
                }.bind(this)
            });
        },

        onNavBack: function () {
            let oHistory = History.getInstance();
            let sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain");
            }
        }
    });
});