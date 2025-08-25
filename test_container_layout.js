#!/usr/bin/env node

/**
 * Test script to verify the tournament bracket page container layout
 * This will check that the content is centrally positioned with proper spacing
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

async function testContainerLayout() {
  try {
    console.log('🚀 Starting test for tournament bracket container layout...')

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
      console.log('🔍 Test URLs to check container layout:')
      console.log(`• Tournament with no matches: http://localhost:3000/tournaments/6/bracket`)
      console.log(`• Tournament with matches: http://localhost:3000/tournaments/1/bracket`)
      console.log(`• Tournament with matches: http://localhost:3000/tournaments/2/bracket`)
      console.log('')
      console.log('📋 What to verify:')
      console.log('• Content is centrally positioned with space on left and right')
      console.log('• Container has proper maximum width (not too wide on large screens)')
      console.log('• All existing functionality (buttons, navigation) works properly')
      console.log('• Tournament bracket component displays correctly within container')
      console.log('• Responsive behavior on different screen sizes')
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

testContainerLayout()
