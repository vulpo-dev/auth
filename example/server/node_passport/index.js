let express = require('express')
let cors = require('cors')
let fs = require('fs')
let passport = require('passport')
let JwtStrategy = require('passport-jwt').Strategy
let ExtractJwt = require('passport-jwt').ExtractJwt

let publicKey = fs.readFileSync('../key.pub', { encoding: 'utf8' })

let opts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: publicKey,
}

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    done(null, jwt_payload)
}))

let app = express()

app.use(cors())

app.get('/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => { res.json(req.user) }
)

app.listen(8001, () => {
	console.log('Node Passport server is running')
})