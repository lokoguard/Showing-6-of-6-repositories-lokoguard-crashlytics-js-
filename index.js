const fetch = require('node-fetch');

class LokoGuardCrashlyticManager {
    constructor() {
        if (!(LokoGuardCrashlyticManager.instance)) {
            this._base_url = "";
            this._auth_token = "";
            this._additional_info = {};
            this._q = [];
            this._threading_event = false;
            this._thread = null;
            this._exit_reqeusted = false;
            this._exited = false;
            LokoGuardCrashlyticManager.instance = this;
            this._init();
        }
        return LokoGuardCrashlyticManager.instance;
    }

    _init() {
        this._base_url = "";
        this._auth_token = "";
        this._additional_info = {};
        this._q = [];
        this._threading_event = false;
        this._thread = null;
        this._initialize_hook();
        this._start_process_queue();
    }

    static set_creds(base_url, auth_token) {
        (new LokoGuardCrashlyticManager())._set_creds(base_url, auth_token);
    }

    _set_creds(base_url, auth_token) {
        if (base_url.endsWith("/")) {
            base_url = base_url.slice(0, -1);
        }
        this._base_url = base_url;
        this._auth_token = auth_token;
    }

    static set_additional_info(info) {
        (new LokoGuardCrashlyticManager())._set_additional_info(info);
    }

    _set_additional_info(info) {
        if (typeof info !== 'object') {
            console.log("additional info should be an object");
            return;
        }
        this._additional_info = info;
    }

    _initialize_hook() {
        process.on('uncaughtException', (err) => {
            if (typeof (err) === "string") {
                this._queue_trace(err, "");
            } else {
                let message = err.name + " " + err.message;
                let stacktrace = err.stack || '';
                this._queue_trace(message, stacktrace);
            }
        });
    }

    _queue_trace(message, stacktrace) {
        this._q.push([message, stacktrace]);
    }

    _submit_trace(message, stacktrace) {
        try {
            let url = `${this._base_url}/api/agent/crash_log`;
            let payload = {
                "message": message || "",
                "stack_trace": stacktrace || "",
                "other_info": this._additional_info
            };
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._auth_token}`
                },
                body: JSON.stringify(payload)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Request failed to submit');
                    }
                })
                .catch(error => {
                    console.log("Failed to submit trace > " + error);
                });
        } catch (error) {
            console.log("Failed to submit trace > " + error);
        }
    }

    _start_process_queue() {
        this._thread = setInterval(() => {
            if (this._q.length > 0) {
                let [message, stacktrace] = this._q.shift();
                this._submit_trace(message, stacktrace);
            }
            if(this._exit_reqeusted) {
                this._exited = true;
                clearInterval(this._thread);
            }
        }, 10);
    }

    exit_thread() {
        this._exit_reqeusted = true;
    }

    static log_exception(e) {
        let msg = e.toString();
        let trace = e.stack || '';
        if (trace.length === 0) {
            trace = new Error().stack;
        }
        (new LokoGuardCrashlyticManager())._queue_trace(msg, trace);
    }
}

// TODO: fix exit
// process.on('beforeExit', () => {
//     console.log("called")
//     let obj = new LokoGuardCrashlyticManager();
//     obj.exit_thread();
//     // console.log(obj._exit_reqeusted)
//     while(obj._exited ==  false){
//     }
// });

module.exports = LokoGuardCrashlyticManager;