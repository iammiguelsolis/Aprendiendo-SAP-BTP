sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/Label',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/comp/smartvariants/PersonalizableInfo'
], function(Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo) {
	"use strict";

	return Controller.extend("uppersap.com.listreport.controller.Main", {
		onInit: function() {
            this.oModel = this.getView().getModel('datos')

			this.applyData = this.applyData.bind(this);
			this.fetchData = this.fetchData.bind(this);
			this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

			this.oSmartVariantManagement = this.getView().byId("svm");
			this.oExpandedLabel = this.getView().byId("expandedLabel");
			this.oSnappedLabel = this.getView().byId("snappedLabel");
			this.oFilterBar = this.getView().byId("filterbar");
			this.oTable = this.getView().byId("table");

			this.oFilterBar.registerFetchData(this.fetchData);
			this.oFilterBar.registerApplyData(this.applyData);
			this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

            var oPersInfo = new PersonalizableInfo({
                type: "filterBar",          // 1. ¿QUÉ ERES?
                keyName: "persistencyKey",  // 2. ¿DÓNDE ESTÁ TU NOMBRE CLAVE?
                dataSource: "",             // 3. ¿DE DÓNDE SACAS DATOS? (Opcional aquí)
                control: this.oFilterBar    // 4. ¿QUIÉN ERES FÍSICAMENTE?
            });
			this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
            // Toma, Guardia. Aquí están los papeles de la Barra de Filtros. A partir de ahora, tú eres responsable de vigilarla, guardar sus cambios y recordar cómo la dejó el usuario.
			this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);

            this.getView().addStyleClass("sapUiSizeCompact");
		},

		onExit: function() {
			this.oModel = null;
			this.oSmartVariantManagement = null;
			this.oExpandedLabel = null;
			this.oSnappedLabel = null;
			this.oFilterBar = null;
			this.oTable = null;
		},


        // EMPAQUETA los filtros para guardarlos
		fetchData: function () {
			var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
				aResult.push({
					groupName: oFilterItem.getGroupName(),
					fieldName: oFilterItem.getName(),
					fieldData: oFilterItem.getControl().getSelectedKeys()
				});

				return aResult;
			}, []);

			return aData;
		},

        // DESEMPAQUETA los filtros para ponerlos en pantalla
        applyData: function (aData) {
            // 1. EL BUCLE (Abrir la caja)
            aData.forEach(function (oDataObject) {
                
                // 2. EL BUSCADOR (Encontrar el control correcto)
                var oControl = this.oFilterBar.determineControlByName(
                    oDataObject.fieldName, 
                    oDataObject.groupName
                );

                // 3. LA ACCIÓN (Marcar los checks)
                oControl.setSelectedKeys(oDataObject.fieldData);

            }, this);
        },

        getFiltersWithValues: function () {
            // 1. EL RECORRIDO (El Inspector camina por la fila)
            var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                
                // 2. EL CONTROL (Agarra el objeto real, el MultiComboBox)
                var oControl = oFilterGroupItem.getControl();

                // 3. LA PRUEBA (¿Está encendido?)
                if (
                    oControl &&                          // ¿Existe el control?
                    oControl.getSelectedKeys &&          // ¿Es un control tipo Lista/Combo?
                    oControl.getSelectedKeys().length > 0 // ¿Tiene al menos 1 cosa seleccionada?
                ) {
                    // 4. ANOTAR EN LA LISTA
                    aResult.push(oFilterGroupItem);
                }

                return aResult;
            }, []);

            console.log(aFiltersWithValue)
            // 5. ENTREGAR EL REPORTE
            return aFiltersWithValue;
        },

        // CADA DA VEZ QUE MARCO UNA CASILLA
		onSelectionChange: function (oEvent) {
			this.oSmartVariantManagement.currentVariantSetModified(true);
			this.oFilterBar.fireFilterChange(oEvent);

            this.onSearch();
		},

        // gptazo
        onSearch: function () {
            var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {

                var oControl = oFilterGroupItem.getControl(),
                    
                    aSelectedKeys = oControl.getSelectedKeys(),

                    aFilters = aSelectedKeys.map(function (sSelectedKey) {
                        return new Filter({
                            path: oFilterGroupItem.getName(),  // Campo a filtrar (ej: "Category")
                            operator: FilterOperator.Contains, // Operador "Contiene"
                            value1: sSelectedKey               // Valor (ej: "Laptops")
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

            // 2. APLICACIÓN A LA TABLA
            this.oTable.getBinding("items").filter(aTableFilters);

            this.oTable.setShowOverlay(false);
        },

		onFilterChange: function () {
			this._updateLabelsAndTable();
		},

		onAfterVariantLoad: function () {
			this._updateLabelsAndTable();
		},

        getFormattedSummaryText: function() {
            // 1. LLAMA AL MENSAJERO (Internamente ejecuta tu getFiltersWithValues)
            var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

            if (aFiltersWithValues.length === 0) {
                return "No filters active";
            }

            // 2. AQUÍ SE CALCULA EL NÚMERO (.length)
            if (aFiltersWithValues.length === 1) {
                // "1 filter active..."
                return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
            }

            // "3 filters active..."
            return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
        },

		getFormattedSummaryTextExpanded: function() {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			var sText = aFiltersWithValues.length + " filters active",
				aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();

			if (aFiltersWithValues.length === 1) {
				sText = aFiltersWithValues.length + " filter active";
			}

			if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) {
				sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
			}

			return sText;
		},

		_updateLabelsAndTable: function () {
			this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
			this.oSnappedLabel.setText(this.getFormattedSummaryText());
			this.oTable.setShowOverlay(true);
		}
	});
});
