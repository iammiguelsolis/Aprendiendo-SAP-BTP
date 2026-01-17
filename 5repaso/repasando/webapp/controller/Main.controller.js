sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("uppersap.com.repasando.controller.Main", {
        onInit() {

            let oDatos = {
                usuario: {
                    nombre: "",
                    rol: "Admin",
                    activo: true
                }
            };

            let oModelo = new JSONModel(oDatos)

            this.getView().setModel(oModelo);

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
        },

        onVerificarModelo: function() {
            let oModelo = this.getView().getModel();

            let sNombre = oModelo.getProperty("/usuario/nombre");

            if (sNombre === "Alonso") {
                MessageToast.show("¡Eres tú!");
            } else {
                MessageToast.show("Nombre incorrecto: " + sNombre);
            }
        }

    });
});