const express = require('express')
const cassandra = require('cassandra-driver')
const router = express.Router()

const Uuid = cassandra.types.Uuid

const client = new cassandra.Client({
    contactPoints: ["apache-cassandra"],
    localDataCenter: "datacenter1",
});

const keyspace = 'session_service'
const table = 'sessions'


async function init(){
    const create_keyspace = "CREATE KEYSPACE IF NOT EXISTS Session_Service WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 3 }"
    const create_table = "CREATE TABLE IF NOT EXISTS Session_Service.Sessions(userId INT, serverId INT, PRIMARY KEY ((userId), serverId))"
    await client.execute(create_keyspace, [])
    await client.execute(create_table, [])
}

init()

client.connect(function(err, result){
    if(err)
        console.log({"err": err})
    else
        console.log("Cassandra connected")
})

const get_all_sessions= `SELECT * FROM ${keyspace}.${table}`
const insert_one_session = `INSERT INTO ${keyspace}.${table} (userid, serverid) VALUES (?, ?)`
const get_all_sessions_user = `SELECT * FROM ${keyspace}.${table} WHERE userid = ? ALLOW FILTERING`
const get_all_users_session = `SELECT * FROM ${keyspace}.${table} WHERE serverid = ? ALLOW FILTERING`
const delete_one_session = `DELETE FROM ${keyspace}.${table} WHERE userid = ? AND serverid = ?`


/**
 * @openapi
 * '/session':
 *  get:
 *     tags:
 *     - Session
 *     summary: Get all sessions
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  userid:
 *                    type: number
 *                    default: 1
 *                  serverid:
 *                    type: number
 *                    default: 1
 *
 *       400:
 *         description: Bad Request
 */

router.get('/', function(req,res){
    client.execute(get_all_sessions, [], function(err, result){
        if(err){
            res.status(400).send("Bad Request")
        } else {
            res.json(result.rows)
        }
    })
})

/**
 * @openapi
 * '/session':
 *  post:
 *     tags:
 *     - Session
 *     summary: Create a session
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              userid:
 *                type: number
 *                default: 1
 *              serverid:
 *                type: number
 *                default: 1
 *     responses:
 *      201:
 *        description: Created
 *      400:
 *        description: Bad Request(maybe id exists in the db)
 */

router.post('/', function(req, res){
    client.execute(insert_one_session,
                   [req.body.userid, req.body.serverid],
                   { prepare: true },
                   (err, result) => {
                       if (err) {
                           console.log(err)
                           res.status(400).send("Bad Request")
                       } else {
                           res.status(201).send("Created")
                       }
                   })

})

/**
 * @openapi
 * '/session/user/{userid}':
 *  get:
 *     tags:
 *     - Session
 *     summary: Get all sessions of user
 *     parameters:
 *      - name: userid
 *        in: path
 *        description: The unique id of the user
 *        required: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *          application/json:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  userid:
 *                    type: number
 *                    default: 1
 *                  serverid:
 *                    type: number
 *                    default: 1
 *
 *       400:
 *         description: Bad Request
 */


router.get('/user/:userid', function(req, res){
    client.execute(get_all_sessions_user, [req.params.userid],
                   { prepare: true },
                   (err, result) => {
                       if(err || result.rows.length == 0){
                           console.log(err)
                           res.status(404).send("Not found")
                       } else{
                           res.json(result.rows)
                       }
                   })
})

/**
 * @openapi
 * '/session/server/{serverid}':
 *  get:
 *     tags:
 *     - Session
 *     summary: Get all users of session
 *     parameters:
 *      - name: serverid
 *        in: path
 *        description: The unique id of the session(serverid)
 *        required: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *          application/json:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  userid:
 *                    type: number
 *                    default: 1
 *                  serverid:
 *                    type: number
 *                    default: 1
 *
 *       400:
 *         description: Bad Request
 */


router.get('/server/:serverid', function(req, res){
    client.execute(get_all_users_session, [req.params.serverid],
                   { prepare: true },
                   (err, result) => {
                       if(err || result.rows.length == 0){
                           console.log(err)
                           res.status(404).send("Not found")
                       } else{
                           res.json(result.rows)
                       }
                   })
})


/**
 * @openapi
 * '/session/{userid}/server/{serverid}':
 *  delete:
 *     tags:
 *     - Session
 *     summary: Remove user from session
 *     parameters:
 *      - name: userid
 *        in: path
 *        description: The unique id of the user
 *        required: true
 *      - name: serverid
 *        in: path
 *        description: The unique id of the server
 *        required: true

 *     responses:
 *      200:
 *        description: Removed
 *      404:
 *        description: Not Found
 */

router.delete('/:userid/server/:serverid', function(req, res){
    client.execute(delete_one_session,
                   [req.params.userid, req.params.serverid],
                   { prepare: true },
                   (err, result) => {
                       if(err){
                           console.log(err)
                           res.status(404).send("Not found")
                       } else{
                           console.log(result)
                           res.send("Removed")
                       }
                   })
})



module.exports = router
