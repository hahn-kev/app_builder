
/*
 * ab_work_object_workspace_popupFrozenColumns
 *
 * Manage the Frozen Columns popup.
 *
 */

import ABApplication from "../classes/ABApplication"



function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}


var labels = {

	component: {
		clearAll: L('ab.frozen_fields.clearAll', "*Clear All"),
		// hideAll: L('ab.visible_fields.hideAll', "*Hide All"),
	}
}


var idBase = 'ab_work_object_workspace_popupFrozenColumns';
OP.Component.extend(idBase, function(App) {

	labels.common = App.labels;


	// internal list of Webix IDs to reference our UI components
	var ids = {
		component: App.unique(idBase + '_component'),
		list: App.unique(idBase + "_list"),
	}


	// Our webix UI definition:
	var _ui = {
		view:"popup",
		id: ids.component,
		// modal: true,
		autoheight:true,
		width: 500,
		body: {
			rows: [
				{
					view: 'button', value: labels.component.clearAll, click: function (id, e, node) {
						_logic.clickClearAll(id, e, node);

						// dataTable.define('leftSplit', 0);
						// dataTable.refreshColumns();
						//
						// $$(ids.component).refreshShowIcons();
						// $$(ids.component).callChangeEvent();
					}
				},
				{
					view: 'list',
					id: ids.list,
					width: 250,
					autoheight: true,
					select: false,
					template: '<span style="min-width: 18px; display: inline-block;"><i class="fa fa-circle-o ab-frozen-field-icon"></i>&nbsp;</span> #label#',
					on: {
						onItemClick: function (id, e, node) {
							_logic.clickListItem(id, e, node);

							// dataTable.define('leftSplit', dataTable.getColumnIndex(id) + 1);
							// dataTable.refreshColumns();
							//
							// $$(ids.component).refreshShowIcons();
							// $$(ids.component).callChangeEvent();
						}
					}
				}
			]
		},
		on: {
			onShow: function () {
				_logic.iconsReset();
			}
		}
    }



	// Our init() function for setting up our UI
	var _init = function(options) {

		// register our callbacks:
		for(var c in _logic.callbacks) {
			_logic.callbacks[c] = options[c] || _logic.callbacks[c];
		}

	}


	var CurrentObject = null;

	// our internal business logic
	var _logic = {

		callbacks:{

			/**
			 * @function onChange
			 * called when we have made changes to the hidden field settings
			 * of our Current Object.
			 *
			 * this is meant to alert our parent component to respond to the
			 * change.
			 */
			onChange:function(){}
		},


		/**
		 * @function clickClearAll
		 * the user clicked the [clear all] option.  So show unfreeze all our columns.
		 */
		clickClearAll: function () {
			// store empty string to not freeze any columns
			CurrentObject.workspaceFrozenColumnID = "";
			CurrentObject.save()
			.then(function(){
				_logic.iconsReset();
				_logic.callbacks.onChange()
			})
			.catch(function(err){
				OP.Error.log('Error trying to save workspaceFrozenColumnID', {error:err, fields:"" });
			})
		},


		/**
		 * @function clickListItem
		 * update the list to show which columns are frozen by showing an icon next to the column name
		 */
		clickListItem: function(id, e, node) {
			// update our Object with current frozen column id
			CurrentObject.workspaceFrozenColumnID = id;
			CurrentObject.save()
			.then(function(){
				_logic.iconsReset();
				_logic.callbacks.onChange()
			})
			.catch(function(err){
				OP.Error.log('Error trying to save workspaceFrozenColumnID', {error:err, fields:id });
			})
		},

		/**
		 * @function iconDefault
		 * Hide the icon for the given node
		 * @param {DOM} node  the html dom node of the element that contains our icon
		 */
		iconDefault: function(node) {
			if (node) {
				node.querySelector('.ab-frozen-field-icon').classList.remove("fa-circle");
				node.querySelector('.ab-frozen-field-icon').classList.add("fa-circle-o");
			}
		},


		/**
		 * @function iconFreeze
		 * Show the icon for the given node
		 * @param {DOM} node  the html dom node of the element that contains our icon
		 */
		iconFreeze: function(node) {
			if (node) {
				node.querySelector('.ab-frozen-field-icon').classList.remove("fa-circle-o");
				node.querySelector('.ab-frozen-field-icon').classList.add("fa-circle");
			}
		},

		/**
		 * @function iconsReset
		 * Reset the icon displays according to the current values in our Object
		 */
		iconsReset: function() {
			var List = $$(ids.list);
			var isFrozen = false;

			// for each item in the List
			var id = List.getFirstId();
			while(id) {
				// find it's HTML Node
				var node = List.getItemNode(id);

				if (CurrentObject.workspaceFrozenColumnID == "") {
					// if there isn't any frozen columns just use the plain icon
					_logic.iconDefault(node);
				} else if (isFrozen == false) {
					// if this item is not the frozen id it is frozen until we reach the frozen id
					_logic.iconFreeze(node);
				} else {
					// else just show default icon
					_logic.iconDefault(node);
				}

				if (CurrentObject.workspaceFrozenColumnID == id) {
					isFrozen = true;
				}

				if (CurrentObject.objectWorkspace.hiddenFields.indexOf(id) != -1) {
					node.style.display = "none";
				} else {
					node.style.display = "";
				}

				// next item
				id = List.getNextId(id);
			}

		},


		/**
		 * @function objectLoad
		 * Ready the Popup according to the current object
		 * @param {ABObject} object  the currently selected object.
		 */
		objectLoad: function(object) {
			CurrentObject = object;

			// refresh list
			var allFields = CurrentObject.fields();
			var listFields = [];
			allFields.forEach((f) => {
				listFields.push({
					id: f.id,
					label: f.label,
					$css:"hidden_fields_"+f.id
				})
			})

			$$(ids.list).parse(listFields);
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