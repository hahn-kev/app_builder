steal(
	'opstools/BuildApp/controllers/utils/SelectivityHelper.js',
	function (selectivityHelper) {
		webix.protoUI({
			name: "update_records_popup",
			$init: function (config) {
				webix.extend(this, webix.ProgressBar);
			},
			defaults: {
				modal: true,
				body: {
					rows: [
						{
							view: "label",
							width: 500,
							label: "<b>{0}</b>".replace("{0}", "Updating")
						},
						{
							view: "template",
							height: 80,
							borderless: true,
							template: "<div class='ab-main-container ab-update-records-checked-items'></div>"
						},
						{
							view: "label",
							label: "Which values do you want to update?"
						},
						// Update panel
						{ rows: [] },
						{ height: 10 },
						{
							view: 'button',
							label: 'Add more field',
							click: function () {
								var update_records_popup = this.getTopParentView();

								update_records_popup.addNewField();
							}
						},
						{ height: 15 },
						{
							cols: [
								{
									view: "button", label: "Update", type: "form", width: 120,
									click: function () {
										// Update values to records
										var update_records_popup = this.getTopParentView(),
											update_panel = update_records_popup.getChildViews()[0].getChildViews()[3],
											update_items = update_panel.getChildViews();

										if (!update_records_popup.dataCollection) {
											// TODO : Message
											return;
										}
										else if (update_items.length < 1) {
											// TODO : Message
											return;
										}

										// Show loading cursor
										update_records_popup.showProgress({ type: "icon" });

										var updateTasks = [];

										Object.keys(update_records_popup.dataTable.checkedItems).forEach(function (rowId) {
											var modelData = update_records_popup.dataCollection.AD.getModel(rowId);

											update_items.forEach(function (item) {
												var colSelector = item.getChildViews()[0],
													valEditor = item.getChildViews()[2];

												modelData.attr(colSelector.getValue(), valEditor.getValue());
											});

											updateTasks.push(function (next) {
												modelData.save().then(function () {
													next();
												}, next);
											});
										});

										async.parallel(updateTasks, function (err) {
											// Hide loading cursor
											update_records_popup.hideProgress({ type: "icon" });

											if (err) {
												// TODO : Error message
											}
											else {
												update_records_popup.hide();
											}
										});
									}
								},
								{
									view: "button", value: "Cancel", width: 100, click: function () {
										this.getTopParentView().hide();
									}
								}
							]
						}
					]
				},
				on: {
					onShow: function () {
						var update_records_popup = this,
							update_records_form = update_records_popup.getChildViews()[0],
							update_records_panel = update_records_form.getChildViews()[3];

						// Initial selectivity
						selectivityHelper.renderSelectivity(update_records_form.$view, 'ab-update-records-checked-items', true);

						// Show checked items in selectivity
						var checkedItems = [];
						Object.keys(update_records_popup.dataTable.checkedItems).forEach(function (rowId) {
							var rowData = update_records_popup.dataTable.getItem(rowId);

							checkedItems.push({
								id: rowId,
								text: update_records_popup.objectModel.getDataLabel(rowData)
							});
						});
						selectivityHelper.setData($(update_records_form.$view).find('.ab-update-records-checked-items'), checkedItems);

						// Clear children views in update panel
						var remove_items = [],
							update_items = update_records_panel.getChildViews();
						for (var i = 0; i < update_items.length; i++) {
							remove_items.push(update_items[i]);
						}
						remove_items.forEach(function (v) {
							update_records_panel.removeView(v);
						});

						// Add a update field
						update_records_popup.addNewField();
					}
				}
			},
			registerObject: function (objectModel) {
				var update_records_popup = this;

				update_records_popup.objectModel = objectModel;
			},
			registerDataTable: function (dataTable) {
				var update_records_popup = this;

				update_records_popup.dataTable = dataTable;
			},
			registerDataCollection: function (dataCollection) {
				var update_records_popup = this;

				update_records_popup.dataCollection = dataCollection;
			},

			setColumns: function (columns) {
				var update_records_popup = this;

				update_records_popup.columns = columns;
			},

			addNewField: function () {
				var update_records_popup = this,
					update_panel = update_records_popup.getChildViews()[0].getChildViews()[3],
					viewIndex = update_panel.getChildViews().length - 1,
					options = update_records_popup.getFieldList(true);

				update_panel.addView({
					cols: [
						{
							view: "richselect",
							label: "Set",
							labelWidth: 40,
							width: 200,
							options: options,
							value: options[0].id,
							on: {
								"onChange": function (columnId) {
									var update_item = this.getParentView(),
										columnConfig = update_records_popup.dataTable.getColumnConfig(columnId);

									switch (columnConfig.filter_type) {
										case "text":
											inputView = { view: "text" };
											break;
										case "multiselect":
											inputView = { view: "text" };
											break;
										case "date":
											inputView = { view: "datepicker" };

											if (columnConfig.format)
												inputView.format = columnConfig.format;

											break;
										case "number":
											inputView = { view: "text", validate: webix.rules.isNumber };
											break;
										case "list":
											inputView = {
												view: "combo",
												options: columnConfig.filter_options
											};
											break;
										case "boolean":
											inputView = {
												view: "checkbox"
											};
											break;
									}

									// Change component to display value
									update_item.removeView(update_item.getChildViews()[2]);
									update_item.addView(inputView, 2);

									update_records_popup.refreshFieldList();
								}
							}
						},
						{ view: 'label', label: "<b>{0}</b>".replace("{0}", " To "), width: 30 },
						{},
						{
							view: 'button', icon: "trash", type: "icon", width: 30, click: function () {
								var update_item = this.getParentView(),
									update_panel = update_item.getParentView();

								update_panel.removeView(update_item);

								update_records_popup.refreshFieldList();
							}
						}
					]
				});
			},

			getFieldList: function (excludeSelected) {
				var update_records_popup = this,
					update_panel = update_records_popup.getChildViews()[0].getChildViews()[3];

				// TODO : remove this filter
				var options = $.extend({}, update_records_popup.columns).filter(function (opt) {
					return ["text", "multiselect", "date", "number", "list", "boolean"].indexOf(opt.setting.filter_type) > -1;
				});

				// Remove selected columns
				if (excludeSelected) {
					var update_items = update_panel.getChildViews();
					update_items.forEach(function (item, index) {
						var selectedValue = item.getChildViews()[0].getValue();
						if (selectedValue) {
							var removeIndex = null,
								removeItem = $.grep(options, function (f, index) {
									if (f.name == selectedValue) {
										removeIndex = index;
										return true;
									}
									else {
										return false;
									}
								});

							options.splice(removeIndex, 1);
						}
					});
				}

				return $.map(options, function (opt) { return { id: opt.name, value: opt.label } });
			},

			refreshFieldList: function (ignoreRemoveViews) {
				var update_records_popup = this,
					update_panel = update_records_popup.getChildViews()[0].getChildViews()[3],
					fieldList = update_records_popup.getFieldList(false),
					selectedFields = [];
				var removeChildViews = [];

				var update_items = update_panel.getChildViews();
				update_items.forEach(function (item, index) {
					var fieldName = item.getChildViews()[0].getValue(),
						fieldObj = $.grep(fieldList, function (f) { return f.id == fieldName });

					if (fieldObj.length > 0) {
						// Add selected field to list
						selectedFields.push(fieldObj[0]);
					}
				});

				// Field list should not duplicate field items
				update_items = update_panel.getChildViews();
				update_items.forEach(function (item, index) {
					var fieldName = item.getChildViews()[0].getValue(),
						fieldObj = $.grep(fieldList, function (f) { return f.id == fieldName });

					// Remove selected duplicate items
					var selectedFieldsExcludeCurField = $(selectedFields).not(fieldObj);
					var enableFields = $(fieldList).not(selectedFieldsExcludeCurField).get();

					// Update field list
					item.getChildViews()[0].define('options', enableFields);
					item.getChildViews()[0].refresh();
				});
			}

		}, webix.ui.popup);
	}
);