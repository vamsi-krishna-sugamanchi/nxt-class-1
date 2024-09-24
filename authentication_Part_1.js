const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()

app.use(express.json())
const dataBasePath = path.join(__dirname, 'userData.db')
let dataBase = null

const start_server_and_open_database = async () => {
  try {
    dataBase = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
    console.log('server runnig on http://localhost:3000/')
  } catch (error) {
    console.log(`DB ERROR ${error.message}`)
    process.exit(1)
  }
}
start_server_and_open_database()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const usernameQuery = `select * from user where username='${username}';`
  const userNameResult = await dataBase.get(usernameQuery)

  if (userNameResult === undefined) {
    const hashedPassword = await bcrypt.hash(request.body.password, 10)
    const dbQuery = `
    INSERT INTO 
    user
    (username,name,password,gender,location) 
    VALUES
    ('${username}','${name}','${hashedPassword}','${gender}','${location}');`

    if (password.length < 5) {
      response.status(400)

      response.send('Password is too short')
    } else {
      const dbresult = await dataBase.run(dbQuery)
      response.status(200)
      response.send(`User created successfully`)
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const usernameQuery = `select * from user where username='${username}';`
  const userNameResult = await dataBase.get(usernameQuery)
  // const hashedPassword = await bcrypt.hash(request.body.password, 10)
  if (userNameResult === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const is_password_is_valid = await bcrypt.compare(
      password,
      userNameResult.password,
    )
    if (is_password_is_valid) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send(`Invalid password`)
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const usernameQuery = `select * from user where username='${username}';`
  const userNameResult = await dataBase.get(usernameQuery)
  console.log(userNameResult)
  // const hashedPassword = await bcrypt.hash(request.body.password, 10)

  if (userNameResult === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    let is_old_password_is_valid = await bcrypt.compare(
      oldPassword,
      userNameResult.password,
    )
    if (is_old_password_is_valid) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const newhasedpassword = await bcrypt.hash(newPassword, 10)
        const userUpdateQuery = `UPDATE user set password='${newhasedpassword}' where username='${username}';`
        await dataBase.run(userUpdateQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }

  // if (newPassword.length < 5) {
  //   response.send('Password is too short')
  //   response.status(400)
  // } else if (is_old_password_is_valid) {
  //   const newhasedpassword = await bcrypt.hash(newPassword, 10)
  //   const userUpdateQuery = `UPDATE user set password='${newhasedpassword}' where username='${username}';`
  //   await dataBase.run(userUpdateQuery)
  //   response.send('Password updated')
  // } else {
  //   response.send('Invalid current password')
  //   response.status(400)
  // }
})
module.exports = app
