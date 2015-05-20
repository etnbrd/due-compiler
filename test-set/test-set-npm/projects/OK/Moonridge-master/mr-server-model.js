var exposeMethods = require('./mr-rpc-methods');
var EventBus = require('./schema-events');
var _ = require('lodash');
var logger = require('./logger/logger');

/**
 * @param {String} name
 * @param {Schema} schema NOTE: don't use these properties on your schemas: '$$hashKey', '__id', '__v', those names are
 * reserved for angular and Mongoose
 * @param {Object} opts
 * @param {Boolean} opts.readOnly will expose only find and sub/pub methods
 * @param {Object} opts.permissions should look something like:
 * 		example: {
			C: 1,
			R: 0,
			U: 5,
			D: 5
		}
 * @param {Object} opts.pres will extend the mongoose schema.pres calling respective methods before an event occurs with next as first param
 * @param {Object} opts.statics will extend the mongoose schema.statics so that you can call this function on your model
 * @param {Function} opts.authFn will be passed to socket.io-rpc as authorization function for the whole model channel
 * @param {Function} opts.schemaInit gives you opportunity to use schema before mongoose model is instantiated
 * @returns {*}
 * @constructor
 */
module.exports = function MRModel(name, schema, opts) {
    opts = opts || {};

    /**
     * is overriden for liveQueries
     * @param next
     * @param doc
     */
    var callNext = function (next, doc) {
        next();
    };
    _.extend(schema, {owner: { type: this.Schema.Types.ObjectId, ref: 'user' }});   //user model should have owner field also
    //mongoose schema
    var mgSchema = new this.Schema(schema);

    mgSchema.pres = {
        preCreate: callNext,
        preUpdate: callNext,
        preRemove: callNext
    };

    if (opts.statics) {
        _.extend(mgSchema.statics, opts.statics);
    }
    if (opts.pres) {
        _.extend(mgSchema.pres, opts.pres);
    }
	var schemaInit = function() {
		if (opts.schemaInit) {
			logger.debug('schemaInit for ' + name);
			opts.schemaInit(mgSchema);
		}
	};

	schemaInit();

    var paths = mgSchema.paths;
    var pathPermissions = {};
    for (var prop in paths) {
        if (paths[prop].options) {
            var perm = paths[prop].options.permissions; // looks like {R: 10, W: 20}
            if (perm) {
                pathPermissions[prop] = perm;
            }
        }
    }
    mgSchema.pathPermissions = pathPermissions; // prepared object for handling access controll

    var schemaEvS = new EventBus();
    mgSchema.eventBus = schemaEvS;
    // Create subscribers hashtable, holds reference to all registered event handlers
    var fireEvent = schemaEvS.fire;
	var unsubscribe = schemaEvS.unsubscribe;


    mgSchema.pre('save', function preSave(next) {
        this._wasNew = this.isNew;
		if (this.isNew) {
			mgSchema.pres.preCreate(next, this);
		} else {
			mgSchema.pres.preUpdate(next, this)
		}
    });

    // Hook `save` post method called after creation/update
    mgSchema.post('save', function postSave(doc) {
        if (doc._wasNew) {
            fireEvent.call(this, 'create');
        } else {
            fireEvent.call(this, 'update');
        }
        return true;
    });

    mgSchema.pre('remove', function preRemove(next) {
        mgSchema.pres.preRemove(next, this);
    });

	mgSchema.post('remove', function postRemove(doc) {
        fireEvent.call(this, 'remove');
//        console.log('%s has been removed', doc._id);
    });

	mgSchema.static('on', schemaEvS.subscribe);
    mgSchema.static('onCUD', function (callback) {
        schemaEvS.subscribe(['create', 'update', 'remove'], callback);
	});

    mgSchema.static('off', unsubscribe);
    // Create model from schema

    var model = this.model(name, mgSchema);

    var exposeCallback = exposeMethods(model, mgSchema, opts);

    return {
		model: model,
		reInitialize: schemaInit,
		schema: mgSchema,
		_exposeCallback: exposeCallback
	};

};