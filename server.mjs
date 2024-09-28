import express, { query } from 'express';
import querystring from 'querystring';
import path from 'path';

import fs from 'fs';

import https from 'https';

import request from 'request';
const app = new express();

const Client_ID = '3336727e4a6649168242939d5ce03a6f';
const Client_secret = 'bfbd31cdf96e40a59caf4c0131237c2a';


app.get('/', (req, res) => {
  res.sendFile(import.meta.dirname+'/index.html');
});

app.get('/style.css', (req, res) => {
    res.sendFile(import.meta.dirname+'/style.css');
});

app.get('/small', (req, res) => {
    res.sendFile(import.meta.dirname+'/small.html');
});

app.get('/app.js', (req, res) => {
    res.sendFile(import.meta.dirname+'/app.js');
})
app.use("/img",express.static(path.join(import.meta.dirname, 'img')));

app.get('/login', (req, res) => {
    res.redirect('https://accounts.spotify.com/authorize?'+querystring.stringify({
        response_type: 'code',
        client_id: Client_ID,
        scope: 'user-read-private user-read-email streaming',
        redirect_uri: 'https://172.16.3.142:5501/callback'
    }));
    
}
);

app.get('/callback', (req, res) => {
    const code = req.query.code;
    
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: 'https://172.16.3.142:5501/callback',
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(Client_ID + ':' + Client_secret).toString('base64'))
        },
        json: true
    };


    request.post(authOptions, (error, response, body) => {
        const access_token = body.access_token;
        const refresh_token = body.refresh_token;
        console.log(body)
        const uri = 'https://172.16.3.142:5501/#?' + querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token

        });


        res.redirect(uri);
        console.log("User logged in");
    });
    
    
});

app.get('/refresh_token', async (req, res) => {
    const refresh_token = req.query.refresh_token;
    
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token,
                client_id: Client_ID,
                client_secret: Client_secret
            }),
        }).then((response) => {
            return response.json();
        }).then(
            (data) => {
                console.log(req.socket.remoteAddress);
                console.log(data);
                res.send(data);
            }
        )


})

https.createServer({
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
},app).listen(5501);