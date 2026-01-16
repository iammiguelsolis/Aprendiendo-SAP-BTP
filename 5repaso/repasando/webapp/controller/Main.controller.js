sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("uppersap.com.repasando.controller.Main", {
        onInit() {
            MessageToast.show('Hellow World!')
        },

        alPresionar: function () {
            let oBoton = this.getView().byId('miBotonSupremo')
            console.log(oBoton)
            MessageToast.show(oBoton.getText())

            oBoton.setText('Me has pulsado')

            oBoton.setType('Accept')
        },

        onEscribiendo: function(oEvent) {
            let oInput = oEvent.getSource()

            if ( 'Miguel' === oInput.getValue() ) {
                oInput.setEnabled(false)
                MessageToast.show('Desactivado')
            }
        },

        onValidar: function(oEvent) {
            let oBoton = oEvent.getSource()

            if ( 'Alonso' === this.getView().byId('inputUsuario').getValue()) {
                oBoton.setType('Accept')
                MessageToast.show('Bienvenido')
            } else {
                oBoton.setType('Reject')
                MessageToast.show('Denegado')
            }
        }

    });
});