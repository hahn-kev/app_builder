steal(
	// List your Controller's dependencies here:
	'opstools/BuildApp/models/ABObject.js',
	'opstools/BuildApp/models/ABColumn.js',

	'opstools/BuildApp/controllers/webix_custom_components/ActiveList.js',

	'opstools/BuildApp/controllers/utils/ModelCreator.js',
	'opstools/BuildApp/controllers/utils/ObjectDataTable.js',
	function () {
        System.import('appdev').then(function () {
			steal.import('appdev/ad',
				'appdev/control/control').then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.BuildApp.Components.Grid', {

						init: function (element, options) {
							var self = this;

							self.data = {}; // { viewId: { }, viewId2: { }, ..., viewIdn: { }}
							self.info = {
								name: 'Grid',
								icon: 'fa-table'
							};

							// Model
							self.Model = {
								ABObject: AD.Model.get('opstools.BuildApp.ABObject'),
								ABColumn: AD.Model.get('opstools.BuildApp.ABColumn'),
								ObjectModels: {}
							};

							// Controllers
							var ActiveList = AD.Control.get('opstools.BuildApp.ActiveList'),
								ModelCreator = AD.Control.get('opstools.BuildApp.ModelCreator')

							self.controllers = {
								ModelCreator: new ModelCreator(),
								ObjectDataTables: {}
							};

							self.componentIds = {
								editView: self.info.name + '-edit-view',
								editDataTable: 'ab-datatable-edit-mode',

								columnList: 'ab-datatable-columns-list',

								propertyView: self.info.name + '-property-view'
							};

							self.view = {
								view: "datatable",
								autoheight: true,
								datatype: "json"
							};

							self.getView = function () {
								return self.view;
							};

							self.getEditView = function () {
								var viewId = self.componentIds.editDataTable,
									dataTable = $.extend(true, {}, self.getView());

								dataTable.id = viewId;

								var editView = {
									id: self.componentIds.editView,
									padding: 10,
									rows: [
										dataTable,
										{
											view: 'label',
											label: 'Columns list'
										},
										{
											id: self.componentIds.columnList,
											view: 'activelist',
											template: "<div class='ab-page-grid-column-item'>" +
											"<div class='column-checkbox'>{common.markCheckbox()}</div>" +
											"<div class='column-name'>#label#</div>" +
											"</div>",
											activeContent: {
												markCheckbox: {
													view: "checkbox",
													width: 50,
													on: { /*checkbox onChange handler*/
														'onChange': function (newv, oldv) {
															var item_id = this.config.$masterId,
																data = self.getData(viewId),
																object = $$(self.componentIds.propertyView).getValues().object;

															if (this.getValue()) // Check
																data.visibleColumns.push(item_id);
															else // Uncheck
															{
																var index = data.visibleColumns.indexOf(item_id);
																if (index > -1)
																	data.visibleColumns.splice(index, 1);
															}

															self.renderDataTable(viewId, object);
														}
													}
												}
											}
										}
									]
								};

								return editView;
							};

							self.getPropertyView = function () {
								return {
									view: "property",
									id: self.componentIds.propertyView,
									elements: [
										{ label: "Data source", type: "label" },
										{
											id: 'object',
											name: 'object',
											type: 'richselect',
											label: 'Object',
											template: function (data, dataValue) {
												var selectedData = $.grep(data.options, function (opt) { return opt.id == dataValue; });
												if (selectedData && selectedData.length > 0)
													return selectedData[0].value;
												else
													return "[Select]";
											}
										},
										{ label: "Data table", type: "label" },
										// { label: "Editable", type: "checkbox" }, // TODO
										{
											id: 'removable',
											name: 'removable',
											type: 'richselect',
											label: 'Removable',
											options: [
												{ id: 'enable', value: "True" },
												{ id: 'disable', value: "False" },
											]
										},
										// { label: "Add new row", type: "checkbox" }  // TODO
									],
									on: {
										onAfterEditStop: function (state, editor, ignoreUpdate) {
											if (ignoreUpdate || state.old == state.value) return false;

											var viewId = self.componentIds.editDataTable,
												data = self.getData(viewId),
												propertyValues = $$(self.componentIds.propertyView).getValues();

											switch (editor.id) {
												case 'object':
													var settings = self.getSettings();
													settings.columns = data.visibleColumns;

													self.populateSettings(settings, true);
													break;
												case 'removable':
													self.renderDataTable(viewId, propertyValues.object, propertyValues.removable);
													break;
											}
										}
									}
								};
							};

							self.setApp = function (app) {
								self.app = app;

								// Set app info to model creator
								self.controllers.ModelCreator.setApp(app);
							};

							self.getData = function (viewId) {
								if (!self.data[viewId]) self.data[viewId] = {};

								if (!self.data[viewId].visibleColumns) self.data[viewId].visibleColumns = []; // { viewId: [columnId1, ..., columnIdn], ... }

								return self.data[viewId];
							};

							self.getDataTableController = function (viewId) {
								var dataTableController = self.controllers.ObjectDataTables[viewId];

								if (!dataTableController) {
									var ObjectDataTable = AD.Control.get('opstools.BuildApp.ObjectDataTable');

									self.controllers.ObjectDataTables[viewId] = new ObjectDataTable();
									self.controllers.ObjectDataTables[viewId].setApp(self.app);
									self.controllers.ObjectDataTables[viewId].setReadOnly(true);

									dataTableController = self.controllers.ObjectDataTables[viewId];
								}

								dataTableController.registerDataTable($$(viewId));

								return dataTableController;
							};

							self.render = function (viewId, settings) {
								var q = $.Deferred(),
									data = self.getData(viewId);

								webix.extend($$(viewId), webix.ProgressBar);
								$$(viewId).clearAll();
								$$(viewId).showProgress({ type: 'icon' });

								if (settings.columns)
									data.visibleColumns = $.map(settings.columns, function (cId) { return cId.toString(); });

								AD.util.async.parallel([
									function (callback) {
										self.objects = null;

										// Get object list
										self.Model.ABObject.findAll({ application: self.app.id })
											.fail(function (err) { callback(err); })
											.then(function (result) {
												result.forEach(function (o) {
													if (o.translate)
														o.translate();
												});

												self.objects = result;

												self.getDataTableController(viewId).setObjectList(self.objects);

												// Set object data model
												var object = $.grep(self.objects.attr(), function (obj) { return obj.id == settings.object; })[0];
												if (object) {
													self.controllers.ModelCreator.getModel(object.name)
														.fail(function (err) { callback(err); })
														.then(function (objectModel) {
															self.Model.ObjectModels[settings.object] = objectModel;

															callback();
														});
												}
												else { callback(); }
											});
									},
									function (callback) {
										data.columns = null;

										if (!settings.object) {
											callback();
											return;
										}

										// Get object list
										self.Model.ABColumn.findAll({ object: settings.object })
											.fail(function (err) { callback(err); })
											.then(function (result) {
												result.forEach(function (d) {
													if (d.translate) d.translate();
												});

												data.columns = result;

												callback();
											});
									}
								], function (err, results) {
									if (err) {
										q.reject(err);
										return;
									}

									self.renderDataTable(viewId, settings.object, settings.removable);
									$$(viewId).hideProgress();

									q.resolve();
								});

								var dataTableController = self.getDataTableController(viewId);
								dataTableController.bindColumns([], true, settings.removable);
								dataTableController.registerDeleteRowHandler(function (deletedId) {
									$$(viewId).showProgress({ type: 'icon' });

									self.Model.ObjectModels[settings.object].destroy(deletedId.row)
										.fail(function (err) {
											// TODO message
											$$(viewId).hideProgress();
										})
										.then(function (data) {
											$$(viewId).remove(data.id);

											// TODO message

											$$(viewId).hideProgress();
										});
								});

								return q;
							};

							self.getSettings = function () {
								var propertyValues = $$(self.componentIds.propertyView).getValues(),
									columns = $.map($$(self.componentIds.editDataTable).config.columns, function (c) { return [c.dataId]; });

								var settings = {
									object: propertyValues.object,
									columns: columns.filter(function (c) { return c; }),
									removable: propertyValues.removable
								};

								return settings;
							}

							self.populateSettings = function (settings, selectAll) {
								webix.extend($$(self.componentIds.columnList), webix.ProgressBar);

								$$(self.componentIds.columnList).showProgress({ type: 'icon' });

								var viewId = self.componentIds.editDataTable,
									data = self.getData(viewId);

								// Render dataTable component
								self.render(viewId, settings, selectAll).then(function () {
									// Columns list
									self.bindColumnList(viewId, settings.object);
									$$(self.componentIds.columnList).hideProgress();

									// Properties

									// Data source - Object
									var item = $$(self.componentIds.propertyView).getItem('object');
									item.options = $.map(self.objects, function (o) {
										return {
											id: o.id,
											value: o.label
										};
									});

									// Set property values
									$$(self.componentIds.propertyView).setValues({
										object: settings.object,
										removable: settings.removable || 'disable'
									});

									$$(self.componentIds.propertyView).refresh();

								});
							};

							self.renderDataTable = function (viewId, objectId, includeTrash) {
								var data = self.getData(viewId);

								if (!data.columns) return;

								var propertyValues = $$(self.componentIds.propertyView).getValues();

								if (typeof includeTrash === 'undefined' || includeTrash === null) {
									includeTrash = propertyValues.removable;
								};

								includeTrash = includeTrash === 'enable'; // Convert to boolean

								var columns = data.columns.filter(function (c) {
									return data.visibleColumns.filter(function (v) { return v == c.id }).length > 0;
								});

								if (columns.length < 1) columns = data.columns // Show all

								self.getDataTableController(viewId).bindColumns(columns, true, includeTrash);
								self.populateData(viewId, objectId);
							};

							self.bindColumnList = function (viewId, selectAll) {
								var data = self.getData(viewId);

								$$(self.componentIds.columnList).clearAll();

								if (!data.columns) return;

								var columns = data.columns.attr().slice(0); // Clone array

								// First time to select this object
								var visibleColumns = data.visibleColumns.slice(0);
								if (selectAll && $.grep(columns, function (d) { return visibleColumns.indexOf(d.id.toString()) > -1; }).length < 1) {
									visibleColumns = visibleColumns.concat($.map(columns, function (d) { return d.id.toString(); }));
								}

								// Initial checkbox
								columns.forEach(function (d) {
									d.markCheckbox = visibleColumns.filter(function (c) { return c == d.id; }).length > 0;
								});

								$$(self.componentIds.columnList).parse(columns);
							};

							self.editStop = function () {
								$$(self.componentIds.propertyView).editStop();
							};
						},

						populateData: function (viewId, objectId) {
							var self = this,
								q = $.Deferred();

							if (!self.Model.ObjectModels[objectId]) {
								q.resolve();
								return q;
							}

							if ($$(viewId).showProgress)
								$$(viewId).showProgress({ type: 'icon' });

							self.Model.ObjectModels[objectId].findAll({})
								.fail(function (err) {
									q.reject(err);

									if ($$(viewId).hideProgress)
										$$(viewId).hideProgress();
								})
								.then(function (result) {
									self.getDataTableController(viewId).populateDataToDataTable(result).then(function () {
										q.resolve();

										if ($$(viewId).hideProgress)
											$$(viewId).hideProgress();
									});
								});

							return q;
						},

						resetState: function () {
							this.data = {};
							this.Model.ObjectModels = {};
							this.controllers.ObjectDataTables = {};
						},

						getInstance: function () {
							return this;
						}


					});

				});
		});
	}
);