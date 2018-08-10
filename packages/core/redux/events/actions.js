/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { padStart, unionBy, uniq, sortBy } from 'lodash'

import { web3Selector } from '../ethereum/selectors'
import { eventsSelector } from './selectors'

import {
  LOGS_LOADED,
  LOGS_LOADING,
  LOGS_UPDATED,
} from './constants'

// export const pushTx = (address, receipt) => async (dispatch, getState) => {
//   {
//     address = address.toLowerCase()
//     const [tx, block] = await Promise.all([
//       web3.eth.getTransaction(receipt.transactionHash),
//       web3.eth.getBlock(receipt.blockHash)
//     ])
//
//     const desciption = describeTx(
//       {tx, receipt, block},
//       {
//         address,
//         agents: [],
//         getters: rootGetters
//       }
//     )
//
//     const entries = Array.isArray(desciption)
//       ? desciption
//       : [desciption]
//
//     const actualHistory = state.history[address]
//
//     commit(LOGS_UPDATED, {
//       address,
//       cursor: actualHistory
//         ? actualHistory.cursor
//         : null,
//       entries: actualHistory
//         ? [...entries, ...actualHistory.entries]
//         : [...entries]
//     })
//
//     await dispatch('notifications/pushTxEntries', {
//       entries
//     }, {root: true})
//   }
// }
//
// export const pushEvent = (address, log) => async (dispatch, getState) => {
//   address = address.toLowerCase()
//   const [tx, receipt, block] = await Promise.all([
//     web3.eth.getTransaction(log.transactionHash),
//     web3.eth.getTransactionReceipt(log.transactionHash),
//     web3.eth.getBlock(log.blockHash)
//   ])
//
//   const desciption = describeEvent(
//     {log, tx, receipt, block},
//     {
//       address,
//       agents: [],
//       getters: rootGetters
//     }
//   )
//
//   const entries = Array.isArray(desciption)
//     ? desciption
//     : [desciption]
//
//   const actualHistory = state.history[address]
//
//   commit(LOGS_UPDATED, {
//     address,
//     cursor: actualHistory
//       ? actualHistory.cursor
//       : null,
//     entries: actualHistory
//       ? [...entries, ...actualHistory.entries]
//       : [...entries]
//   })
//
//   await dispatch('notifications/pushEventEntries', {
//     entries
//   }, {root: true})
// }

export const loadMoreEvents = (address, blockScanLimit = 5000, logScanLimit = 25) => async (dispatch, getState) => {
  address = '0x4a2d3fc1587494ca2ca9cdeb457cd94be5d96a61'
  console.log('loadMoreEvents: ', address, blockScanLimit, logScanLimit )
  const web3 = web3Selector()(getState())

  await dispatch({
    type: LOGS_LOADING,
    address,
  })

  const allHistory = eventsSelector()(getState())
  console.log('allHistory: ', allHistory, address)
  const history = allHistory[address]
  const toBlock = await web3.eth.getBlock(
    history.cursor == null ? 'latest' : Math.max(0, history.cursor - 1)
  )

  console.log('toBlock: ',toBlock)

  let fromBlock = await web3.eth.getBlock(
    Math.max(0, toBlock.number - blockScanLimit)
  )

  const topic = `0x${padStart(address.substring(2), 64, 0)}`

  const [logs1, logs2, logs3] = await Promise.all(
    [1, 2, 3].map(
      (number) => web3.eth.getPastLogs({
        toBlock: `0x${Number(toBlock.number).toString(16)}`,
        fromBlock: `0x${Number(fromBlock.number).toString(16)}`,
        topics: [0, 1, 2, 3].map((n) => number === n ? topic : null)
      })
    )
  )
  console.log('logs1, logs2, logs3: ', logs1, logs2, logs3)

  let logs = unionBy(
    logs1,
    logs2,
    logs3,
    (entry) => `${entry.blockHash}-${entry.transactionIndex}-${entry.logIndex}`
  ).sort((log1, log2) => {
    const blockDiff = log2.blockNumber - log1.blockNumber
    if (blockDiff !== 0) {
      return blockDiff
    }
    const indexDiff = log2.logIndex - log1.logIndex
    return indexDiff
  })

  if (logs.length > logScanLimit) {
    let index = logScanLimit
    const blockNumber = logs[logScanLimit - 1].blockNumber
    while (logs[index].blockNumber === blockNumber) {
      index++
    }
    logs = logs.slice(0, index)
    //eslint-disable-next-line
    console.warn(`[events] Two many events, skips all after the event number ${index}`)
  }

  if (logs.length === 0) {
    return
  }

  fromBlock = await web3.eth.getBlock(
    logs[logs.length - 1].blockHash
  )

  // const logs

  const blocks = await Promise.all(
    uniq(logs.map((entry) => entry.blockHash))
      .map((blockHash) => web3.eth.getBlock(blockHash))
  )
  console.log('blocks: ', blocks)

  const blocksMap = blocks.reduce(
    (target, block) => {
      target[block.hash] = block
      return target
    },
    {}
  )

  const transactions = await Promise.all(
    uniq(logs.map((entry) => entry.transactionHash), (transactionHash) => transactionHash)
      .map((transactionHash) => web3.eth.getTransaction(transactionHash))
  )

  const transactionsMap = transactions.reduce(
    (target, tx) => {
      target[tx.hash] = tx
      return target
    },
    {}
  )

  const receipts = await Promise.all(
    transactions.map((tx) => web3.eth.getTransactionReceipt(tx.hash))
  )

  const receiptsMap = receipts.reduce(
    (target, receipt) => {
      target[receipt.transactionHash] = receipt
      return target
    },
    {}
  )

  const tree = []
  for (const log of logs) {
    const tx = transactionsMap[log.transactionHash]
    const receipt = receiptsMap[log.transactionHash]
    const block = blocksMap[log.blockHash]

    const blockTree = tree[block.hash] = tree[block.hash] || { block, transactions: {} }
    const txTree = blockTree.transactions[tx.hash] = blockTree.transactions[tx.hash] || { tx, receipt, logs: [] }

    txTree.logs.push(log)
  }

  const entries = []

  for (const { block, transactions } of sortBy(Object.values(tree), (v) => -v.block.timestamp)) {
    for (const { tx, receipt, logs } of Object.values(transactions)) {
      const context = {
        address,
        agents: [],
        // getters: rootGetters
      }

      for (const log of logs) {
        const description = {} // describeEvent({ log, tx, receipt, block }, context)
        if (Array.isArray(description)) {
          entries.push(...description)
        } else {
          entries.push(description)
        }
      }

      if (tx.from.toLowerCase() === address || tx.to.toLowerCase() === address) {
        const description = {} // describeTx({ tx, receipt, block }, context)
        if (Array.isArray(description)) {
          entries.push(...description)
        } else {
          entries.push(description)
        }
      }
    }
  }

  const actualHistory = history[address]
  dispatch({
    type: LOGS_LOADED,
    address,
    cursor: fromBlock.number,
    entries: actualHistory
      ? [...actualHistory.entries, ...entries]
      : entries,
  })
}