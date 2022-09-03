const http = require('http');
const cookie = require('cookie');
const qs = require("qs");
const fs = require('fs');


const server = http.createServer((req, res) => {
    let path = req.url;

    let checkLogin = (req, res) => {
        let cookieLogin = {
            name: '',
            password: '',
            sessionId: ''
        }
        let check = checkCookie(req)
        if (check) {
            res.writeHead(301, {"Location":"/profile"});
            res.end()
        } else {
            let data = fs.readFileSync('Views/login.html', 'utf-8');
            res.writeHead(200, { "content-type": "text/html" });
            res.write(data);
            res.end()
        }
    }

    let login = (req, res) => {
        if (req.method === 'GET') {
            checkLogin(req, res);
        } else {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => {
                let newData = qs.parse(data);
                let results = JSON.parse(fs.readFileSync('loginInfo.json'));
                let nameFile = newData.name;
                let dataCookie = {
                    name: newData.name,
                    password: newData.password,
                    sessionId: nameFile
                }
                let dataSession = {
                    name: newData.name,
                    password: newData.password
                }
                if (newData.name === results.name && newData.password === results.password) {
                    let setCookie = cookie.serialize('user', JSON.stringify(dataCookie), {
                        httpOnly: true,
                        maxAge: 60 * 7
                    })
                    res.setHeader("Set-Cookie", setCookie);
                    fs.writeFileSync('token/' + nameFile + '.txt', JSON.stringify(dataSession));
                    res.writeHead(301, { "Location": "/profile" });
                    res.end()
                } else if (newData !== results.name || newData.password !== results.password) {
                    res.writeHead(301, { "Location": "/login" })
                    res.end()
                }
            })
        }
    }

    let checkCookie = req => {
        if (req.headers.cookie) {
            let cookies = cookie.parse(req.headers.cookie);
            if (cookies && cookies.user) {
                let cookieLogin = JSON.parse(cookies.user);
                if (cookieLogin.sessionId) {
                    let dataSession = fs.readFileSync('token/' + cookieLogin.sessionId + '.txt', 'utf-8');
                    let userCurrentLogin = JSON.parse(dataSession);
                    if (userCurrentLogin.name === cookieLogin.name && userCurrentLogin.password === cookieLogin.password) {
                        return true;
                    } else  if (userCurrentLogin.name !== cookieLogin.name || userCurrentLogin.password !== cookieLogin.password) {
                        return false;
                    }
                }
            }
        } else return false;
    }

    let profile = (req, res) => {
        if (checkCookie(req) === true) {
            let results = JSON.parse(fs.readFileSync('loginInfo.json', 'utf-8'));
            let data = `<p>
               name: ${results.name}, <br>
               passwords: ${results.password}</p>
           `;
            let datahtml = fs.readFileSync('Views/profile.html', 'utf-8');
            datahtml = datahtml.replace('{profile}', data);
            res.writeHead(200, { "content-type": "text/html" });
            res.write(datahtml);
            res.end()
        } else {
            res.writeHead(301, { "Location": "/login" })
            res.end();
        }
    }

    switch (path) {
        case '/login':
            login(req, res);
            break;
        case '/profile':
            profile(req, res);
            break;
        default:
            res.end();
    }

    
})

server.listen(8080, () => {
    console.log(`Running at http://localhost:8080`);
})