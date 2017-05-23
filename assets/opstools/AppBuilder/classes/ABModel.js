//
// ABModel
//
// Represents the Data interface for an ABObject data.
//
// 2 ways to use an ABModel to load a DataTable:
// 	Method 1:  
// 	gather all the data externally and send to the DataTable
//		Model.findAll()
//		.then((data)=>{
//			DataTable.parse(data);
//		})
//
// 	Method 2: 
// 	Set the Model object with a condition / skip / limit, then 
// 	use it to load the DataTable:
//		Model.where({})
//		.skip(XX)
//		.limit(XX)
//		.loadInto(DataTable);



function toDC( data ) {
	return new webix.DataCollection({
		data: data,

		// on: {
		// 	onAfterDelete: function(id) {

		// 	}
		// }
	});
}


export default class ABModel {

    constructor(object) {

	  	// link me to my parent ABApplication
	  	this.object = object;

	  	this._where = null;
	  	this._skip = null;
	  	this._limit = null;
  	}



  	///
  	/// Static Methods
  	///
  	/// Available to the Class level object.  These methods are not dependent
  	/// on the instance values of the Application.
  	///



	///
	/// Instance Methods
	///
	modelURL () {
		return '/app_builder/model/application/#appID#/object/#objID#'
		.replace('#appID#', this.object.application.id)
		.replace('#objID#', this.object.id)
	}


	/**
	 * @method findAll
	 * performs a data find with the provided condition.
	 */
	findAll(cond) {

		cond = cond || {};


		// prepare our condition:
		var newCond = {};

		// if the provided cond looks like our { where:{}, skip:xx, limit:xx } format,
		// just use this one.
		if (cond.where) {
			newCond = cond;
		} else {

			// else, assume the provided condition is the .where clause.
			newCond.where = cond;
		}

		return new Promise(
			(resolve, reject) => {

				OP.Comm.Service.get({
					url:this.modelURL(),
					params:newCond
				})
				.then((data)=>{

					// if this object has some multilingual fields, translate the data:
					var mlFields = this.object.multilingualFields();
					if (mlFields.length) {

						data.data.forEach((d)=>{
							OP.Multilingual.translate(d,d, mlFields);
						})
					}

					resolve(data);
				})
				.catch(reject);

			}
		)

	}


	/**
	 * @method loadInto
	 * loads the current values into the provided Webix DataTable
	 * @param {DataTable} DT  A Webix component that can dynamically load data.
	 */
	loadInto( DT ) {
		
		// if a limit was applied, then this component should be loading dynamically
		if (this._limit) {

			DT.define('datafetch', this._limit);
			DT.define('datathrottle',  500 );  // 5 sec
		

			// catch the event where data is requested:
			// here we will do our own findAll() so we can persist
			// the provided .where condition.
			DT.attachEvent("onDataRequest", (start, count) => {
				
				var cond = {
					where:this._where,
					limit:count,
					skip:start
				}

				this.findAll(cond)
				.then((data) => {
					DT.parse(data);
				})
			  
				return false;	// <-- prevent the default "onDataRequest"
			});


			DT.refresh();
		}


		// else just load it all at once:
		var cond = {};
		if (this._where) cond.where = this._where;
		if (this._limit != null) cond.limit = this._limit;
		if (this._skip  != null) cond.skip  = this._skip;

		this.findAll(cond)
		.then((data)=>{
			DT.parse(data);
		})
		.catch((err)=>{
console.error('!!!!!', err);
		})


	}


	/**
	 * @method limit
	 * set the limit value for this set of data
	 * @param {integer} limit  the number or elements to return in this call
	 * @return {ABModel} this object that is chainable.
	 */
	limit(limit) {
		this._limit = limit;
		return this;
	}


	/**
	 * @method skip
	 * set the skip value for this set of data
	 * @param {integer} skip  the number or elements to skip
	 * @return {ABModel} this object that is chainable.
	 */
	skip(skip) {
		this._skip = skip;
		return this;
	}


	/**
	 * @method where
	 * set the where condition for the data being loaded.
	 * @param {json} cond  the json condition statement.
	 * @return {ABModel} this object that is chainable.
	 */
	where(cond) {
		this._where = cond;
		return this;
	}

}