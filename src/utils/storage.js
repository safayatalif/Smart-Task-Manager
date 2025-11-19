// src/utils/storage.js
export const storage = {
    get: (key) => {
        return new Promise((resolve) => {
            try {
                const v = localStorage.getItem(key);
                if (v === null) return resolve(null);
                resolve({ value: v });
            } catch (e) {
                resolve(null);
            }
        });
    },
    set: (key, value) => {
        return new Promise((resolve, reject) => {
            try {
                localStorage.setItem(key, value);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    },
    remove: (key) => {
        return new Promise((resolve) => {
            localStorage.removeItem(key);
            resolve();
        });
    }
};
