const { getAllSouls } = require('./lib/storage.ts')

async function testSouls() {
  try {
    console.log('Testing soul retrieval...')
    const souls = await getAllSouls('0xaa7ceb9788cc365a150093897f6a6bbd88f066b3')
    console.log('Found souls:', souls.length)
    console.log('Soul data:', JSON.stringify(souls, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testSouls() 