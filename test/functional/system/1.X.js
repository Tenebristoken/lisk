/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
'use strict';

var chai = require('chai');
var expect = require('chai').expect;
var lisk = require('lisk-js');
var async = require('async');

var test = require('../../test');
var _ = test._;

var accountFixtures = require('../../fixtures/accounts');

var randomUtil = require('../../common/utils/random');
var Scenarios = require('../common/scenarios');

var localCommon = require('./common');

var transactionTypes = require('../../../helpers/transactionTypes.js');

describe('send transactions on top of unconfirmed type 1', function () {

	var library, transaction;

	var account = randomUtil.account();
	var dapp = randomUtil.application();
	var transactionWith, transactionWithout;

	localCommon.beforeBlock('second_sign', account, dapp, function (lib, sender) {
		library = lib;
	});

	before('add second signature transaction to pool', function (done) {
		transaction = lisk.signature.createSignature(account.password, account.secondPassword);
		localCommon.addTransaction(library, transaction, function (err, res) {
			expect(res).to.equal(transaction.id);
			done();
		});
	});

	Object.keys(transactionTypes).forEach(function (key, index) {
		it('type' + index + ': ' + key, function (done) {
			switch (key) {
				case 'SEND':
					transactionWithout = lisk.transaction.createTransaction(randomUtil.account().address, 1, account.password);
					transactionWith = lisk.transaction.createTransaction(randomUtil.account().address, 1, account.password, account.secondPassword);
					break;
				case 'SIGNATURE':
					transactionWithout = lisk.signature.createSignature(account.password, account.secondPassword);
					transactionWith = lisk.signature.createSignature(account.password, account.secondPassword);
					break;
				case 'DELEGATE':
					transactionWithout = lisk.delegate.createDelegate(account.password, account.username);
					transactionWith = lisk.delegate.createDelegate(account.password, account.username, account.secondPassword);
					break;
				case 'VOTE':
					transactionWithout = lisk.vote.createVote(account.password, ['+' + accountFixtures.existingDelegate.publicKey]);
					transactionWith = lisk.vote.createVote(account.password, ['+' + accountFixtures.existingDelegate.publicKey], account.secondPassword);
					break;
				case 'MULTI':
					transactionWithout = lisk.multisignature.createMultisignature(account.password, null, ['+' + accountFixtures.existingDelegate.publicKey], 1, 1);
					transactionWith = lisk.multisignature.createMultisignature(account.password, account.secondPassword, ['+' + accountFixtures.existingDelegate.publicKey], 1, 1);
					break;
				case 'DAPP':
					transactionWithout = lisk.dapp.createDapp(account.password, null, randomUtil.guestbookDapp);
					transactionWith = lisk.dapp.createDapp(account.password, account.secondPassword, randomUtil.guestbookDapp);
					break;
				case 'IN_TRANSFER':
					transactionWithout = lisk.transfer.createInTransfer(dapp.id, 1, account.password);
					transactionWith = lisk.transfer.createInTransfer(dapp.id, 1, account.password, account.secondPassword);
					break;
				case 'OUT_TRANSFER':
					transactionWithout = lisk.transfer.createOutTransfer(dapp.id, randomUtil.transaction().id, randomUtil.account().address, 1, account.password);
					transactionWith = lisk.transfer.createOutTransfer(dapp.id, randomUtil.transaction().id, randomUtil.account().address, 1, account.password, account.secondPassword);
					break;
			};

			async.parallel({
				without: function (eachCb) {
					return localCommon.addTransaction(library, transactionWithout, eachCb);
				},
				with: function (eachCb) {
					return localCommon.addTransaction(library, transactionWith, eachCb);
				}
			}, function (err, res) {
				if (err) {
					if (transactionWith.type == 1){
						expect(err).to.match(/^Transaction is already processed: /);
					} else {
						expect(err).to.equal('Sender does not have a second signature');	
					}
				}
				if (res.without) {
					expect(res.without).to.equal(transactionWithout.id);
				}
				if (res.with) {
					expect(res.with).to.equal(transactionWith.id);
				}
				done();
			});
		});
	});
});