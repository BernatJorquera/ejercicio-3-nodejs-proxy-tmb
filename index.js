require("dotenv").config();
const fs = require("fs");
const express = require("express");
const chalk = require("chalk");
const fetch = require("node-fetch");
const { program } = require("commander");
const morgan = require("morgan");
// eslint-disable-next-line import/no-unresolved
const lineasJson = fs.existsSync("./lineas.json") ? require("./lineas.json") : "";

const urlLineas = `${process.env.TMB_API_URL}?app_id=${process.env.TMB_APP_ID}&app_key=${process.env.TMB_APP_KEY}`;

const fetchLineas = async () => {
  const resp = await fetch(urlLineas);
  const lineas = await resp.json();
  const respuesta = lineas.features.map(feature => ({
    id: feature.properties.CODI_LINIA,
    linea: feature.properties.NOM_LINIA,
    descripcion: feature.properties.DESC_LINIA
  }));
  return respuesta;
};

program.option("-p, --puerto <puerto>", "Puerto para el servidor");
program.parse(process.argv);
const options = program.opts();

const app = express();
const puerto = options.puerto || process.env.PUERTO || 5000;

const server = app.listen(puerto, () => {
  console.log(chalk.green(`Usando el puerto ${puerto}`));
});

server.on("error", err => {
  console.log(chalk.red("Ha ocurrido un error al levantar el servidor"));
  if (err.code === "EADDRINUSE") {
    console.log(chalk.red(`El puerto ${puerto} está ocupado`));
  }
});

app.use(morgan("dev"));
app.use(express.static("public"));
app.get("/metro/lineas", async (req, res, next) => {
  const respuesta = await fetchLineas();
  res.json(respuesta);
});

/* hacer redirect desde /L10N a /id_linia10 */
