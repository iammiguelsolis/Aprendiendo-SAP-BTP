sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("uppersap.com.listreport.controller.Detail", {
        
        onInit: function () {
            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            
            oRouter.getRoute("Detalle").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            let sObjectId = oEvent.getParameter("arguments").objectId;
            
            let oModel = this.getOwnerComponent().getModel("datos");
            let aProducts = oModel.getProperty("/ProductCollection");
            let sPath = null;

            for (let i = 0; i < aProducts.length; i++) {
                if (aProducts[i].ProductId == sObjectId) {
                    sPath = "/ProductCollection/" + i;
                    break;
                }
            }

            if (sPath) {
                this.getView().bindElement({
                    path: sPath,
                    model: "datos"
                });
            }
        },

        onNavBack: function () {
            let oHistory = History.getInstance();
            let sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true);
            }
        }
    });
});