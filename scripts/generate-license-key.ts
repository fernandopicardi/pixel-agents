/**
 * Generate valid AgentCraft Premium license keys.
 * Run: npx tsx scripts/generate-license-key.ts [count]
 *
 * Key format: PA-XXXX-XXXX-XXXX-XXXX
 * Validation: weighted checksum sum(charValue * position) mod 97 === 0
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function charValue(c: string): number {
	const code = c.charCodeAt(0);
	return code >= 48 && code <= 57 ? code - 48 : code - 55;
}

function generateKey(): string {
	// Generate 15 random characters
	const chars: string[] = [];
	for (let i = 0; i < 15; i++) {
		chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
	}

	// Calculate what the 16th character needs to be for checksum to work
	// sum(charValue[i] * (i+1)) mod 97 === 0
	let partialSum = 0;
	for (let i = 0; i < 15; i++) {
		partialSum += charValue(chars[i]) * (i + 1);
	}

	// We need: (partialSum + lastCharValue * 16) mod 97 === 0
	// So: lastCharValue * 16 mod 97 === (97 - partialSum mod 97) mod 97
	const target = (97 - (partialSum % 97)) % 97;

	// Find modular inverse of 16 mod 97
	// 16 * x mod 97 === 1 → x = 85 (since 16*85 = 1360 = 14*97 + 2... let me compute)
	// Actually, brute force it for simplicity
	let lastValue = -1;
	for (let v = 0; v < 36; v++) {
		if ((v * 16) % 97 === target) {
			lastValue = v;
			break;
		}
	}

	if (lastValue === -1 || lastValue >= 36) {
		// Rare edge case where no single char works — retry
		return generateKey();
	}

	const lastChar = lastValue < 10
		? String.fromCharCode(48 + lastValue)
		: String.fromCharCode(55 + lastValue);

	chars.push(lastChar);

	// Format: PA-XXXX-XXXX-XXXX-XXXX
	const raw = chars.join('');
	return `PA-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

function validateKey(key: string): boolean {
	const chars = key.replace(/^PA-/, '').replace(/-/g, '');
	if (chars.length !== 16) return false;

	let sum = 0;
	for (let i = 0; i < chars.length; i++) {
		sum += charValue(chars[i]) * (i + 1);
	}
	return sum % 97 === 0;
}

// Main
const count = parseInt(process.argv[2] || '5', 10);
console.log(`Generating ${count} license key(s):\n`);

for (let i = 0; i < count; i++) {
	const key = generateKey();
	const valid = validateKey(key);
	console.log(`  ${key}  ${valid ? '(valid)' : '(INVALID!)'}`);
}
