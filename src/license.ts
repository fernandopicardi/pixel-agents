import * as vscode from 'vscode';
import { GLOBAL_KEY_LICENSE, LICENSE_KEY_REGEX } from './constants.js';

export interface LicenseStatus {
	isPremium: boolean;
	licenseKey: string | null;
	validationError: string | null;
}

/**
 * Validate license key format: PA-XXXX-XXXX-XXXX-XXXX
 * Uses a weighted checksum (mod 97) to prevent casual guessing.
 */
export function validateLicenseKeyFormat(key: string): { valid: boolean; error?: string } {
	const trimmed = key.trim().toUpperCase();

	if (!LICENSE_KEY_REGEX.test(trimmed)) {
		return { valid: false, error: 'Invalid format. Expected: PA-XXXX-XXXX-XXXX-XXXX' };
	}

	// Extract the 16 alphanumeric characters
	const chars = trimmed.replace(/^PA-/, '').replace(/-/g, '');
	if (chars.length !== 16) {
		return { valid: false, error: 'Invalid key length' };
	}

	// Weighted checksum: sum(charValue * position) mod 97 === 0
	let sum = 0;
	for (let i = 0; i < chars.length; i++) {
		const code = chars.charCodeAt(i);
		// 0-9 → 0-9, A-Z → 10-35
		const value = code >= 48 && code <= 57 ? code - 48 : code - 55;
		sum += value * (i + 1);
	}

	if (sum % 97 !== 0) {
		return { valid: false, error: 'Invalid license key' };
	}

	return { valid: true };
}

/**
 * Get current license status from global state.
 */
export function getLicenseStatus(context: vscode.ExtensionContext): LicenseStatus {
	const key = context.globalState.get<string>(GLOBAL_KEY_LICENSE, '');
	if (!key) {
		return { isPremium: false, licenseKey: null, validationError: null };
	}

	const result = validateLicenseKeyFormat(key);
	if (!result.valid) {
		return { isPremium: false, licenseKey: key, validationError: result.error || 'Invalid key' };
	}

	return { isPremium: true, licenseKey: key, validationError: null };
}

/**
 * Store and validate a license key. Returns updated status.
 */
export function setLicenseKey(context: vscode.ExtensionContext, key: string): LicenseStatus {
	const trimmed = key.trim().toUpperCase();
	const result = validateLicenseKeyFormat(trimmed);

	if (result.valid) {
		context.globalState.update(GLOBAL_KEY_LICENSE, trimmed);
		return { isPremium: true, licenseKey: trimmed, validationError: null };
	}

	return { isPremium: false, licenseKey: trimmed, validationError: result.error || 'Invalid key' };
}

/**
 * Remove stored license key.
 */
export function clearLicenseKey(context: vscode.ExtensionContext): void {
	context.globalState.update(GLOBAL_KEY_LICENSE, undefined);
}

/**
 * Quick check: is the user on premium?
 */
export function isPremium(context: vscode.ExtensionContext): boolean {
	return getLicenseStatus(context).isPremium;
}
