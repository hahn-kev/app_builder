
/*
 * ab_work_object_workspace_popupDefineLabel
 *
 * Manage the Add New Data Field popup.
 *
 */


function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}


var labels = {

	component: {

		labelFormat: L('ab.define_label.labelFormat', "*Label format"),
		selectFieldToGenerate: L('ab.define_label.selectFieldToGenerate', "*Select field item to generate format."),
		labelFields: L('ab.define_label.labelFields', "*Fields"),
	}
}


var idBase = 'ab_work_object_workspace_popupDefineLabel';
OP.Component.extend(idBase, function(App) {

	labels.common = App.labels;


	// internal list of Webix IDs to reference our UI components.
	
	var ids = {
		component: App.unique(idBase + '_component'),
		format: App.unique(idBase + '_format'),
		list: App.unique(idBase + '_list'),

		buttonSave: App.unique(idBase + '_buttonSave'),
	}



	// Our webix UI definition:
	var _ui = {
		view:"popup",
		id: ids.component,
		modal: true,
		autoheight:true,
		// maxHeight: 420,

		width: 500,
		body: {
			rows: [
				{
					view: "label",
					label: "<b>{0}</b>".replace("{0}", labels.component.labelFormat)
				},
				{
					view: "textarea",
					id: ids.format,
					height: 100
				},
				{
					view: "label",
					label: labels.component.selectFieldToGenerate
				},
				{
					view: "label",
					label: "<b>{0}</b>".replace("{0}", labels.component.labelFields)
				},
				{
					view: 'list',
					id: ids.list,
					width: 500,
					maxHeight: 180,
					select: false,
					template: '#label#',
					on: {
						onItemClick: function (id, e, node) {
							_logic.onItemClick(id, e, node);
						}
					}
				},
				{
					height: 10
				},
				{
					cols: [
						{
							view: "button", value: labels.common.cancel, width: 100, 
							click: function () {
								_logic.buttonCancel(); 
							}
						},
						{
							view: "button", id: ids.buttonSave, label: labels.common.save, type: "form", width: 120, 
							click: function () {
								_logic.buttonSave();
							}
						}
						
					]
				}
			]
		},
		on: {
			onShow: function () {
				_logic.onShow();
			}
		}
	}


	var _currentObject = null;

	// Our init() function for setting up our UI
	var _init = function(options) {

		// register our callbacks:
		for(var c in _logic.callbacks) {
			_logic.callbacks[c] = options[c] || _logic.callbacks[c];
		}

		webix.extend($$(ids.list), webix.ProgressBar);

	}



	// our internal business logic 
	var _logic = {

		
		buttonCancel:function() {
			$$(ids.component).hide();
		},


		buttonSave:function() {

			// disable our save button
			var ButtonSave = $$(ids.buttonSave);
			ButtonSave.disable();

			// get our current labelFormt
			var labelFormat = $$(ids.format).getValue();

			// start our spinner
			var List = $$(ids.list);
			List.showProgress({ type: 'icon' });

			// convert from our User Friendly {Label} format to our 
			// object friendly {Name} format
			List.data.each(function (d) {
				labelFormat = labelFormat.replace(new RegExp('{' + d.label + '}', 'g'), '{' + d.id + '}');
			});

			// save the value
			_currentObject.labelFormat = labelFormat;
			_currentObject.save()
			.then(function(){

				// all good, so
				List.hideProgress();	// hide the spinner
				ButtonSave.enable();	// enable the save button
				_logic.hide();			// hide the popup

				// alert our parent component we are done with our changes:
				_logic.callbacks.onSave();
			})
			.catch(function(err){
				List.hideProgress();	// hide the spinner
				ButtonSave.enable();	// enable the save button

				// display some error to the user:
				OP.Error.log('Error trying to save our Object', {error:err});
			})
		},


		callbacks:{
			onCancel: function() { console.warn('NO onCancel()!') },
			onSave  : function(field) { console.warn('NO onSave()!') },
		},


		hide:function() {
			$$(ids.component).hide();
		},


		objectLoad: function(object) {
			_currentObject = object;

			// clear our list
			var List = $$(ids.list);
			List.clearAll();


			// refresh list with new set of fields
			var allFields = _currentObject.fields();
			var listFields = [];
			allFields.forEach((f) => {
				listFields.push({
					id: f.name,
					label: f.label
				})
			})

			List.parse(allFields);
		},


		onItemClick: function(id, e, node) {

			var selectedItem = $$(ids.list).getItem(id);

			var labelFormat = $$(ids.format).getValue();
			labelFormat += '{{0}}'.replace('{0}', selectedItem.label);

			$$(ids.format).setValue(labelFormat);
		},


		onShow: function() {

				var labelFormat = _currentObject.labelFormat;

				var Format = $$(ids.format);
				var List = $$(ids.list);

				Format.setValue('');

				Format.enable();
				List.enable();
				$$(ids.buttonSave).enable();


				// our labelFormat should be in a computer friendly {name} format
				// here we want to convert it to a user friendly {label} format
				// to use in our popup:
				if (labelFormat) {
					if (List.data && List.data.count() > 0) {
						List.data.each(function (d) {
							labelFormat = labelFormat.replace('{' + d.id + '}', '{' + d.label + '}');
						});
					}
				}
				else { 
					// no label format:
					// Default to first field
					if (List.data && List.data.count() > 0) {
						var field = List.getItem(List.getFirstId());
						labelFormat = '{' + field.label + '}';
					}
				}

				Format.setValue(labelFormat || '');
		},


		/**
		 * @function show()
		 *
		 * Show this component.
		 * @param {obj} $view  the webix.$view to hover the popup around.
		 */
		show:function($view) {

			$$(ids.component).show($view);
		}

	}



	// Expose any globally accessible Actions:
	var _actions = {


	}


	// return the current instance of this component:
	return {
		ui:_ui,					// {obj} 	the webix ui definition for this component
		init:_init,				// {fn} 	init() to setup this component  
		actions:_actions,		// {ob}		hash of fn() to expose so other components can access.


		// interface methods for parent component:
		objectLoad: _logic.objectLoad,


		_logic: _logic			// {obj} 	Unit Testing
	}

})