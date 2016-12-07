
steal(
	// List your Controller's dependencies here:
	'opstools/BuildApp/controllers/utils/ModelCreator.js',

	function (modelCreator) {
		System.import('appdev').then(function () {
			steal.import('appdev/ad',
				'appdev/control/control').then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.BuildApp.ABLiveTool', {

						init: function (element, options) {
							var _this = this;
							options = AD.defaults({
								app:-1,
								page: -1
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);


							this.initDOM();


							AD.comm.hub.subscribe('ab.interface.update', function(msg, data) {

								if ((data.app == _this.options.app)
									&& (data.page == _this.options.page)) {

									// flush the display
									// rebuild our display

								}
							})
						},

						initDOM: function() {

							this.uuid = this.unique('ab_live_tool');

							console.log('... creating ABLiveTool <div> ');
							this.element.html('<div id="'+this.uuid+'" > HERE IS MY DIV! ('+this.uuid+') </div>');

						},

						unique:function(tag) {
							return [tag, this.options.app, this.options.page].join('_');
						}

					}); // end AD.Control.extend
				});
		});
	}
);