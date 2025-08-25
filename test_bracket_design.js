#!/usr/bin/env node

/**
 * Test script to reproduce the current tournament bracket page design
 * This will help us see the current "no matches" state before making changes
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Create the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

async function testBracketDesign() {
  try {
    console.log('🚀 Starting test for tournament bracket design...')

    await app.prepare()

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    server.listen(port, (err) => {
      if (err) throw err
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('')
      console.log('🔍 Test URLs to check:')
      console.log(`• Tournament with no matches: http://localhost:3000/tournaments/6/bracket`)
      console.log(`• Tournament with matches: http://localhost:3000/tournaments/1/bracket`)
      console.log('')
      console.log('📋 What to look for:')
      console.log('• Current "No Matches Yet" section styling')
      console.log('• Current button layout and styling')
      console.log('• Overall dark theme implementation')
      console.log('• Navigation and layout structure')
      console.log('')
      console.log('Press Ctrl+C to stop the server when done testing')
    })

  } catch (error) {
    console.error('❌ Error starting test server:', error)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('\n👋 Test server stopped')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n👋 Test server stopped')
  process.exit(0)
})

testBracketDesign()
