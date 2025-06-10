// storage/session_store.js – Thin wrapper around IndexedDB + localStorage
// Implements persistence layer described in Imaginer_Project.md §4.

/*
Usage example:

import { Session_store } from './storage/session_store.js';
const store = new Session_store();
await store.save({
  created: Date.now() / 1000,
  image_blob: someBlob,
  prompt_text: 'A cat sitting on Mars',
  prompt_imgs: []
});
const all = await store.get_all();
*/

export class Session_store {
    /* ------------------------------------------------------------------ */
    /* Construction & DB initialisation                                   */
    /* ------------------------------------------------------------------ */
    constructor() {
        // Immediately kick off DB opening; store the promise for reuse
        this._db_promise = this._open_db();
    }

    async _open_db() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('imaginer-db', 1);

            request.onupgradeneeded = (event) => {
                const db = /** @type {IDBDatabase} */ (event.target.result);
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('created', 'created', { unique: false });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /* ------------------------------------------------------------------ */
    /* LocalStorage helpers (API key)                                     */
    /* ------------------------------------------------------------------ */

    // --- Per-browser scramble key (generated and stored in localStorage) ---
    static get scramble_key_key() {
        return 'imaginer.scramble_key';
    }

    static get scramble_key() {
        let key = localStorage.getItem(Session_store.scramble_key_key);
        if (!key) {
            // Generate a random key (128 chars, base64)
            const arr = new Uint8Array(96); // 96 bytes = 128 base64 chars
            window.crypto.getRandomValues(arr);
            key = btoa(String.fromCharCode(...arr));
            localStorage.setItem(Session_store.scramble_key_key, key);
        }
        return key;
    }

    static get api_key_key() {
        return 'imaginer.scrambled_api_key';
    }

    // XOR encode/decode, always preserve length
    static _xor(str, key) {
        let out = '';
        for (let i = 0; i < str.length; ++i) {
            out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return out;
    }

    static get_api_key() {
        const scrambled = localStorage.getItem(Session_store.api_key_key);
        if (!scrambled) return '';
        // decode from base64, then xor
        try {
            const bin = atob(scrambled);
            return Session_store._xor(bin, Session_store.scramble_key);
        } catch (e) {
            return '';
        }
    }

    static set_api_key(key) {
        if (key === undefined || key === null) return;
        // xor, then base64 encode
        const scrambled = btoa(Session_store._xor(key, Session_store.scramble_key));
        localStorage.setItem(Session_store.api_key_key, scrambled);
    }

    /* ------------------------------------------------------------------ */
    /* CRUD methods for `images` store                                    */
    /* ------------------------------------------------------------------ */
    /**
     * Save a new image record, including optional mask_blob (PNG or other binary)
     * @param {Object} record - { created, image_blob, prompt_text, prompt_imgs, mask_blob? }
     * @returns {Promise<number>} The generated id
     */
    async save(record) {
        const db = await this._db_promise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            const store = tx.objectStore('images');
            const request = store.add(record);
            request.onsuccess = () => {
                resolve(request.result); // the generated id
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update an existing image record by id, including mask_blob
     * @param {number} id
     * @param {Object} updates - fields to update (e.g. { mask_blob })
     * @returns {Promise<void>}
     */
    async update(id, updates) {
        const db = await this._db_promise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            const store = tx.objectStore('images');
            const get_req = store.get(id);
            get_req.onsuccess = () => {
                const record = get_req.result;
                if (!record) {
                    reject(new Error('Record not found'));
                    return;
                }
                Object.assign(record, updates);
                const put_req = store.put(record);
                put_req.onsuccess = () => resolve();
                put_req.onerror = () => reject(put_req.error);
            };
            get_req.onerror = () => reject(get_req.error);
        });
    }

    /**
     * Get a record by id, including mask_blob if present
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        const db = await this._db_promise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readonly');
            const store = tx.objectStore('images');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all records, including mask_blob if present
     * @param {Object} opts
     * @returns {Promise<Array<Object>>}
     */
    async get_all(opts = { reverse: true }) {
        const db = await this._db_promise;
        const { reverse } = opts;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readonly');
            const store = tx.objectStore('images');
            const index = store.index('created');
            const direction = reverse ? 'prev' : 'next';
            const request = index.openCursor(null, direction);
            const out = [];
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    out.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(out);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id) {
        const db = await this._db_promise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            const store = tx.objectStore('images');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        const db = await this._db_promise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            const store = tx.objectStore('images');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

