import CryptoJS from 'crypto-js';

export function encryptPassword(password: string, key: string): string {
    return CryptoJS.AES.encrypt(password, key).toString();
}
