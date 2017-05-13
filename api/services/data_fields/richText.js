/**
 * Generate data type for AppBuilder apps.
 */

var AD = require('ad-utils');

module.exports = {

	getFieldString: function (column) {
		var dfd = AD.sal.Deferred();

		var colString = column.name + ':' + column.type;

		if (column.setting.supportMultilingual == true) {
			colString += ':multilingual';
		}

		dfd.resolve(colString);

		return dfd;
	},

	defaults: {
        type: 'text',
        fieldName: 'richText',
        setting: {
            icon: 'align-right',
            editor: 'richtext',
            filter_type: 'text',
            supportMultilingual: '0',
        }
	}

};