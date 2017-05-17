/*
 * Edit object popup 
 *
 * .
 *
 */


function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}



var labels = {

	component: {
		menu: L('ab.application.menu', "*Application Menu"),
		confirmDeleteTitle: L('ab.application.delete.title', "*Delete application"),
		confirmDeleteMessage: L('ab.application.delete.message', "*Do you want to delete <b>{0}</b>?")
	}
}


var idBase = 'ab_work_object_list_popupEditObject';
OP.Component.extend(idBase, function (App) {

	labels.common = App.labels;


	var ids = {
		menu: App.unique(idBase + '_menu')
	}



	var _ui = {
		view: "popup",
		id: ids.menu,
		head: labels.component.menu,
		width: 100,
		body: {
			view: "list",
			borderless: true,
			data: [
				{ command: labels.common.rename, icon: "fa-pencil-square-o" },
				{ command: labels.common.delete, icon: "fa-trash" }
			],
			datatype: "json",
			template: "<i class='fa #icon#' aria-hidden='true'></i> #command#",
			autoheight: true,
			select: false,
			on: {
				'onItemClick': function (timestamp, e, trg) {
					return _logic.onItemClick(timestamp, e, trg);
				}
			}
		}
	}



	var _data = {};


	var _init = function (options) {
		webix.ui(_ui);

		_logic.hide();

		// register our callbacks:
		for (var c in _logic.callbacks) {
			_logic.callbacks[c] = options[c] || _logic.callbacks[c];
		}

	}


	var _logic = {

		callbacks: {
			onClick: function (action) {

			}
		},

		/**
		 * @function onItemClick
		 * process which item in our popup was selected.
		 */
		onItemClick: function (timestamp, e, trg) {

			// hide our popup before we trigger any other possible UI animation: (like .edit)
			// NOTE: if the UI is animating another component, and we do .hide()
			// while it is in progress, the UI will glitch and give the user whiplash.

			switch (trg.textContent.trim()) {
				case labels.common.rename:
					this.callbacks.onClick('rename');
					break;
				case labels.common['delete']:
					this.callbacks.onClick('delete');
					break;
			}

			this.hide();

			return false;
		},

		show: function(itemNode) {
			$$(ids.menu).show(itemNode);
		},

		hide: function() {
			$$(ids.menu).hide();
		}

	}



	return {
		ui: _ui,
		init: _init,

		show: _logic.show,

		_logic: _logic	// exposed for Unit Testing
	}
})