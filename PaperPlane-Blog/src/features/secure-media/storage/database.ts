import type {DeviceIdentity} from "../model/types";

const DATABASE_NAME = 'paperplane-secure-media';
const DATABASE_VERSION = 1;
const IDENTITY_STORE = 'identity';

export async function openMediaDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(IDENTITY_STORE)) database.createObjectStore(IDENTITY_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('无法打开媒体身份数据库'));
    });
}

export async function readIdentity(): Promise<DeviceIdentity | undefined> {
    const database = await openMediaDatabase();
    return transact<DeviceIdentity | undefined>(database, IDENTITY_STORE, 'readonly', store => store.get('device'));
}

export async function writeIdentity(identity: DeviceIdentity): Promise<void> {
    const database = await openMediaDatabase();
    await transact(database, IDENTITY_STORE, 'readwrite', store => store.put(identity, 'device'));
}

function transact<T>(database: IDBDatabase, storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const request = operation(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB 操作失败'));
    });
}
