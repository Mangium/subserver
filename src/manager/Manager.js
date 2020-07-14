const Path = require('path'),
    fs = require('fs'),
    Logger = require('../logger/Logger'),
    Events = require('../events/Events'),
    low = require('lowdb'),
    fisy = require('lowdb/adapters/FileSync'),
    DockerManager = require('../docker/DockerManager');

class Manager {
    /**
     * Subserver manager.
     */
    constructor() {
        this._errors = [];
        this._paths = new Map([
            ["data", Path.join(__dirname, '../../data')],
            ["config", Path.join(__dirname, '../../data/config')],
            ["cache", Path.join(__dirname, '../../data/cache')],
            ["logs", Path.join(__dirname, '../../data/logs')],
            ["err", Path.join(__dirname, '../../data/logs/errors')],
            ["keys", Path.join(__dirname, '../../data/keys')]
        ]);
        this._paths.forEach((v) => {
            if (!fs.existsSync(v)) {
                fs.mkdirSync(v);
            }
        });
        this._logger = new Logger(this, false);
        this._initialized = false;
        this.dodb = false;
    }

    initialize() {
        this.getLogger().info("Initialising subserver...");

        this._events = new Events();

        // config
        if (!fs.existsSync(Path.join(this.getPath("config"), "config.json"))) {
            this._config = low(new fisy(Path.join(this.getPath("config"), 'config.json')));
            this._config.defaults({
                database: {
                    type: "sqlite"
                },
                docker: {
                    version: "v1.40",
                    socketPath: "//./pipe/docker_engine"
                }
            }).write()
        } else {
            this._config = low(new fisy(Path.join(this.getPath("config"), 'config.json')));
        }

        this._dockerManager = new DockerManager(this);
        this._dockerManager.init();

        this._initialized = true;
    }


    /**
     *
     * @returns {Logger}
     */
    getLogger() {
        return this._logger;
    }

    /**
     * Get a path
     * @param {String} name
     * @returns {String}
     */
    getPath(name) {
        return this._paths.get(name);
    }

    /**
     * Set a path
     * @param {String} name
     * @param {String} path
     */
    setPath(name, path) {
        this._paths.set(name, path);
    }

    /**
     *
     * @returns {If<*[AsyncProperty], Promise<Lowdb.Lowdb<RecursivelyExtend<*[ReferenceProperty], AsyncTag>, *>>,
     *     Lowdb.Lowdb<RecursivelyExtend<*[ReferenceProperty], SyncTag>, *>> | If<*[AsyncProperty],
     *     Promise<Lowdb.Lowdb<RecursivelyExtend<*[ReferenceProperty], AsyncTag>, *>>,
     *     Lowdb.Lowdb<RecursivelyExtend<*[ReferenceProperty], SyncTag>, *>>}
     */
    getConfig() {
        return this._config;
    }


    /**
     * Pass an error to mangium if there was an error along the way. The error is sent to the main Mangium instance for logging.
     * @param err
     */
    passError(err) {
        this._errors.push(err);
    }
}

module.exports = Manager;
