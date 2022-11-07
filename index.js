require("dotenv").config();
const axios = require("axios");
const express = require("express");
const path = require("path");
const { Octokit } = require("@octokit/core");

const app = express();
const port = 3000;

const { GITHUB_CLIENT_ID, GITHUB_SECRET } = process.env;
const base_url = "https://github.com/login/oauth";

app.set("view engine", "ejs");
app.set("views", __dirname + "/static");
app.use(express.static(path.join(__dirname, "static")));


app.get("/", (req, res) => {
    res.redirect("/unauthorized");
});

app.get("/unauthorized", (req, res) => {
    res.render(path.join(__dirname, "/static/unauthorized"));
});

app.get('/auth', (req, res) => {

    res.redirect(

        `${base_url}/authorize?client_id=${GITHUB_CLIENT_ID}`,

    );

});

app.get('/authorized', (req, res) => {

    const { login, email, id } = req.query

    res.render(path.join(__dirname, '/static/authorized'), { login, email, id });

})


app.get("/auth-callback", ({ query: { code } }, res) => {
    const body = {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_SECRET,
        code,
    };
    const opts = { headers: { accept: "application/json" } };
    axios
        .post(`${base_url}/access_token`, body, opts)
        .then((_res) => {
            const { access_token } = _res.data;
            getUserData(res, access_token);
        })
        .catch((err) => res.status(500).json({ err: err.message }));
});

const getUserData = async (response, access_token) => {
    const octokit = new Octokit({
        auth: access_token,
    });
    const user = await octokit.request("GET /user", {});
    const { email, login, id } = user.data;
    console.log(user.data);
    response.redirect(`/authorized/?login=${login}&email=${email}&id=${id}`);
};

console.log(`App listening on port: ${port}`);
app.listen(port);
