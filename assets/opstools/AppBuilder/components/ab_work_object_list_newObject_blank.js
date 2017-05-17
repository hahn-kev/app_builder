
/*
 * ab_work_object_list_newObject_blank
 *
 * Display the form for creating a new Application.
 *
 */

function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}


var labels = {

	component: {
		placeholderName: L('ab.object.form.placeholderName', "*Object name"),
	}
}


var idBase = 'ab_work_object_list_newObject_blank';
OP.Component.extend(idBase, function(App) {

	labels.common = App.labels;

	// internal list of Webix IDs to reference our UI components.
	var ids = {
		component: App.unique(idBase + '_component'),

		form: App.unique(idBase + '_blank'),
		buttonSave: App.unique(idBase + '_save'),
		buttonCancel: App.unique(idBase + '_cancel')
	}



	// Our webix UI definition:
	var _ui = {
		id: ids.component,
		header: labels.common.create,
		body: {
			view: "form",
			id: ids.form,
			width: 400,
			rules: {

// TODO:
// name: inputValidator.rules.validateObjectName
			},
			elements: [
				{ view: "text", label: labels.common.formName, name: "name", required: true, placeholder: labels.component.placeholderName, labelWidth: 70 },
				{
					margin: 5,
					cols: [
						{
							view: "button", id: ids.buttonCancel, value: labels.common.cancel, 
							click: function () {
								_logic.cancel();
							}
						},
						{
							view: "button", id: ids.buttonSave, value: labels.common.add, type: "form", 
							click: function () {
								return _logic.save();
							}
						}
					]
				}
			]
		}
	};



	// Our init() function for setting up our UI
	var _init = function( options ) {
		// webix.extend($$(ids.form), webix.ProgressBar);

		// load up our callbacks.
		for(var c in _logic.callbacks) {
			_logic.callbacks[c] = options[c] || _logic.callbacks[c];
		}

	}



	// our internal business logic 
	var _logic = {

		callbacks:{
			onCancel: function() { console.warn('NO onCancel()!') },
			onSave  : function(values, cb) { console.warn('NO onSave()!') },
		},

		
		cancel:function() {

			_logic.formClear();
			_logic.callbacks.onCancel();
		},


		formClear:function() {
			$$(ids.form).clearValidation();
			$$(ids.form).clear();
		},


		/**
		 * @function hide()
		 *
		 * hide this component.
		 */
		hide:function() {

			$$(ids.component).hide();
		},


		/**
		 * @function save
		 *
		 * verify the current info is ok, package it, and return it to be 
		 * added to the application.createModel() method.
		 */
		save:function() {
			var saveButton = $$(ids.buttonSave);
			saveButton.disable();

			var Form = $$(ids.form);

			Form.clearValidation();

			// if it doesn't pass the basic form validation, return:
			if (!Form.validate()) {
				saveButton.enable();
				return false;
			}

			var values = Form.getValues();


			// now send data back to be added:
			_logic.callbacks.onSave(values, function(err) {

				if (err) {
					if (OP.Form.isValidationError(err, Form)) {
						// do I do anything else here?
						// this auto updates the form
					}

					// get notified if there was an error saving.
					saveButton.enable();
					return false;
				} 

				// if there was no error, clear the form for the next
				// entry:
				_logic.formClear();
			});

		},


		/**
		 * @function show()
		 *
		 * Show this component.
		 */
		show:function() {

			$$(ids.component).show();
		}
	}



	// Expose any globally accessible Actions:
	var _actions = {


		/**
		 * @function populateApplicationForm()
		 *
		 * Initialze the Form with the values from the provided ABApplication.
		 *
		 * If no ABApplication is provided, then show an empty form. (create operation)
		 *
		 * @param {ABApplication} Application  	[optional] The current ABApplication 
		 *										we are working with.
		 */
		// populateApplicationForm:function(Application){
			
		// 	_logic.formReset();
		// 	if (Application) {
		// 		// populate Form here:
		// 		_logic.formPopulate(Application);
		// 	}
		// 	_logic.permissionPopulate(Application);
		// 	_logic.show();
		// }

	}


	// return the current instance of this component:
	return {
		ui:_ui,					// {obj} 	the webix ui definition for this component
		init:_init,				// {fn} 	init() to setup this component  
		actions:_actions,		// {ob}		hash of fn() to expose so other components can access.

		_logic: _logic			// {obj} 	Unit Testing
	}

})