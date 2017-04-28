steal(
	// List your Controller's dependencies here:
	'opstools/BuildApp/controllers/data_fields/dataFieldsManager.js',
	function (dataFieldsManager) {
		System.import('appdev').then(function () {
			steal.import('appdev/ad',
				'appdev/control/control').then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.BuildApp.ObjectDataTable', {

						init: function (element, options) {
							var self = this;

							// Call parent init
							this._super(element, options);

							self.data = {};
							self.events = {};
							self.eventIds = {};

							self.initMultilingualLabels();
						},

						initMultilingualLabels: function () {
							var self = this;
							self.labels = {};
							self.labels.common = {};

							self.labels.common.yes = AD.lang.label.getLabel('ab.common.yes') || "Yes";
							self.labels.common.no = AD.lang.label.getLabel('ab.common.no') || "No";

							// Connected data
							self.labels.connectToObjectName = AD.lang.label.getLabel('ab.object.connectToObjectName') || "(Connect to <b>{0}</b>)";

							// Delete row
							self.labels.confirmDeleteRowTitle = AD.lang.label.getLabel('ab.object.deleteRow.title') || "Delete data";
							self.labels.confirmDeleteRowMessage = AD.lang.label.getLabel('ab.object.deleteRow.message') || "Do you want to delete this row?";

						},

						registerDataTable: function (application, object, columns, dataTable) {
							var self = this;
							self.application = application;
							self.object = object;
							self.columns = columns;
							self.dataTable = dataTable;

							// Trash
							if (self.eventIds['onItemClick'] == null) {
								self.eventIds['onItemClick'] = self.dataTable.attachEvent("onItemClick", function (id, e, node) {
									if (e.target.className.indexOf('trash') > -1) {
										webix.confirm({
											title: self.labels.confirmDeleteRowTitle,
											ok: self.labels.common.yes,
											cancel: self.labels.common.no,
											text: self.labels.confirmDeleteRowMessage,
											callback: function (result) {
												if (result) {
													if (self.events.deleteRow)
														self.events.deleteRow(id);
												}

												if (self.dataTable.unselectAll)
													self.dataTable.unselectAll();

												return true;
											}
										});
									}
									else {
										if (self.events.itemClick)
											self.events.itemClick(id, e, node);
									}
								});
							}

							if (self.eventIds['onBeforeRender'] == null) {
								var isFiltered = false,
									waitMilliseconds = 650,
									filterTimeoutId;

								self.eventIds['onBeforeRender'] = self.dataTable.attachEvent('onBeforeRender', function (data) {
									// If there is not have any data, then render immediately webix datatable.
									if (self.dataTable.data == null || self.dataTable.data.count() < 1) return true;

									if (filterTimeoutId) clearTimeout(filterTimeoutId);

									filterTimeoutId = setTimeout(function () {
										// Prevent repeat filter
										if (isFiltered == false) {
											isFiltered = true;

											if (self.dataTable.custom_filters && Object.keys(self.dataTable.custom_filters).length > 0) {
												self.dataTable.filter(function (item) {
													var isVisible = true;
													Object.keys(self.dataTable.custom_filters).forEach(function (filter_key) {
														if (isVisible == false) return;

														isVisible = isVisible && self.dataTable.custom_filters[filter_key](item);
													});

													return isVisible;
												});
											}
											else {
												self.dataTable.filter(function (item) { return true });
											}

											setTimeout(function () {
												isFiltered = false
											}, waitMilliseconds + 100);
										}
									}, waitMilliseconds);

									return isFiltered;
								});
							}

							if (self.eventIds['onAfterRender'] == null) {
								self.eventIds['onAfterRender'] = self.dataTable.attachEvent("onAfterRender", function (data) {
									self.showCustomDisplay.call(self, this);
								});
							}

							var scrollTimeoutId;
							if (self.eventIds['onAfterScroll'] == null) {
								self.eventIds['onAfterScroll'] = self.dataTable.attachEvent("onAfterScroll", function () {
									var dataTable = this;

									if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
									scrollTimeoutId = setTimeout(function () {
										self.showCustomDisplay.call(self, dataTable);
									}, 200);

								});
							}

						},

						showCustomDisplay: function (dataTable) {
							var self = this;
							dataTable.eachRow(function (rowId) {
								dataTable.eachColumn(function (columnId) {
									var itemData = dataTable.getItem(rowId),
										itemNode = dataTable.getItemNode({ row: rowId, column: columnId });

									if (!itemNode || !itemData) return;

									if (itemData.isUnsync) { // Highlight unsync data
										itemNode.classList.add('ab-object-unsync-data');
									}

									var col = self.columns.filter(function (col) { return col.name == columnId })[0];
									if (col == null) return;

									dataFieldsManager.customDisplay(
										col.fieldName,
										self.application,
										self.object,
										col,
										itemData,
										itemData[columnId],
										dataTable.config.id,
										itemNode,
										{
											readOnly: self.data.readOnly
										});

								});
							});
						},

						setReadOnly: function (readOnly) {
							this.data.readOnly = readOnly;
						},

						registerItemClick: function (itemClick) {
							this.events.itemClick = itemClick;
						},

						registerDeleteRowHandler: function (deleteRow) {
							this.events.deleteRow = deleteRow;
						},

						bindColumns: function (application, columns, resetColumns, extraColumns) {
							var self = this,
								extraColumns = extraColumns || {};

							if (resetColumns)
								self.dataTable.clearAll();

							var headers = $.map(columns.attr ? columns.attr() : columns, function (col, i) {

								if (col.width) {
									col.setting.width = col.width;
								}
								else if (col.setting.width) {
									var colWidth = parseInt(col.setting.width);
									if (typeof colWidth === 'number')
										col.setting.width = colWidth;
									else
										col.setting.width = self.calculateColumnWidth(application, col);
								}
								else
									col.setting.width = self.calculateColumnWidth(application, col);

								if (col.setting.format && webix.i18n[col.setting.format])
									col.setting.format = webix.i18n[col.setting.format];

								var mapCol = $.extend(col.setting, {
									id: col.name,
									dataId: col.id,
									label: col.label,
									header: self.getHeader(application, col, self.data.readOnly),
									weight: col.weight,
									fieldName: col.fieldName
								});

								// richselect
								var options = [];
								if (col.setting.options && col.setting.options.length > 0) {
									col.setting.options.forEach(function (opt) {
										options.push({
											id: opt.id,
											value: opt.label || opt.value
										});
									});
								}
								if (options && options.length > 0)
									mapCol.options = options;

								return mapCol;
							});

							headers.sort(function (a, b) { return a.weight - b.weight; });

							if (columns.length > 0) {

								// Select column by checkbox
								if (extraColumns.isSelectVisible && extraColumns.isSelectVisible != false) {
									headers.unshift({
										id: "select_column",
										header: { content: "masterCheckbox", css: "center" },
										template: "{common.checkbox()}",
										css: "center",
										width: 50
									});
								}

								// View column
								if (extraColumns.isViewVisible && extraColumns.isViewVisible != false) {
									headers.push({
										id: "appbuilder_view_detail",
										header: "",
										label: "",
										template: "<span class='go-to-view-detail'>View</span>",
										css: 'ab-object-view-column',
										width: 60
									});
								}

								// Edit column
								if (extraColumns.isEditVisible && extraColumns.isEditVisible != false) {
									headers.push({
										id: "appbuilder_edit_form",
										header: "",
										label: "",
										template: "<span class='go-to-edit-form'>{common.editIcon()}</span>",
										css: { 'text-align': 'center' },
										width: 45
									});
								}

								// Removable
								if (extraColumns.isTrashVisible && extraColumns.isTrashVisible != false) {
									headers.push({
										id: "appbuilder_trash",
										header: "",
										width: 40,
										template: "<span class='trash'>{common.trashIcon()}</span>",
										css: { 'text-align': 'center' }
									});
								}
							}

							self.dataTable.refreshColumns(headers, resetColumns || false);
						},

						getHeader: function (application, col, readOnly) {
							var self = this,
								label = col.label || '';

							// // Show connect object name in header
							// if (col.type === 'connectObject') {
							// 	// Find label of connect object
							// 	var connectObj = application.objects.filter(function (o) {
							// 		return o.id == col.setting.linkObject;
							// 	});

							// 	if (connectObj && connectObj.length > 0)
							// 		label += ' ' + self.labels.connectToObjectName.replace('{0}', connectObj[0].label);
							// }

							var headerTemplate = '<div class="ab-object-data-header">{0}{1}{2}</div>'
								.replace('{0}', col.setting.icon ? '<span class="webix_icon fa-' + col.setting.icon + '"></span>' : '')
								.replace('{1}', label)
								.replace('{2}', readOnly ? '' : '<i class="ab-object-data-header-edit fa fa-angle-down"></i>');

							return {
								text: headerTemplate,
								css: ((col.id && !col.isSynced) ? ' ab-object-data-new-header' : '')
							};
						},

						calculateColumnWidth: function (application, column) {
							if (column.width > 0) return column.width;

							var self = this,
								charWidth = 7,
								charLength = column.label ? column.label.length : 0,
								width = (charLength * charWidth) + 80;

							// if (column.setting.linkObject) {// Connect to... label
							// 	var object = application.objects.filter(function (o) {
							// 		return o.id === column.setting.linkObject;
							// 	});

							// 	if (object && object.length > 0)
							// 		width += object[0].label.length * charWidth + 55;
							// }

							return width;
						},

						populateData: function (data) {
							var self = this;

							self.dataTable.clearAll();

							if (!data) return;

							// Populate data
							if (data instanceof webix.DataCollection) {
								self.dataTable.data.clearAll();
								self.dataTable.data.unsync();
								self.dataTable.data.sync(data);
							}
							else
								self.dataTable.parse(data.attr());

						}

					});
				});
		});
	}
);