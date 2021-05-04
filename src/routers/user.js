const { Router } = require('express')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const User = require('../models/user')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new Router()

// 1. Create user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
})

// 2. Login user
router.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(e) {
        res.status(400).send(e)
    }
})

// 3. Logout user
router.post('/users/logout', auth, async (req, res) => {
    const { user, token } = req

    try {
        user.tokens = user.tokens.filter(tokenObj => {
            return tokenObj.token !== token
        })
        await user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

// 4. Logut all user tokens
router.post('/users/logoutAll', auth, async (req, res) => {
    const { user } = req
    
    try {
        user.tokens = []
        await user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

// 5. Read user profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// 6. Update user profile
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates' })
    }

    try {
        const { user } = req
        updates.forEach(update => user[update] = req.body[update])

        await user.save()
        res.send(user)
    } catch(e) {
        res.status(400).send(e)
    }
})

// 7. Delete user profile
router.delete('/users/me', auth, async (req, res) => {
    try {
        const { user } = req
        await user.remove()
        sendCancelationEmail(user.email, user.name)
        res.send(user)
    } catch(e) {
        res.status(500)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please upload a PNG, JPG or JPEG file.'))
        }

        cb(undefined, true)
    }
})

// 8. Upload user avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize(250)
        .png() // No esta convirtiendo a PNG (por alguna razón)
        .toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// 9. Get user avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error('User avatar not found.')
        }

        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

// . Delete user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

module.exports = router

