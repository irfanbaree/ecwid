require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const https = require('https');
const fs = require('fs');

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
} = process.env;


// Sequelize setup
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql',
    port: DB_PORT || 3306,
});

const Notification = sequelize.define('notification', {
    details: { type: DataTypes.STRING, allowNull: false },
    store_id: { type: DataTypes.STRING, allowNull: false },
    read_flag: { type: DataTypes.BOOLEAN, allowNull: false },
}, { timestamps: true });


const Bill = sequelize.define('bills', {
    bill_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    store_id: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.STRING(2000), allowNull: false },
    trans_id: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'Paid', 'Failed'), allowNull: false, defaultValue: 'Pending' },
    tans_data: { type: DataTypes.TEXT },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW }
}, { timestamps: false });

const StoreDetail = sequelize.define('storedetails', {
    det_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    store_id: { type: DataTypes.INTEGER, allowNull: false },
    billing_name: { type: DataTypes.STRING(100), allowNull: false },
    billing_email: { type: DataTypes.STRING(255), allowNull: false },
    billing_phone: { type: DataTypes.STRING(40), allowNull: false },
    billing_address: { type: DataTypes.STRING(500), allowNull: false },
    billing_country: { type: DataTypes.STRING(100), allowNull: false },
    billing_date: { type: DataTypes.DATEONLY, allowNull: false },
    current_package: { type: DataTypes.INTEGER, allowNull: false },
    trial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 1 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW }
}, { timestamps: false });


sequelize.sync(); // Synchronize models with the database


async function checkBilling() {
    try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD

        const fiveDays = new Date()
        fiveDays.setDate(fiveDays.getDate() + 5)
        const fiveDaysStr = fiveDays.toISOString().split('T')[0]

        console.log(`Checking stores for upcoming billing (in 5 days): ${fiveDaysStr}`)

        // Part A: generate invoices 5 days before billing_date
        const upcomingStores = await StoreDetail.findAll({ where: { billing_date: fiveDaysStr } })
        if (upcomingStores && upcomingStores.length) {
            console.log(`Found ${upcomingStores.length} upcoming stores to invoice in 5 days.`)
            for (const store of upcomingStores) {
                // skip if invoice already exists for that billing_date
                const exists = await Bill.findOne({ where: { store_id: store.store_id, due_date: store.billing_date } })
                if (exists) {
                    console.log(`Upcoming: bill already exists for store ${store.store_id} date ${store.billing_date}, skipping.`)
                    continue
                }

                const bill = await Bill.create({
                    store_id: store.store_id,
                    url: '-',
                    trans_id: '-',
                    status: 'Pending',
                    tans_data: '',
                    due_date: store.billing_date,
                    amount: 14.99, // TODO: compute actual amount based on package
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                console.log(`Upcoming: created bill ${bill.bill_id} for store ${store.store_id} due ${store.billing_date}`)
            }
        } else {
            console.log('No upcoming stores to invoice in 5 days.')
        }

        // Part B: handle stores that have passed their billing_date and still have no invoices
        console.log(`Checking for stores with billing_date on or before today (${todayStr}) that lack invoices.`)
        const pastStores = await StoreDetail.findAll({ where: { billing_date: { [Sequelize.Op.lte]: todayStr } } })
        if (pastStores && pastStores.length) {
            console.log(`Found ${pastStores.length} stores with billing_date <= today.`)
            for (const store of pastStores) {
                // create a bill if none exists for this store and the store.billing_date
                const existing = await Bill.findOne({ where: { store_id: store.store_id, due_date: store.billing_date } })
                if (existing) {
                    // already have a bill for that date
                    continue
                }

                const bill = await Bill.create({
                    store_id: store.store_id,
                    url: '-',
                    trans_id: '-',
                    status: 'Pending',
                    tans_data: '',
                    due_date: store.billing_date,
                    amount: 14.99, // TODO: compute real amount
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                console.log(`Past-due: created bill ${bill.bill_id} for store ${store.store_id} due ${store.billing_date}`)
            }
        } else {
            console.log('No past-due stores without invoices found.')
        }
    } catch (error) {
        console.error('Error checking billing:', error)
    }
}

async function checkStatus() {
    try {
        const today = new Date();
        const billingDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        console.log(`Checking bills with due date before: ${billingDate}`);

        // Fetch bills where due_date < billingDate and status = 'Pending'
        const overdueBills = await Bill.findAll({
            where: {
                due_date: { [Sequelize.Op.lt]: billingDate },
                status: 'Pending'
            }
        });

        if (overdueBills.length === 0) {
            console.log("No overdue pending bills found.");
            return;
        }

        console.log(`Found ${overdueBills.length} overdue pending bills.`);

        const updatedStoreIds = new Set();

        for (const bill of overdueBills) {
            // Update store's active status to false if not already done
            if (!updatedStoreIds.has(bill.store_id)) {
                await StoreDetail.update(
                    { active: false },
                    { where: { store_id: bill.store_id } }
                );
                updatedStoreIds.add(bill.store_id);
                console.log(`Store ${bill.store_id} set to inactive.`);
            }
        }
    } catch (error) {
        console.error("Error checking status:", error);
    }
}


// Run the function once
checkBilling();
checkStatus();