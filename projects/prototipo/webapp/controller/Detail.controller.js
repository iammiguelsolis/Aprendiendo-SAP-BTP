sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, UIComponent, History, MessageBox, JSONModel, Fragment) {
    "use strict";

    return Controller.extend("uppersap.com.prototipo.controller.Detail", {

        onInit: function () {
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            let sPath = oEvent.getParameter("arguments").orderPath;
            this.getView().bindElement({
                path: "/" + decodeURIComponent(sPath),
                model: "datos"
            });
            this._sCurrentOrderPath = "/" + decodeURIComponent(sPath);
        },

        onNavBack: function () {
            let oHistory = History.getInstance();
            let sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                let oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true);
            }
        },

        onOpenMaterialDialog: function (oEvent) {
            let oButton = oEvent.getSource();
            let sAction = oButton.data("action");
            let oView = this.getView();

            let oFormModel;
            if (sAction === "edit") {
                let oCtx = oButton.getBindingContext("datos");
                let oData = jQuery.extend({}, oCtx.getObject());
                oFormModel = new JSONModel({
                    title: "Editar Material",
                    isEdit: true,
                    path: oCtx.getPath(),
                    ...oData
                });
            } else {
                oFormModel = new JSONModel({
                    title: "Nuevo Material",
                    isEdit: false,
                    MatType: "",
                    MatDesc: "",
                    MatCenter: "",
                    MatStore: ""
                });
            }

            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "uppersap.com.prototipo.view.fragments.MaterialDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pDialog.then(function (oDialog) {
                oDialog.setModel(oFormModel, "formModel");
                oDialog.open();
            });
        },

        onSaveMaterial: function () {
            let oDialog = this.byId("MaterialDialog") || sap.ui.getCore().byId(this.getView().getId() + "--MaterialDialog");
            
            this._pDialog.then(function(oDialog){
                let oFormModel = oDialog.getModel("formModel");
                let oFormData = oFormModel.getData();
                let oModel = this.getView().getModel("datos");

                if (oFormData.isEdit) {
                    oModel.setProperty(oFormData.path + "/MatType", oFormData.MatType);
                    oModel.setProperty(oFormData.path + "/MatDesc", oFormData.MatDesc);
                    oModel.setProperty(oFormData.path + "/MatCenter", oFormData.MatCenter);
                    oModel.setProperty(oFormData.path + "/MatStore", oFormData.MatStore);
                } else {
                    let aMaterials = oModel.getProperty(this._sCurrentOrderPath + "/Materials");
                    if (!aMaterials) { aMaterials = []; }

                    let oNewMaterial = {
                        MatType: oFormData.MatType,
                        MatDesc: oFormData.MatDesc,
                        MatCenter: oFormData.MatCenter,
                        MatStore: oFormData.MatStore,
                        OrgVentas: "1000",
                        Canal: "10"
                    };

                    aMaterials.push(oNewMaterial);
                    oModel.setProperty(this._sCurrentOrderPath + "/Materials", aMaterials);
                }

                oDialog.close();
            }.bind(this));
        },

        onCloseDialog: function () {
            this._pDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onDeleteMaterial: function (oEvent) {
            let oCtx = oEvent.getSource().getBindingContext("datos");
            let sPath = oCtx.getPath();
            let oModel = this.getView().getModel("datos");

            MessageBox.confirm("¿Seguro que deseas eliminar este material?", {
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        let iIndex = parseInt(sPath.split("/").pop());
                        let sParentPath = sPath.substring(0, sPath.lastIndexOf("/"));
                        
                        let aMaterials = oModel.getProperty(sParentPath);
                        
                        aMaterials.splice(iIndex, 1);
                        
                        oModel.setProperty(sParentPath, aMaterials);
                    }
                }
            });
        },

        onDeleteOrder: function () {
            let oModel = this.getView().getModel("datos");
            let sOrderPath = this._sCurrentOrderPath; 

            MessageBox.confirm("¿Deseas eliminar toda la Orden? Esta acción no se puede deshacer.", {
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.DELETE) {
                        
                        let iIndex = parseInt(sOrderPath.split("/").pop());

                        let aOrders = oModel.getProperty("/OrderCollection");

                        aOrders.splice(iIndex, 1);
                        oModel.setProperty("/OrderCollection", aOrders);

                        this.onNavBack();
                        
                        sap.m.MessageToast.show("Orden eliminada correctamente");
                    }
                }.bind(this)
            });
        }
    });
});