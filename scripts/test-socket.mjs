import { io } from 'socket.io-client'

const socket = io('http://localhost:4000')
let updates = 0

socket.on('connect', () => console.log('connected', socket.id))

socket.on('prices:snapshot', (prices) => {
  console.log('snapshot:', prices.length, 'coins')
})

socket.on('prices:update', (changed) => {
  updates++
  console.log(
    `update ${updates}:`,
    changed.map((c) => `${c.symbol} ${c.price}`).join(', '),
  )
  if (updates >= 5) {
    socket.close()
    process.exit(0)
  }
})

socket.on('connect_error', (err) => {
  console.error('connect error:', err.message)
  process.exit(1)
})

setTimeout(() => {
  console.error('timeout: fewer than 5 updates in 20s')
  process.exit(1)
}, 20_000)
