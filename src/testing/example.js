import { connectDB } from "../db/connect.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";

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

const MIN_COUNT = 50;
const MAX_COUNT = 300;
const MIN_EXPENSE = 5;
const MAX_EXPENSE = 500;
const MIN_INCOME = 100;
const MAX_INCOME = 5000;

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

function buildIncomeTransaction() {
	return {
		title: pickOne(INCOME_TITLES),
		amount: randomInt(MIN_INCOME, MAX_INCOME),
		transactionType: "income",
		date: randomDate(new Date("2025-01-01"), new Date()),
	};
}

/**
 * @param {number} availableBalance
 */
function buildExpenseTransaction(availableBalance) {
	const maxAllowed = Math.min(MAX_EXPENSE, Math.floor(availableBalance));
	if (maxAllowed < MIN_EXPENSE) {
		return null;
	}

	return {
		title: pickOne(EXPENSE_TITLES),
		amount: randomInt(MIN_EXPENSE, maxAllowed),
		transactionType: "expense",
		category: pickOne(EXPENSE_CATEGORIES),
		date: randomDate(new Date("2025-01-01"), new Date()),
	};
}

async function getCurrentTotals() {
	const [summary] = await Transaction.aggregate([
		{
			$group: {
				_id: null,
				incomeTotal: {
					$sum: {
						$cond: [{ $eq: ["$transactionType", "income"] }, "$amount", 0],
					},
				},
				expenseTotal: {
					$sum: {
						$cond: [{ $eq: ["$transactionType", "expense"] }, "$amount", 0],
					},
				},
			},
		},
	]);

	return {
		incomeTotal: summary?.incomeTotal ?? 0,
		expenseTotal: summary?.expenseTotal ?? 0,
	};
}

/**
 * Keep a running balance so generated expenses never push expenses above income.
 * @param {number} count
 * @param {number} startingBalance
 */
function buildBalancedTransactions(count, startingBalance) {
	const docs = [];
	let balance = startingBalance;

	for (let index = 0; index < count; index += 1) {
		const preferExpense = Math.random() < 0.7;
		const expenseCandidate = preferExpense ? buildExpenseTransaction(balance) : null;

		if (expenseCandidate) {
			docs.push(expenseCandidate);
			balance -= expenseCandidate.amount;
			continue;
		}

		const income = buildIncomeTransaction();
		docs.push(income);
		balance += income.amount;
	}

	return docs;
}

/**
 * Generates a mini transactions dataset (50-300 by default) and inserts it into DB.
 * @param {number} [count]
 */
export async function seedMiniTransactions(count) {
	const finalCount = Number.isInteger(count) ? count : randomInt(50, 300);

	if (finalCount < MIN_COUNT || finalCount > MAX_COUNT) {
		throw new Error("count must be between 50 and 300");
	}

	await connectDB();

	try {
		await Transaction.deleteMany({});
		const { incomeTotal, expenseTotal } = await getCurrentTotals();
		const startingBalance = incomeTotal - expenseTotal;
		const docs = buildBalancedTransactions(finalCount, startingBalance);

		docs.sort((left, right) => left.date.getTime() - right.date.getTime());

		const inserted = await Transaction.insertMany(docs);
		console.log(`Inserted ${inserted.length} transactions with balance-aware generation`);
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
