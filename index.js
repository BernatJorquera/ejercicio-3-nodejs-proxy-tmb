require("dotenv").config();
const express = require("express");
const chalk = require("chalk");
const fetch = require("node-fetch");
const { program } = require("commander");
const morgan = require("morgan");
const correspondenciasIdLinea = require("./correspondenciasIdLinea.json");

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

const fetchParadas = async (id) => {
  const urlParadas = `${process.env.TMB_API_URL}/${id}/estacions?app_id=${process.env.TMB_APP_ID}&app_key=${process.env.TMB_APP_KEY}`;
  const resp = await fetch(urlParadas);
  const paradas = await resp.json();
  const respuesta = {
    linea: paradas.features[0].properties.NOM_LINIA,
    descripcion: paradas.features[0].properties.DESC_SERVEI,
    paradas: paradas.features.map(feature => ({
      id: feature.properties.ORDRE_ESTACIO,
      nombre: feature.properties.NOM_ESTACIO
    })).sort((p1, p2) => p1.id - p2.id)
  };
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
app.get("/metro/linea/:id", async (req, res, next) => {
  const { id } = req.params;
  if (id.includes("L")) {
    const corr = correspondenciasIdLinea.filter(corr => corr.linea === id);
    if (corr.length === 0) {
      /* redirect a error, linea introducida no existe o algo asi */
    }
    res.redirect(`/metro/linea/${corr[0].id}`);
    return;
  }
  const respuesta = await fetchParadas(id);
  res.json(respuesta);
});
