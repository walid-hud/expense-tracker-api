import { connectDB } from "../db/connect.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
// this is AI generated code to seed the database with random transactions
const EXPENSE_CATEGORIES = [
	"food",
	"transport",
	"rent",
	"shopping",
	"health",
	"utilities",
	"entertainment",
	"education",
	"other",
];

const EXPENSE_TITLES = [
	"Grocery Shopping",
	"Bus Ticket",
	"Electricity Bill",
	"Restaurant",
	"Internet Bill",
	"Medicine",
	"Monthly Rent",
	"Movie Night",
	"Book Purchase",
];

const INCOME_TITLES = ["Salary", "Freelance Payment", "Bonus", "Gift", "Refund", "Investment Return"];

/**
 * @param {number} min
 * @param {number} max
 */
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {Date} from
 * @param {Date} to
 */
function randomDate(from, to) {
	const fromMs = from.getTime();
	const toMs = to.getTime();
	return new Date(randomInt(fromMs, toMs));
}

/**
 * @param {Array<string>} items
 */
function pickOne(items) {
	return items[randomInt(0, items.length - 1)];
}

function buildRandomTransaction() {
	const transactionType = Math.random() < 0.75 ? "expense" : "income";
	const isExpense = transactionType === "expense";

	const amount = isExpense ? randomInt(5, 500) : randomInt(100, 5000);
	const title = isExpense ? pickOne(EXPENSE_TITLES) : pickOne(INCOME_TITLES);

	return {
		title,
		amount,
		transactionType,
		category: isExpense ? pickOne(EXPENSE_CATEGORIES) : undefined,
		date: randomDate(new Date("2025-01-01"), new Date()),
	};
}

/**
 * Generates a mini transactions dataset (100-300 by default) and inserts it into DB.
 * @param {number} [count]
 */
export async function seedMiniTransactions(count) {
	const finalCount = Number.isInteger(count) ? count : randomInt(100, 300);

	if (finalCount < 100 || finalCount > 300) {
		throw new Error("count must be between 100 and 300");
	}

	await connectDB();

	try {
		const docs = Array.from({ length: finalCount }, () => buildRandomTransaction());
		const inserted = await Transaction.insertMany(docs);
		console.log(`Inserted ${inserted.length} transactions`);
		return inserted.length;
	} finally {
		await mongoose.connection.close();
	}
}

const cliCount = process.argv[2] ? Number(process.argv[2]) : undefined;

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
	seedMiniTransactions(cliCount)
		.then((insertedCount) => {
			console.log(`Seed completed. Total inserted: ${insertedCount}`);
		})
		.catch((error) => {
			console.error("Seed failed:", error);
			process.exit(1);
		});
}
