steal(
	// List your Controller's dependencies here:
	'opstools/BuildApp/models/ABPageComponent.js',

	'opstools/BuildApp/controllers/webix_custom_components/ActiveList.js',
	function () {
        System.import('appdev').then(function () {
			steal.import('appdev/ad',
				'appdev/control/control').then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.BuildApp.InterfaceLayoutView', {

						init: function (element, options) {
							var self = this;

							self.options = AD.defaults({
								editComponentEvent: 'AB_Page.EditComponent',
								savedComponentEvent: 'AB_Page.SavedComponent',
								cancelComponentEvent: 'AB_Page.CancelComponent'
							}, options);

							// Call parent init
							self._super(element, self.options);
							self.Model = AD.Model.get('opstools.BuildApp.ABPageComponent');
							self.data = {};

							self.componentIds = {
								layoutToolbar: 'ab-interface-layout-toolbar',
								layoutToolbarHeader: 'ab-interface-layout-toolbar-header',

								saveComponentInfo: 'ab-interface-save-component-info',
								cancelComponentInfo: 'ab-interface-cancel-component-info',

								layoutSpace: 'ab-interface-layout-space',

								componentList: 'ab-interface-componentList'
							};

							self.initMultilingualLabels();
							self.initControllers();
							self.initWebixUI();
						},

						initMultilingualLabels: function () {
							var self = this;
							self.labels = {};
							self.labels.common = {};
							self.labels.interface = {};
							self.labels.interface.component = {};

							self.labels.common.save = AD.lang.label.getLabel('ab.common.save') || "Save";
							self.labels.common.cancel = AD.lang.label.getLabel('ab.common.cancel') || "Cancel";
							self.labels.common.yes = AD.lang.label.getLabel('ab.common.yes') || "Yes";
							self.labels.common.no = AD.lang.label.getLabel('ab.common.no') || "No";
							self.labels.common.createErrorMessage = AD.lang.label.getLabel('ab.common.create.error') || "System could not create <b>{0}</b>.";
							self.labels.common.createSuccessMessage = AD.lang.label.getLabel('ab.common.create.success') || "<b>{0}</b> is created.";
							self.labels.common.deleteErrorMessage = AD.lang.label.getLabel('ab.common.delete.error') || "System could not delete <b>{0}</b>.";
							self.labels.common.deleteSuccessMessage = AD.lang.label.getLabel('ab.common.delete.success') || "<b>{0}</b> is deleted.";

							self.labels.interface.component.layoutHeader = AD.lang.label.getLabel('ab.interface.component.layoutHeader') || "Page Layout";
							self.labels.interface.component.getErrorMessage = AD.lang.label.getLabel('ab.interface.component.getErrorMessage') || "System could not load components in this page";
							self.labels.interface.component.confirmDeleteTitle = AD.lang.label.getLabel('ab.interface.component.confirmDeleteTitle') || "Delete component";
							self.labels.interface.component.confirmDeleteMessage = AD.lang.label.getLabel('ab.interface.component.confirmDeleteMessage') || "Do you want to delete <b>{0}</b>?";
						},

						initControllers: function () {
							var self = this;
							self.controllers = {};

							var ActiveList = AD.Control.get('opstools.BuildApp.ActiveList');

							this.controllers.ActiveList = new ActiveList();
						},

						initWebixUI: function () {
							var self = this;

							self.data.definition = {
								rows: [
									{
										view: 'toolbar',
										id: self.componentIds.layoutToolbar,
										cols: [
											{
												view: 'label',
												id: self.componentIds.layoutToolbarHeader,
												label: self.labels.interface.component.layoutHeader
											},
											{
												view: 'button',
												id: self.componentIds.saveComponentInfo,
												label: self.labels.common.save,
												width: 100,
												click: function () {
													if (!self.data.editedComponentId) return;

													var editedComponent = $.grep(self.data.componentsInPage, function (c) { return c.id == self.data.editedComponentId; })[0],
														component = self.data.components[editedComponent.attr('component')],
														editViewId = component.getEditView().id;

													$$(editViewId).showProgress({ type: 'icon' });

													component.editStop();

													editedComponent.attr('setting', component.getSettings());

													editedComponent.save()
														.fail(function (err) {
															$$(editViewId).hideProgress();
														})
														.then(function (result) {
															self.element.trigger(self.options.savedComponentEvent, {});

															// Update item in list
															var updatedItem = $$(self.componentIds.componentList).getItem(self.data.editedComponentId);
															updatedItem.setting = result.attr('setting');
															$$(self.componentIds.componentList).updateItem(self.data.editedComponentId, updatedItem);

															self.openLayoutViewMode();

															self.generateComponentsInList();

															$$(editViewId).hideProgress();
														});
												}
											},
											{
												view: 'button',
												id: self.componentIds.cancelComponentInfo,
												label: self.labels.common.cancel,
												width: 100,
												click: function () {
													self.openLayoutViewMode();

													self.element.trigger(self.options.cancelComponentEvent, {});
												}
											}
										]
									},
									{
										id: self.componentIds.layoutSpace,
										autowidth: true,
										cells: [
											{
												view: 'activelist',
												id: self.componentIds.componentList,
												drag: 'target',
												select: false,
												type: {
													height: 'auto'
												},
												activeContent: {
													editButton: {
														view: 'button',
														value: 'Edit',
														width: 50,
														earlyInit: true,
														on: {
															onItemClick: function (id, e) { // Open Component view
																var item_id = $$(self.componentIds.componentList).locate(e),
																	item = $$(self.componentIds.componentList).getItem(item_id),
																	component = self.data.components[item.name];

																self.data.editedComponentId = item_id;

																if ($$(item.name + '-edit-view')) {
																	if (!item.setting) item.setting = {};

																	// Set page list
																	switch (item.name) {
																		case "Menu":
																			item.setting.page = self.data.page;
																			break;
																		case "Grid":
																			item.setting.appId = self.data.appId;
																			break;
																	}

																	component.populateSettings(item.setting);

																	$$(self.componentIds.layoutToolbarHeader).define('label', item.name + ' View');
																	$$(self.componentIds.layoutToolbarHeader).refresh();

																	$$(self.componentIds.saveComponentInfo).show();
																	$$(self.componentIds.cancelComponentInfo).show();

																	$$(item.name + '-edit-view').show();
																}

																self.element.trigger(self.options.editComponentEvent, { item: item });
															}
														}
													}
												},
												template: function (obj, common) {
													var templateHtml = '<div class="ab-component-in-page">' +
														'<div class="ab-component-item-name">' +
														'<div><i class="fa #icon#"" aria-hidden="true"></i> #name#</div>' +
														'<div>{common.editButton()}</div>' +
														'</div>' +
														'<div class="ab-component-item-display">' +
														'<div id="ab-layout-component-#id#"></div>' + //#view#
														'<i class="fa fa-times ab-component-remove"></i>' +
														'</div>' +
														'</div>';

													// Replace values to template
													for (var key in obj) {
														templateHtml = templateHtml.replace(new RegExp('#' + key + '#', 'g'), obj[key]);
													}

													// Generate Edit button
													var editButtonView = common['editButton'] ? common['editButton'].apply(this, arguments) : "";
													templateHtml = templateHtml.replace('{common.editButton()}', editButtonView);

													// // Set component view
													// var componentView = common[obj.name] ? common[obj.name].apply(this, arguments) : "";
													// templateHtml = templateHtml.replace(/#view#/g, componentView);

													return templateHtml;
												},
												externalData: function (data, id) {
													if (id) {
														$$(self.componentIds.componentList).showProgress({ type: 'icon' });

														var addNewComponent = self.Model.newInstance();
														addNewComponent.attr('page', self.data.page.attr('id'));
														addNewComponent.attr('component', data.name);
														addNewComponent.attr('weight', $$(self.componentIds.componentList).count());

														addNewComponent.save()
															.fail(function (err) {
																$$(self.componentIds.componentList).hideProgress();

																webix.message({
																	type: "error",
																	text: self.labels.common.createErrorMessage.replace("{0}", data.name)
																});

																AD.error.log('Add Component : Error add component', { error: err });
															})
															.then(function (result) {
																$$(self.componentIds.componentList).data.changeId(id, result.attr('id'));

																var existsCom = $.grep(self.data.componentsInPage, function (c) { c.id == result.attr('id') });
																if (existsCom && existsCom.length > 0) {
																	self.data.componentsInPage.forEach(function (c) {
																		if (c.id == result.attr('id'))
																			c = result;
																	});
																}
																else {
																	self.data.componentsInPage.push(result);
																}

																webix.message({
																	type: "success",
																	text: self.labels.common.createSuccessMessage.replace('{0}', data.name)
																});

																$$(self.componentIds.componentList).hideProgress();
															});

													}

													return data;
												},
												on: {
													onBeforeDrop: function (context, ev) {
														for (var i = 0; i < context.source.length; i++) {
															context.from.copy(context.source[i], context.start, this, webix.uid());
														}

														self.hideDropAreaZone();

														return false;
													}
												},
												onClick: {
													"ab-component-remove": function (e, id, trg) {
														var deletedComponent = $$(self.componentIds.componentList).getItem(id);

														if (!deletedComponent) return false;

														webix.confirm({
															title: self.labels.interface.component.confirmDeleteTitle,
															ok: self.labels.common.yes,
															cancel: self.labels.common.no,
															text: self.labels.interface.component.confirmDeleteMessage.replace('{0}', deletedComponent.name),
															callback: function (result) {
																if (result) {

																	$$(self.componentIds.componentList).showProgress({ type: "icon" });

																	// Call server to delete object data
																	self.Model.destroy(id)
																		.fail(function (err) {
																			$$(self.componentIds.componentList).hideProgress();

																			webix.message({
																				type: "error",
																				text: self.labels.common.deleteErrorMessage.replace("{0}", deletedComponent.name)
																			});

																			AD.error.log('Component : Error delete component', { error: err });
																		})
																		.then(function (result) {
																			$$(self.componentIds.componentList).remove(id);

																			webix.message({
																				type: "success",
																				text: self.labels.common.deleteSuccessMessage.replace('{0}', deletedComponent.name)
																			});

																			$$(self.componentIds.componentList).hideProgress();

																		});
																}

															}
														});

														return false;
													}
												}
											} // End component list
										] // End cells
									}
								]
							};
						},

						webix_ready: function () {
							var self = this;

							$$(self.componentIds.layoutToolbar).hide();

							webix.extend($$(self.componentIds.componentList), webix.ProgressBar);

							for (var key in self.data.components) {
								var editView = self.data.components[key].getEditView();
								if (editView) {
									webix.extend($$(editView.id), webix.ProgressBar);
								}
							}
						},

						getUIDefinition: function () {
							return this.data.definition;
						},

						setAppId: function (id) {
							var self = this;

							self.data.appId = id;
						},

						setPage: function (page) {
							var self = this;

							self.resetState();

							$$(self.componentIds.componentList).showProgress({ type: 'icon' });
							$$(self.componentIds.layoutToolbar).show();

							self.data.page = page;

							self.Model.findAll({ page: page.attr('id') })
								.fail(function (err) {
									$$(self.componentIds.componentList).hideProgress();

									webix.message({
										type: "error",
										text: self.labels.interface.component.getErrorMessage
									});

									AD.error.log('Get components in page : Error get components', { error: err });
								})
								.then(function (result) {
									self.data.componentsInPage = result;

									var definedComponents = $.map(result.attr(), function (r) {
										var com = {
											id: r.id,
											name: r.component,
											weight: r.weight,
											setting: r.setting
										};

										return com;
									});

									definedComponents.forEach(function (c) {
										var comObj = self.data.components[c.name];

										if (comObj)
											c.icon = comObj.info.icon;
									});

									definedComponents.sort(function (a, b) { return a.weight - b.weight });

									$$(self.componentIds.componentList).parse(definedComponents);

									self.generateComponentsInList();

									$$(self.componentIds.componentList).hideProgress();
								});
						},

						setComponents: function (components) {
							var self = this;

							self.data.components = components;

							// Get layout space definition
							var layoutSpaceDefinition = $.grep(self.data.definition.rows, function (r) { return r.id == self.componentIds.layoutSpace; });
							layoutSpaceDefinition = (layoutSpaceDefinition && layoutSpaceDefinition.length > 0) ? layoutSpaceDefinition[0] : null;

							for (var key in self.data.components) {
								var editView = self.data.components[key].getEditView();
								if (editView)
									layoutSpaceDefinition.cells.push(editView);
							}
						},

						openLayoutViewMode: function () {
							var self = this;

							self.data.editedComponentId = null;

							$$(self.componentIds.layoutToolbarHeader).define('label', self.labels.interface.component.layoutHeader);
							$$(self.componentIds.layoutToolbarHeader).refresh();

							$$(self.componentIds.saveComponentInfo).hide();
							$$(self.componentIds.cancelComponentInfo).hide();

							$$(self.componentIds.componentList).show();
						},

						generateComponentsInList: function () {
							var self = this;

							// Generate component in list
							self.data.componentsInPage.forEach(function (c) {
								var view = self.data.components[c.attr('component')].getView();

								if (view) {
									var setting = c.attr('setting');

									view = $.extend(true, {}, view);
									view.id = 'ab-layout-component-{0}'.replace('{0}', c.attr('id'));
									view.container = view.id;
									// view.disabled = true;

									// Populate data
									for (var key in setting) {
										view[key] = setting[key].attr ? setting[key].attr() : setting[key];
									}

									webix.ui(view);
								}
							});

						},

						startDragComponent: function () {
							var self = this;

							self.showDropAreaZone();

							if (self.data.dropAreaTimeout)
								window.clearTimeout(self.data.dropAreaTimeout);

							self.data.dropAreaTimeout = setTimeout(function () {
								self.hideDropAreaZone();
							}, 3000)
						},

						showDropAreaZone: function () {
							webix.html.addCss($$(this.componentIds.componentList).getNode(), "ab-component-drop-area");
						},

						hideDropAreaZone: function () {
							webix.html.removeCss($$(this.componentIds.componentList).getNode(), "ab-component-drop-area");
						},

						resetState: function () {
							var self = this;

							self.data.editedComponentId = null;

							$$(self.componentIds.layoutToolbar).hide();

							$$(self.componentIds.saveComponentInfo).hide();
							$$(self.componentIds.cancelComponentInfo).hide();

							$$(self.componentIds.componentList).show();

							$$(self.componentIds.componentList).clearValidation();
							$$(self.componentIds.componentList).clearAll();
						}

					});
				});
		})
	});