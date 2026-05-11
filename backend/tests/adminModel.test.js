const bcrypt = require('bcrypt')
const Admin = require('../models/Admin')

describe('Admin Model - Unit Tests', () => {
  test('comparePassword validates a bcrypt-hashed admin password', async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword,
    })

    await expect(admin.comparePassword('admin123')).resolves.toBe(true)
    await expect(admin.comparePassword('wrong-password')).resolves.toBe(false)
  })

  test('schema requires username and password', async () => {
    const admin = new Admin({})

    await expect(admin.validate()).rejects.toThrow()
  })
})
