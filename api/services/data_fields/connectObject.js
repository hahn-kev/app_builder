/**
 * Generate data type for AppBuilder apps.
 */

var AD = require('ad-utils'),
	async = require('async');

module.exports = {

	getFieldString: function (column) {
		var dfd = AD.sal.Deferred();

		if (!column.setting.linkType
			|| !column.setting.linkObject
			|| !column.setting.appName) {
			dfd.reject('Parameters is invalid.');
			return dfd;
		}

		var formatAppName = AppBuilder.rules.toApplicationNameFormat(column.setting.appName);

		// fieldName:[model|collection]:linkObjectName:[viaReference]
		var colString = '';
		colString += column.name;
		colString += ':' + column.setting.linkType; // model, collection

		async.series([
			function (next) {
				ABObject.findOne({ id: column.setting.linkObject })
					.fail(next)
					.then(function (object) {
					    if (!object) {
					        console.log('Object not found');
					        console.log('id: ' + column.setting.linkObject);
					        console.log(column.setting);
					        next(new Error('object not found'));
					        return;
					    }
						colString += ':' + AppBuilder.rules.toObjectNameFormat(formatAppName, object.name) // model name

						next();
						return null;
					});
			},
			function (next) {
				if (!column.setting.linkVia) {
					next();
					return;
				}

				ABColumn.findOne({ id: column.setting.linkVia })
					.fail(next)
					.then(function (linkVia) {
						if (linkVia)
							colString += ':' + linkVia.name; // viaReference

						next();
						return null;
					});
			}
		], function (err) {
			if (err)
				dfd.reject(err);
			else
				dfd.resolve(colString);
		});

		return dfd;
	}

};